package com.elanjaibuildos.backend.identity.api;

import com.elanjaibuildos.backend.identity.domain.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
    private String fullName;
    private String email;
    /** Optional explicit username (bare <local> or <local>@<slug>); derived from email when absent. */
    private String username;
    private String password;
    private String phone;
    private String location;
    private Role role;
}
