package com.elanjaibuildos.backend.platform.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "platform_settings")
public class PlatformSetting {

    @Id
    @Column(length = 80)
    private String key;

    @Column(columnDefinition = "text")
    private String value;

    @Column(name = "updated_at") private Instant updatedAt = Instant.now();

    public String getKey() { return key; }
    public void setKey(String v) { this.key = v; }
    public String getValue() { return value; }
    public void setValue(String v) { this.value = v; this.updatedAt = Instant.now(); }
}
