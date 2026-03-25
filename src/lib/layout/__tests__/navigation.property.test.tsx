import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { ModernNavigation, ModernBottomNavigation, NavigationItem } from '@/components/ui/ModernAppShell';
import { LayoutProvider } from '@/contexts/LayoutContext';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock Lucide icons
const MockIcon = () => <div data-testid="icon" />;

describe('Navigation System - Property Tests', () => {
    const navigationItemArb = fc.record({
        id: fc.uuid(),
        label: fc.string({ minLength: 2 }).map(s => s.trim()).filter(s => s.length > 0),
        active: fc.boolean(),
        badge: fc.oneof(
            fc.integer({ min: 1, max: 99 }), 
            fc.string({ minLength: 1, maxLength: 3 }).map(s => s.trim()).filter(s => s.length > 0)
        ),
    });

    const navigationItemsArb = fc.array(navigationItemArb, { minLength: 1, maxLength: 10 });

    // Property 5: Navigation System Completeness
    it('should render all navigation items in sidebar navigation', () => {
        fc.assert(
            fc.property(navigationItemsArb, (items) => {
                const navItems: NavigationItem[] = items.map(item => ({
                    ...item,
                    icon: <MockIcon />
                }));

                render(
                    <TooltipProvider>
                        <LayoutProvider>
                            <ModernNavigation items={navItems} />
                        </LayoutProvider>
                    </TooltipProvider>
                );

                // Verify all labels are present
                items.forEach(item => {
                    const elements = screen.getAllByText(item.label);
                    expect(elements.length).toBeGreaterThan(0);
                });

                // Verify all icons are present
                const icons = screen.getAllByTestId('icon');
                expect(icons.length).toBe(items.length);

                cleanup();
            }),
            { numRuns: 50 } // Reduce runs for performance in CI
        );
    });

    it('should render all navigation items in bottom navigation', () => {
        fc.assert(
            fc.property(navigationItemsArb, (items) => {
                const navItems: NavigationItem[] = items.map(item => ({
                    ...item,
                    icon: <MockIcon />
                }));

                render(
                    <ModernBottomNavigation items={navItems} />
                );

                // Verify all labels are present
                items.forEach(item => {
                    const elements = screen.getAllByText(item.label);
                    expect(elements.length).toBeGreaterThan(0);
                });

                // Verify all icons are present
                const icons = screen.getAllByTestId('icon');
                expect(icons.length).toBe(items.length);

                cleanup();
            }),
            { numRuns: 50 }
        );
    });

    it('should correctly display badges when provided', () => {
        fc.assert(
            fc.property(navigationItemsArb, (items) => {
                const navItems: NavigationItem[] = items.map(item => ({
                    ...item,
                    icon: <MockIcon />
                }));

                render(
                    <ModernBottomNavigation items={navItems} />
                );

                items.forEach(item => {
                    if (item.badge !== undefined) {
                        const badgeText = String(item.badge);
                        const badgeElements = screen.getAllByText(badgeText);
                        expect(badgeElements.length).toBeGreaterThan(0);
                    }
                });

                cleanup();
            }),
            { numRuns: 50 }
        );
    });
});
