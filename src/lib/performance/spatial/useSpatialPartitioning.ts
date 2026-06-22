import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { SpatialPartitioner, ViewportCuller, ViewportState, CullingResult } from './index';
import { CanvasDevice, CanvasConnection } from '@/components/network/networkTopology.types';

export interface UseSpatialPartitioningOptions {
    cellSize?: number;
    margin?: number;
    enabled?: boolean;
}

export interface UseSpatialPartitioningResult {
    visibleDeviceIds: string[];
    visibleConnectionIds: string[];
    updateViewport: (viewport: ViewportState) => void;
    invalidateCache: () => void;
    getStats: () => Record<string, number> | null;
}

export function useSpatialPartitioning(
    devices: CanvasDevice[],
    connections: CanvasConnection[],
    options: UseSpatialPartitioningOptions = {}
): UseSpatialPartitioningResult {
    const { cellSize = 256, margin = 100, enabled = true } = options;

    const partitionerRef = useRef<SpatialPartitioner | null>(null);
    const cullerRef = useRef<ViewportCuller | null>(null);
    const viewportRef = useRef<ViewportState | null>(null);

    // Track previous state for differential updates
    const prevDevicesRef = useRef<CanvasDevice[]>([]);
    const prevConnectionsRef = useRef<CanvasConnection[]>([]);

    const [cullingResult, setCullingResult] = useState<CullingResult | null>(null);

    useEffect(() => {
        if (!enabled) return;

        if (!partitionerRef.current) {
            partitionerRef.current = new SpatialPartitioner(cellSize);
        }
        if (!cullerRef.current && partitionerRef.current) {
            cullerRef.current = new ViewportCuller(partitionerRef.current, margin);
        }

        const partitioner = partitionerRef.current;
        const culler = cullerRef.current;
        if (!partitioner || !culler) return;

        // Differential update for devices
        const prevDevices = prevDevicesRef.current;
        const prevDeviceMap = new Map(prevDevices.map(d => [d.id, d]));
        const currentDeviceMap = new Map(devices.map(d => [d.id, d]));

        // Find added, removed, and moved devices
        const deviceChanged = prevDevices.length !== devices.length;
        if (!deviceChanged) {
            // Check each device
            for (const d of devices) {
                const prev = prevDeviceMap.get(d.id);
                if (!prev || prev.x !== d.x || prev.y !== d.y) {
                    partitioner.assignNode({ id: d.id, x: d.x, y: d.y });
                }
            }
            // Check for removed devices
            for (const d of prevDevices) {
                if (!currentDeviceMap.has(d.id)) {
                    partitioner.removeNode(d.id);
                }
            }
        } else {
            // Full update when array size differs (safest path)
            partitioner.clear();
            const nodes = devices.map(d => ({ id: d.id, x: d.x, y: d.y }));
            partitioner.assignNodes(nodes);

            const nodeMap = new Map(nodes.map(n => [n.id, n]));
            connections.forEach(conn => {
                partitioner.assignConnection(
                    { id: conn.id, sourceNodeId: conn.sourceDeviceId, targetNodeId: conn.targetDeviceId },
                    nodeMap
                );
            });
        }

        // Update culler node list
        culler.setNodes(devices.map(d => ({ id: d.id, x: d.x, y: d.y })));
        culler.setConnections(connections.map(c => ({
            id: c.id,
            sourceNodeId: c.sourceDeviceId,
            targetNodeId: c.targetDeviceId,
        })));

        // Store current state for next diff
        prevDevicesRef.current = devices;
        prevConnectionsRef.current = connections;

        if (viewportRef.current && culler) {
            setCullingResult(culler.cull(viewportRef.current));
        } else {
            setCullingResult(null);
        }
    }, [devices, connections, cellSize, margin, enabled]);

    const updateViewport = useCallback((viewport: ViewportState) => {
        if (!enabled || !cullerRef.current) return;
        viewportRef.current = viewport;
        setCullingResult(cullerRef.current.cull(viewport));
    }, [enabled]);

    const visibleDeviceIds = useMemo(() => {
        if (!enabled || !cullingResult) {
            return devices.map(d => d.id);
        }
        return cullingResult.visibleNodeIds;
    }, [devices, enabled, cullingResult]);

    const visibleConnectionIds = useMemo(() => {
        if (!enabled || !cullingResult) {
            return connections.map(c => c.id);
        }
        return cullingResult.visibleConnectionIds;
    }, [connections, enabled, cullingResult]);

    const invalidateCache = useCallback(() => {
        if (cullerRef.current) {
            cullerRef.current.invalidateCache();
        }
    }, []);

    const getStats = useCallback(() => {
        if (!cullerRef.current) return null;
        return cullerRef.current.getStats();
    }, []);

    return {
        visibleDeviceIds,
        visibleConnectionIds,
        updateViewport,
        invalidateCache,
        getStats,
    };
}
