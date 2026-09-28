package com.elanjaibuildos.backend.identity.service;

import com.elanjaibuildos.backend.identity.domain.User;
import com.elanjaibuildos.backend.identity.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Canonical tenant username rules: {@code <local>@<slug>}, stored lowercase.
 *
 * Disjointness invariant (02-tenancy/01): within one tenant schema the sets of
 * emails and usernames are strictly disjoint, enforced at write time in both
 * directions — a username equal to any stored email is rejected, an email equal
 * to any stored username is rejected. The suffix is always the tenant slug, so
 * a username in t_acme always ends {@code @acme}.
 */
@Service
public class UsernameService {

    /** <local>: starts alnum, allows [a-z0-9._-], max 64 chars. */
    private static final Pattern LOCAL = Pattern.compile("^[a-z0-9][a-z0-9._-]{0,63}$");

    /** Same slug syntax as TenantSchemaProvisioner (3–30 lowercase alnum+hyphen). */
    private static final Pattern SLUG = Pattern.compile("^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$");

    private final UserRepository users;

    public UsernameService(UserRepository users) {
        this.users = users;
    }

    /** True when the identifier is {@code <local>@<slug-shaped-suffix>} (the username form). */
    public static boolean isUsernameShape(String identifier) {
        int at = identifier.lastIndexOf('@');
        return at > 0 && at < identifier.length() - 1
                && SLUG.matcher(identifier.substring(at + 1)).matches()
                && LOCAL.matcher(identifier.substring(0, at)).matches();
    }

    /** Slug suffix of a canonical username (after the last '@'). */
    public static String suffix(String username) {
        return username.substring(username.lastIndexOf('@') + 1);
    }

    public static boolean isValidLocal(String local) {
        return local != null && LOCAL.matcher(local).matches();
    }

    public static String canonical(String local, String slug) {
        return local + "@" + slug;
    }

    /**
     * Derive a valid local-part from an email local-part — lowercase, invalid
     * chars folded to '.', leading punctuation stripped, truncated to 64.
     * Returns null when nothing usable remains (row must be skipped/flagged).
     */
    public static String deriveLocal(String email) {
        if (email == null) return null;
        int at = email.indexOf('@');
        String raw = (at > 0 ? email.substring(0, at) : email)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9._-]", ".")
                .replaceAll("^[._-]+", "");
        String local = raw.length() > 64 ? raw.substring(0, 64) : raw;
        return LOCAL.matcher(local).matches() ? local : null;
    }

    /** Disjointness: reject an email that equals any stored username in this schema. */
    public void assertEmailNotUsername(String email) {
        if (email != null && users.existsByUsername(email.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("This email conflicts with an existing username.");
        }
    }

    /**
     * Assign the canonical username derived from the user's email.
     * Collision-safe per the identity doc: a candidate equal to ANY stored email
     * (including the user's own) or an existing username leaves username NULL —
     * the row is skipped, never silently aliased. Returns the assigned username
     * or null when skipped.
     */
    public String assignDerived(User user, String slug) {
        String local = deriveLocal(user.getEmail());
        if (local == null) return null;
        String candidate = canonical(local, slug);
        if (candidate.equalsIgnoreCase(user.getEmail())
                || users.existsByEmail(candidate)
                || users.existsByUsername(candidate)) {
            return null;
        }
        user.setUsername(candidate);
        return candidate;
    }

    /**
     * Explicit set/reset from user management. Accepts a bare local-part or the
     * full {@code <local>@<slug>} form; the suffix must equal this workspace's
     * slug. Enforces syntax, disjointness, and uniqueness.
     */
    public String assignExplicit(User user, String localOrFull, String slug) {
        String v = localOrFull == null ? "" : localOrFull.trim().toLowerCase(Locale.ROOT);
        String local;
        if (v.contains("@")) {
            if (!isUsernameShape(v)) {
                throw new IllegalArgumentException("Invalid username format — expected name@" + slug + ".");
            }
            if (!suffix(v).equals(slug)) {
                throw new IllegalArgumentException(
                        "Username workspace '" + suffix(v) + "' does not match this workspace '" + slug + "'.");
            }
            local = v.substring(0, v.lastIndexOf('@'));
        } else {
            local = v;
        }
        if (!isValidLocal(local)) {
            throw new IllegalArgumentException(
                    "Username must be 1–64 chars: lowercase letters, digits, '.', '_', '-', starting with a letter or digit.");
        }
        String candidate = canonical(local, slug);
        if (users.existsByEmail(candidate)) {
            throw new IllegalArgumentException("This username conflicts with an existing email.");
        }
        users.findByUsername(candidate).ifPresent(other -> {
            if (!other.getId().equals(user.getId())) {
                throw new IllegalArgumentException("Username '" + candidate + "' is already taken.");
            }
        });
        user.setUsername(candidate);
        return candidate;
    }
}
