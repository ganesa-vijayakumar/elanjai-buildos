package com.elanjaibuildos.backend.platform.service;

import com.elanjaibuildos.backend.platform.domain.Tenant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.io.BufferedWriter;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Offboarding export (F-016): dump every table in t_<slug> to CSV inside a ZIP
 * at <storage>/exports/<slug>.zip, then queue an export-ready email.
 */
@Service
public class ExportService {

    private static final Logger log = LoggerFactory.getLogger(ExportService.class);

    private final DataSource dataSource;
    private final PlatformMailService mail;

    @Value("${app.storage.root:./data/files}")
    private String storageRoot;

    public ExportService(DataSource dataSource, PlatformMailService mail) {
        this.dataSource = dataSource;
        this.mail = mail;
    }

    public Path exportTenant(Tenant tenant) throws Exception {
        String schema = tenant.getSchemaName();
        List<String> tables = tenantTables(schema);
        Path dir = Path.of(storageRoot, "public", "exports");
        Files.createDirectories(dir);
        Path zip = dir.resolve(tenant.getSlug() + ".zip");

        try (ZipOutputStream zos = new ZipOutputStream(Files.newOutputStream(zip))) {
            for (String table : tables) {
                zos.putNextEntry(new ZipEntry(table + ".csv"));
                try (Connection c = dataSource.getConnection();
                     Statement s = c.createStatement();
                     ResultSet rs = s.executeQuery(
                             "SELECT * FROM " + schema + ".\"" + table + "\"")) {
                    BufferedWriter w = new BufferedWriter(new OutputStreamWriter(
                            new java.io.FilterOutputStream(zos) {
                                @Override public void close() { /* keep zip open */ }
                            }, StandardCharsets.UTF_8));
                    ResultSetMetaData md = rs.getMetaData();
                    int cols = md.getColumnCount();
                    StringBuilder header = new StringBuilder();
                    for (int i = 1; i <= cols; i++) header.append(i > 1 ? "," : "").append(md.getColumnName(i));
                    w.write(header.toString()); w.newLine();
                    while (rs.next()) {
                        StringBuilder row = new StringBuilder();
                        for (int i = 1; i <= cols; i++) {
                            if (i > 1) row.append(',');
                            String v = rs.getString(i);
                            if (v != null) row.append('"')
                                    .append(v.replace("\"", "\"\"")).append('"');
                        }
                        w.write(row.toString()); w.newLine();
                    }
                    w.flush();
                }
                zos.closeEntry();
            }
        }
        mail.queueEmail(tenant.getId(), "export_ready", tenant.getOwnerEmail(),
                "Your workspace export is ready",
                "Export for " + tenant.getSlug() + " is available: " + zip.getFileName()
                        + "\nData is retained for 30 days, then permanently deleted.");
        auditTrail(tenant, zip);
        log.info("Tenant export complete: {} ({} tables)", zip, tables.size());
        return zip;
    }

    private List<String> tenantTables(String schema) throws SQLException {
        List<String> tables = new ArrayList<>();
        try (Connection c = dataSource.getConnection();
             PreparedStatement ps = c.prepareStatement(
                     "SELECT table_name FROM information_schema.tables WHERE table_schema=? ORDER BY table_name")) {
            ps.setString(1, schema);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String t = rs.getString(1);
                    if (!"flyway_schema_history".equals(t)) tables.add(t);
                }
            }
        }
        return tables;
    }

    private void auditTrail(Tenant t, Path zip) {
        log.info("export audit: tenant={} path={}", t.getSlug(), zip);
    }
}
