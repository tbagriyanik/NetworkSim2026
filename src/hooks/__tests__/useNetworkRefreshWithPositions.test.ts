import { renderHook, act } from '@testing-library/react';
import { useNetworkRefreshWithPositions } from '../useNetworkRefreshWithPositions';

// Mock the windowPositionManager
jest.mock('@/lib/storage/windowPositionManager', () => ({
    saveWindowPositions: jest.fn(),
    restoreWindowPositions: jest.fn(),
    clearWindowPositionsBackup: jest.fn(),
}));

import {
    saveWindowPositions,
    restoreWindowPositions,
    clearWindowPositionsBackup,
} from '@/lib/storage/windowPositionManager';

describe('useNetworkRefreshWithPositions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it('should save positions before refresh', async () => {
        const mockRefresh = jest.fn();
        const { result } = renderHook(() => useNetworkRefreshWithPositions(mockRefresh));

        await act(async () => {
            await result.current.refreshNetworkWithPositions();
        });

        expect(saveWindowPositions).toHaveBeenCalled();
    });

    it('should call onRefreshNetwork', async () => {
        const mockRefresh = jest.fn();
        const { result } = renderHook(() => useNetworkRefreshWithPositions(mockRefresh));

        await act(async () => {
            await result.current.refreshNetworkWithPositions();
        });

        expect(mockRefresh).toHaveBeenCalled();
    });

    it('should restore positions after refresh', async () => {
        const mockRefresh = jest.fn();
        const { result } = renderHook(() => useNetworkRefreshWithPositions(mockRefresh));

        await act(async () => {
            await result.current.refreshNetworkWithPositions();
            jest.advanceTimersByTime(100);
        });

        expect(restoreWindowPositions).toHaveBeenCalled();
    });

    it('should clear backup after restore', async () => {
        const mockRefresh = jest.fn();
        const { result } = renderHook(() => useNetworkRefreshWithPositions(mockRefresh));

        await act(async () => {
            await result.current.refreshNetworkWithPositions();
            jest.advanceTimersByTime(100);
        });

        expect(clearWindowPositionsBackup).toHaveBeenCalled();
    });

    it('should handle refresh errors gracefully', async () => {
        const mockRefresh = jest.fn().mockRejectedValue(new Error('Refresh failed'));
        const { result } = renderHook(() => useNetworkRefreshWithPositions(mockRefresh));

        await act(async () => {
            await result.current.refreshNetworkWithPositions();
            jest.advanceTimersByTime(100);
        });

        // Should still restore positions even if refresh failed
        expect(restoreWindowPositions).toHaveBeenCalled();
        expect(clearWindowPositionsBackup).toHaveBeenCalled();
    });

    it('should execute in correct order', async () => {
        const callOrder: string[] = [];

        const mockRefresh = jest.fn(() => {
            callOrder.push('refresh');
        });

        (saveWindowPositions as jest.Mock).mockImplementation(() => {
            callOrder.push('save');
        });

        (restoreWindowPositions as jest.Mock).mockImplementation(() => {
            callOrder.push('restore');
        });

        (clearWindowPositionsBackup as jest.Mock).mockImplementation(() => {
            callOrder.push('clear');
        });

        const { result } = renderHook(() => useNetworkRefreshWithPositions(mockRefresh));

        await act(async () => {
            await result.current.refreshNetworkWithPositions();
            jest.advanceTimersByTime(100);
        });

        expect(callOrder).toEqual(['save', 'refresh', 'restore', 'clear']);
    });

    it('should handle async refresh functions', async () => {
        const mockRefresh = jest.fn(
            () => new Promise<void>(resolve => setTimeout(resolve, 50))
        );

        const { result } = renderHook(() => useNetworkRefreshWithPositions(mockRefresh));

        await act(async () => {
            await result.current.refreshNetworkWithPositions();
            jest.advanceTimersByTime(150);
        });

        expect(mockRefresh).toHaveBeenCalled();
        expect(restoreWindowPositions).toHaveBeenCalled();
    });

    it('should handle undefined onRefreshNetwork', async () => {
        const { result } = renderHook(() => useNetworkRefreshWithPositions(undefined as any));

        await act(async () => {
            await result.current.refreshNetworkWithPositions();
            jest.advanceTimersByTime(100);
        });

        expect(saveWindowPositions).toHaveBeenCalled();
        expect(restoreWindowPositions).toHaveBeenCalled();
    });
});
