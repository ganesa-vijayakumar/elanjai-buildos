/* global __ENV */
// tests/performance/k6/edge-smoke.js
//
// Bounded edge smoke — public endpoints only, no credentials. Used by the
// release workflow's run_load_test check against an ALLOWED_TEST_HOSTS target
// (validated https:// + host allow-list upstream in the resolve job).
//
// Covers the three host classes of the gateway contract
// (Prody enhancements/03-deployment/01): apex → landing, admin.<base> → admin
// console, <slug>.<base> → tenant workspace.
//
//   BASE_URL        required — https://<apex-host> (e.g. https://preprod.example)
//   TENANT_SLUG     optional — tenant slug for the wildcard host (default demo)
//   ADMIN_BASE_URL  optional override — default derives admin.<apex-host>
//   TENANT_BASE_URL optional override — default derives <slug>.<apex-host>
//
// Local run: k6 run -e BASE_URL=https://preprod.example edge-smoke.js

import http from 'k6/http';
import { check, group } from 'k6';

const BASE = (__ENV.BASE_URL || '').replace(/\/+$/, '');
const SLUG = __ENV.TENANT_SLUG || 'demo';
const ADMIN_BASE = (__ENV.ADMIN_BASE_URL || BASE.replace('://', '://admin.')).replace(/\/+$/, '');
const TENANT_BASE = (__ENV.TENANT_BASE_URL || BASE.replace('://', `://${SLUG}.`)).replace(/\/+$/, '');

export const options = {
    vus: 5,
    duration: '30s',
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<3000'],
    },
};

export default function () {
    group('apex -> landing', () => {
        const home = http.get(`${BASE}/`);
        check(home, {
            'landing / 200': (r) => r.status === 200,
            'landing title': (r) => r.body.includes('Construction Management for Builders'),
        });
        const robots = http.get(`${BASE}/robots.txt`);
        check(robots, { 'robots.txt served': (r) => r.status === 200 && r.body.includes('User-agent') });
        const health = http.get(`${BASE}/api/actuator/health`);
        check(health, {
            'api health 200': (r) => r.status === 200,
            'api health UP': (r) => r.body.includes('"status":"UP"'),
        });
    });

    group('admin -> console', () => {
        const res = http.get(`${ADMIN_BASE}/`);
        check(res, {
            'admin / 200': (r) => r.status === 200,
            'admin title': (r) => r.body.includes('Platform Console'),
        });
    });

    group('tenant wildcard -> workspace', () => {
        const res = http.get(`${TENANT_BASE}/`);
        check(res, {
            'tenant / 200': (r) => r.status === 200,
            'tenant title': (r) => r.body.includes('Workspace'),
        });
        const status = http.get(`${TENANT_BASE}/api/public/tenants/${SLUG}/status`);
        check(status, {
            'tenant status 200': (r) => r.status === 200,
            'tenant status payload': (r) => r.json('exists') !== undefined,
        });
    });
}

export function handleSummary(data) {
    return { 'k6-edge-smoke-summary.json': JSON.stringify(data, null, 2) };
}
