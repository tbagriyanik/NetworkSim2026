import {
    saveWindowPositions,
    restoreWindowPositions,
    clearWindowPositionsBackup,
    getWindowPositionsBackup,
    AllWindowLayouts,
} from '../windowPositionManager';

describe('windowPositionManager', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('saveWindowPositions', () => {
        it('should save modal positions to localStorage', () => {
            // Setup: Add some modal positions to localStorage
            localStorage.setItem('tasks-modal-position', JSON.stringify({ x: 100, y: 200 }));
            localStorage.setItem('tasks-modal-size', JSON.stringify({ width: 800, height: 600 }));
            localStorage.setItem('cli-modal-position', JSON.stringify({ x: 50, y: 100 }));
            localStorage.setItem('cli-modal-size', JSON.stringify({ width: 1000, height: 700 }));

            // Act
            saveWindowPositions();

            // Assert
            const backup = localStorage.getItem('netsim_window_positions_backup');
            expect(backup).toBeTruthy();

            const parsed = JSON.parse(backup!);
            expect(parsed.tasks).toEqual({
                position: { x: 100, y: 200 },
                size: { width: 800, height: 600 },
            });
            expect(parsed.cli).toEqual({
                position: { x: 50, y: 100 },
                size: { width: 1000, height: 700 },
            });
        });

        it('should save draggable dialog positions', () => {
            // Setup
            localStorage.setItem('draggable_position_dialog-1', JSON.stringify({ x: 300, y: 400 }));
            localStorage.setItem('draggable_position_dialog-2', JSON.stringify({ x: 500, y: 600 }));

            // Act
            saveWindowPositions();

            // Assert
            const backup = localStorage.getItem('netsim_window_positions_backup');
            const parsed = JSON.parse(backup!);
            expect(parsed.draggable_dialog_1).toEqual({
                position: { x: 300, y: 400 },
                size: { width: 0, height: 0 },
            });
            expect(parsed.draggable_dialog_2).toEqual({
                position: { x: 500, y: 600 },
                size: { width: 0, height: 0 },
            });
        });

        it('should handle missing positions gracefully', () => {
            // Act - should not throw
            expect(() => saveWindowPositions()).not.toThrow();

            // Assert - backup should be empty or minimal
            const backup = localStorage.getItem('netsim_window_positions_backup');
            expect(backup).toBeTruthy();
        });
    });

    describe('restoreWindowPositions', () => {
        it('should restore modal positions from backup', () => {
            // Setup
            const backup: AllWindowLayouts = {
                tasks: {
                    position: { x: 100, y: 200 },
                    size: { width: 800, height: 600 },
                },
                cli: {
                    position: { x: 50, y: 100 },
                    size: { width: 1000, height: 700 },
                },
            };
            localStorage.setItem('netsim_window_positions_backup', JSON.stringify(backup));

            // Act
            restoreWindowPositions();

            // Assert
            expect(localStorage.getItem('tasks-modal-position')).toBe(JSON.stringify({ x: 100, y: 200 }));
            expect(localStorage.getItem('tasks-modal-size')).toBe(JSON.stringify({ width: 800, height: 600 }));
            expect(localStorage.getItem('cli-modal-position')).toBe(JSON.stringify({ x: 50, y: 100 }));
            expect(localStorage.getItem('cli-modal-size')).toBe(JSON.stringify({ width: 1000, height: 700 }));
        });

        it('should restore draggable dialog positions', () => {
            // Setup
            const backup: AllWindowLayouts = {
                draggable_dialog_1: {
                    position: { x: 300, y: 400 },
                    size: { width: 0, height: 0 },
                },
            };
            localStorage.setItem('netsim_window_positions_backup', JSON.stringify(backup));

            // Act
            restoreWindowPositions();

            // Assert
            expect(localStorage.getItem('draggable_position_dialog_1')).toBe(JSON.stringify({ x: 300, y: 400 }));
        });

        it('should handle missing backup gracefully', () => {
            // Act - should not throw
            expect(() => restoreWindowPositions()).not.toThrow();

            // Assert - no positions should be restored
            expect(localStorage.getItem('tasks-modal-position')).toBeNull();
        });
    });

    describe('clearWindowPositionsBackup', () => {
        it('should remove backup from localStorage', () => {
            // Setup
            localStorage.setItem('netsim_window_positions_backup', JSON.stringify({}));

            // Act
            clearWindowPositionsBackup();

            // Assert
            expect(localStorage.getItem('netsim_window_positions_backup')).toBeNull();
        });
    });

    describe('getWindowPositionsBackup', () => {
        it('should return backup data', () => {
            // Setup
            const backup: AllWindowLayouts = {
                tasks: {
                    position: { x: 100, y: 200 },
                    size: { width: 800, height: 600 },
                },
            };
            localStorage.setItem('netsim_window_positions_backup', JSON.stringify(backup));

            // Act
            const result = getWindowPositionsBackup();

            // Assert
            expect(result).toEqual(backup);
        });

        it('should return null if no backup exists', () => {
            // Act
            const result = getWindowPositionsBackup();

            // Assert
            expect(result).toBeNull();
        });

        it('should handle invalid JSON gracefully', () => {
            // Setup
            localStorage.setItem('netsim_window_positions_backup', 'invalid json');

            // Act
            const result = getWindowPositionsBackup();

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('integration', () => {
        it('should complete full save-restore cycle', () => {
            // Setup
            localStorage.setItem('tasks-modal-position', JSON.stringify({ x: 100, y: 200 }));
            localStorage.setItem('tasks-modal-size', JSON.stringify({ width: 800, height: 600 }));

            // Act - Save
            saveWindowPositions();

            // Clear original positions
            localStorage.removeItem('tasks-modal-position');
            localStorage.removeItem('tasks-modal-size');

            // Verify cleared
            expect(localStorage.getItem('tasks-modal-position')).toBeNull();

            // Act - Restore
            restoreWindowPositions();

            // Assert
            expect(localStorage.getItem('tasks-modal-position')).toBe(JSON.stringify({ x: 100, y: 200 }));
            expect(localStorage.getItem('tasks-modal-size')).toBe(JSON.stringify({ width: 800, height: 600 }));

            // Act - Clear backup
            clearWindowPositionsBackup();

            // Assert
            expect(localStorage.getItem('netsim_window_positions_backup')).toBeNull();
        });
    });
});
