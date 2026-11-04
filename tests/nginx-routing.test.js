const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const nginxConfPath = path.join(__dirname, '..', 'nginx', 'nginx.conf');
const siteConfPath = path.join(__dirname, '..', 'nginx', 'conf.d', 'api.tvtagency.com.conf');

const nginxConf = fs.readFileSync(nginxConfPath, 'utf8');
const siteConf = fs.readFileSync(siteConfPath, 'utf8');

describe('nginx/nginx.conf', () => {
  it('should have worker_processes auto', () => {
    assert.ok(nginxConf.includes('worker_processes auto'), 'must set worker_processes auto');
  });

  it('should enable gzip compression', () => {
    assert.ok(nginxConf.includes('gzip on'), 'must enable gzip');
  });

  it('should configure proxy buffers', () => {
    assert.ok(nginxConf.includes('proxy_buffer_size'), 'must set proxy_buffer_size');
    assert.ok(nginxConf.includes('proxy_buffers'), 'must set proxy_buffers');
  });

  it('should restore Cloudflare real IP', () => {
    assert.ok(nginxConf.includes('real_ip_header CF-Connecting-IP'), 'must set CF-Connecting-IP as real_ip_header');
    assert.ok(nginxConf.includes('set_real_ip_from'), 'must have set_real_ip_from directives');
  });

  it('should disable server tokens', () => {
    assert.ok(nginxConf.includes('server_tokens off'), 'must disable server tokens');
  });
});

describe('nginx/conf.d/api.tvtagency.com.conf', () => {
  it('should define server for api.tvtagency.com', () => {
    assert.ok(siteConf.includes('server_name api.tvtagency.com'), 'must set server_name');
  });

  it('should have location /scanner/ with correct proxy_pass', () => {
    assert.ok(siteConf.includes('location /scanner/'), 'must have /scanner/ location');
    assert.ok(siteConf.includes('proxy_pass http://scanner_upstream/'), 'must proxy to scanner on port 3000');
  });

  it('should have location /billing/ with correct proxy_pass', () => {
    assert.ok(siteConf.includes('location /billing/'), 'must have /billing/ location');
    assert.ok(siteConf.includes('proxy_pass http://billing_upstream/'), 'must proxy to billing on port 3001');
  });

  it('should have location /concierge/ with correct proxy_pass', () => {
    assert.ok(siteConf.includes('location /concierge/'), 'must have /concierge/ location');
    assert.ok(siteConf.includes('proxy_pass http://concierge_upstream/'), 'must proxy to concierge on port 3002');
  });

  it('should have location /review/ with correct proxy_pass', () => {
    assert.ok(siteConf.includes('location /review/'), 'must have /review/ location');
    assert.ok(siteConf.includes('proxy_pass http://review_upstream/'), 'must proxy to review on port 3003');
  });

  it('should set proper proxy headers', () => {
    assert.ok(siteConf.includes('proxy_set_header Host'), 'must set Host header');
    assert.ok(siteConf.includes('proxy_set_header X-Real-IP'), 'must set X-Real-IP header');
    assert.ok(siteConf.includes('proxy_set_header X-Forwarded-For'), 'must set X-Forwarded-For header');
    assert.ok(siteConf.includes('proxy_set_header X-Forwarded-Proto'), 'must set X-Forwarded-Proto header');
  });

  it('should support WebSocket upgrade', () => {
    assert.ok(siteConf.includes('proxy_set_header Upgrade'), 'must set Upgrade header');
    assert.ok(siteConf.includes('proxy_set_header Connection'), 'must set Connection header');
  });

  it('should add security headers', () => {
    assert.ok(siteConf.includes('X-Frame-Options'), 'must set X-Frame-Options');
    assert.ok(siteConf.includes('X-Content-Type-Options'), 'must set X-Content-Type-Options');
    assert.ok(siteConf.includes('Strict-Transport-Security'), 'must set HSTS header');
  });

  it('should define upstream blocks with correct ports', () => {
    assert.ok(siteConf.includes('server scanner:3000'), 'scanner upstream must point to port 3000');
    assert.ok(siteConf.includes('server billing:3001'), 'billing upstream must point to port 3001');
    assert.ok(siteConf.includes('server concierge:3002'), 'concierge upstream must point to port 3002');
    assert.ok(siteConf.includes('server review:3003'), 'review upstream must point to port 3003');
  });
});
