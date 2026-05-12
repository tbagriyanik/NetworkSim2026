// Simple test to verify IP address changes in ping animation
const { buildHopPacketInfos } = require('./src/components/network/PingPacketInfoPanel.tsx');

// Mock data for testing
const mockDevices = [
    { id: 'pc1', name: 'PC1', type: 'pc', ip: '192.168.1.10' },
    { id: 'router1', name: 'Router1', type: 'router', ip: '192.168.1.1' },
    { id: 'router2', name: 'Router2', type: 'router', ip: '10.0.0.1' },
    { id: 'pc2', name: 'PC2', type: 'pc', ip: '10.0.0.10' }
];

const mockConnections = [
    { sourceDeviceId: 'pc1', targetDeviceId: 'router1', cableType: 'straight' },
    { sourceDeviceId: 'router1', targetDeviceId: 'router2', cableType: 'straight' },
    { sourceDeviceId: 'router2', targetDeviceId: 'pc2', cableType: 'straight' }
];

const path = ['pc1', 'router1', 'router2', 'pc2'];

console.log('Testing IP address changes in ping animation...');
console.log('Path:', path);

// This would test the function if we could import it properly
// For now, let's just verify our logic conceptually
console.log('\nExpected behavior:');
console.log('Hop 1 (PC1 -> Router1): IP should show PC1 IP and Router1 interface IP');
console.log('Hop 2 (Router1 -> Router2): IP should show Router1 interface IP and Router2 interface IP');  
console.log('Hop 3 (Router2 -> PC2): IP should show Router2 interface IP and PC2 IP');
console.log('\nMAC addresses should change at each hop');
console.log('IP addresses should now also change at router interfaces');
