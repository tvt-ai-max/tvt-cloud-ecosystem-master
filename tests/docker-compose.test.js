const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');

const composePath = path.join(__dirname, '..', 'docker-compose.yml');
const composeContent = fs.readFileSync(composePath, 'utf8');
const compose = YAML.parse(composeContent);

describe('docker-compose.yml', () => {
  it('should parse as valid YAML', () => {
    assert.ok(compose, 'docker-compose.yml should be valid YAML');
    assert.ok(compose.services, 'should have services key');
  });

  it('should define all 6 required services', () => {
    const required = ['gateway', 'scanner', 'billing', 'concierge', 'review', 'redis'];
    const defined = Object.keys(compose.services);
    for (const svc of required) {
      assert.ok(defined.includes(svc), `service "${svc}" must be defined`);
    }
  });

  it('should enforce memory limits on all services', () => {
    const limits = {
      gateway: 100,
      scanner: 800,
      billing: 250,
      concierge: 350,
      review: 200,
      redis: 150,
    };

    for (const [svc, maxMB] of Object.entries(limits)) {
      const mem = compose.services[svc]?.deploy?.resources?.limits?.memory;
      assert.ok(mem, `${svc} must have a memory limit`);
      const valueMB = parseInt(mem, 10);
      assert.ok(valueMB <= maxMB, `${svc} memory ${mem} should be <= ${maxMB}M`);
    }
  });

  it('should keep total memory under 2GB', () => {
    let totalMB = 0;
    for (const svc of Object.values(compose.services)) {
      const mem = svc?.deploy?.resources?.limits?.memory;
      if (mem) totalMB += parseInt(mem, 10);
    }
    assert.ok(totalMB < 2048, `total memory ${totalMB}M must be under 2048M`);
  });

  it('should have healthcheck for every service', () => {
    for (const [name, svc] of Object.entries(compose.services)) {
      assert.ok(svc.healthcheck, `${name} must have a healthcheck`);
      assert.ok(svc.healthcheck.test, `${name} healthcheck must have a test`);
    }
  });

  it('should set restart: unless-stopped for all services', () => {
    for (const [name, svc] of Object.entries(compose.services)) {
      assert.strictEqual(svc.restart, 'unless-stopped', `${name} must have restart: unless-stopped`);
    }
  });

  it('should define all required volumes', () => {
    const required = ['scanner-pdfs', 'review-data', 'redis-data'];
    assert.ok(compose.volumes, 'should have volumes key');
    for (const vol of required) {
      assert.ok(compose.volumes[vol] !== undefined, `volume "${vol}" must be defined`);
    }
  });

  it('should define tvt-net network', () => {
    assert.ok(compose.networks, 'should have networks key');
    assert.ok(compose.networks['tvt-net'], 'should define tvt-net network');
  });

  it('should attach all services to tvt-net network', () => {
    for (const [name, svc] of Object.entries(compose.services)) {
      const nets = svc.networks;
      assert.ok(nets, `${name} must have networks`);
      const netList = Array.isArray(nets) ? nets : Object.keys(nets);
      assert.ok(netList.includes('tvt-net'), `${name} must be on tvt-net`);
    }
  });

  it('should expose gateway on ports 80 and 443', () => {
    const ports = compose.services.gateway.ports;
    assert.ok(ports, 'gateway must have ports');
    const portStrings = ports.map(String);
    assert.ok(portStrings.some(p => p.includes('80')), 'gateway must expose port 80');
    assert.ok(portStrings.some(p => p.includes('443')), 'gateway must expose port 443');
  });
});
