import { exampleProjects, validateExampleProject } from '../lib/network/exampleProjects';
import { checkConnectivity } from '../lib/network/connectivity';
import type { SwitchState } from '@/lib/network/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateProjects(lang: 'en' | 'tr') {
  const projects = exampleProjects(lang);
  console.log(`\nValidating ${projects.length} projects for language: ${lang}`);

  // Ensure unique IDs
  const ids = projects.map(p => p.id);
  const uniqueIds = new Set(ids);
  assert(uniqueIds.size === ids.length, `Duplicate project IDs found for ${lang}`);

  // Basic structure validation
  for (const p of projects) {
    assert(typeof p.id === 'string' && p.id.length > 0, `Project missing id`);
    assert(['basic', 'intermediate', 'advanced'].includes(p.level), `Invalid level ${p.level}`);
    assert(!!(p.data && p.data.topology), `Missing topology data`);
    assert(Array.isArray(p.data.topology.devices), `Devices not array`);
    assert(Array.isArray(p.data.topology.connections), `Connections not array`);
    assert(Array.isArray(p.data.topology.notes), `Notes not array`);
    const errors = validateExampleProject(p);
    assert(errors.length === 0, `Validation errors in project ${p.id}: ${errors.join(', ')}`);
  }

  console.log(`All ${projects.length} projects for ${lang} passed basic validation.`);
}

function runConnectivityChecks() {
  const projEn = exampleProjects('en');
  const getProj = (id: string) => projEn.find(p => p.id === id);

  const wlcProj = getProj('wlc-enterprise-wireless');
  assert(!!wlcProj, 'WLC project not found');
  const wapProj = getProj('wap-multi-ssid');
  assert(!!wapProj, 'WAP project not found');

  const runChecks = (proj: any, checks: Array<{ src: string; dst: string; desc: string }>) => {
    const devices = proj.data.topology.devices;
    const connections = proj.data.topology.connections;
    const deviceStates = new Map<string, SwitchState>(proj.data.devices.map((d: any) => [d.id, d.state]));
    for (const { src, dst, desc } of checks) {
      const result = checkConnectivity(src, dst, devices, connections, deviceStates, 'en');
      console.log(`${desc}: ${result.success ? 'PASS' : 'FAIL'}`);
      assert(result.success, `${desc} failed`);
    }
  };

  // WLC project checks
  runChecks(wlcProj, [
    { src: 'laptop-1', dst: '192.168.20.101', desc: 'Laptop-1 to Laptop-2 (Inter-VLAN Wireless ping)' },
    { src: 'laptop-1', dst: '192.168.1.10', desc: 'Laptop-1 to WLC ping' },
    { src: 'pc-admin', dst: '192.168.1.10', desc: 'Admin-PC to WLC ping' }
  ]);

  // WAP project checks
  runChecks(wapProj, [
    { src: 'laptop-staff', dst: '192.168.20.101', desc: 'Laptop-Staff to Laptop-Guest ping' },
    { src: 'laptop-staff', dst: '192.168.10.1', desc: 'Laptop-Staff to Gateway ping' },
    { src: 'laptop-staff', dst: '192.168.10.2', desc: 'Laptop-Staff to WAP-Staff L3 Switch IP ping' }
  ]);

  console.log('All connectivity checks passed.');
}

function main() {
  try {
    validateProjects('en');
    validateProjects('tr');
    runConnectivityChecks();
    console.log('\nAll example projects validation completed successfully.');
  } catch (e) {
    console.error('Validation failed:', e);
    process.exit(1);
  }
}

main();
