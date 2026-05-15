import { CanvasDevice, CanvasConnection } from '@/components/network/networkTopology.types';
import { SwitchState } from './types';

/**
 * Basic L2 connectivity check (shared utility to avoid circular dependency)
 * This function provides a simplified L2 connectivity check without routing
 */
export function checkBasicL2Connectivity(
  sourceId: string,
  targetIp: string,
  devices: CanvasDevice[],
  connections: CanvasConnection[],
  deviceStates?: Map<string, SwitchState>
): { success: boolean; hops: string[]; error?: string } {
  // BOLT: Use a device map for O(1) lookups
  const deviceMap = new Map<string, CanvasDevice>();
  for (const d of devices) {
    deviceMap.set(d.id, d);
  }

  // Find target device by IP
  let targetDevice = devices.find(d => d.ip === targetIp);

  // Check device states for interface IPs
  if (!targetDevice && deviceStates) {
    for (const [id, state] of deviceStates.entries()) {
      for (const portId in state.ports) {
        if (state.ports[portId].ipAddress === targetIp) {
          targetDevice = deviceMap.get(id);
          break;
        }
      }
      if (targetDevice) break;
    }
  }

  if (!targetDevice) {
    return { success: false, hops: [], error: 'Target device not found' };
  }

  // BOLT: Pre-calculate adjacency list for O(V + C) BFS
  const adjList = new Map<string, string[]>();
  for (const conn of connections) {
    if (conn.active === false) continue;

    if (!adjList.has(conn.sourceDeviceId)) adjList.set(conn.sourceDeviceId, []);
    adjList.get(conn.sourceDeviceId)!.push(conn.targetDeviceId);

    if (!adjList.has(conn.targetDeviceId)) adjList.set(conn.targetDeviceId, []);
    adjList.get(conn.targetDeviceId)!.push(conn.sourceDeviceId);
  }

  // Simple BFS pathfinding for L2 connectivity
  const queue: string[] = [sourceId];
  const visited = new Set<string>([sourceId]);
  const parent = new Map<string, string>();

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (currentId === targetDevice.id) break;

    const neighbors = adjList.get(currentId) || [];

    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        parent.set(neighborId, currentId);
        queue.push(neighborId);
      }
    }
  }

  if (!visited.has(targetDevice.id)) {
    return { success: false, hops: [], error: 'No L2 path to target' };
  }

  // Construct path
  const path: string[] = [];
  let curr: string | undefined = targetDevice.id;
  while (curr) {
    path.unshift(curr);
    curr = parent.get(curr);
  }

  const hopNames = path.map(id => deviceMap.get(id)?.name || id);

  return { success: true, hops: hopNames, error: undefined };
}
