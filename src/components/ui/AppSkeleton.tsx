'use client';

import { Skeleton } from "./skeleton";

export function AppSkeleton() {
    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header Skeleton */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="w-32 h-5" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="w-9 h-9 rounded-md" />
                    <Skeleton className="w-9 h-9 rounded-md" />
                    <Skeleton className="w-9 h-9 rounded-md" />
                </div>
            </header>

            {/* Main Content Skeleton */}
            <main className="flex-1 flex overflow-hidden">
                {/* Sidebar/Tabs Skeleton */}
                <aside className="w-14 border-r border-border flex flex-col items-center py-3 gap-2">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="w-10 h-10 rounded-md" />
                    ))}
                </aside>

                {/* Canvas Skeleton */}
                <div className="flex-1 relative">
                    <Skeleton className="absolute inset-0" />
                    {/* Floating controls skeleton */}
                    <div className="absolute bottom-4 right-4 flex gap-2">
                        <Skeleton className="w-8 h-8 rounded-md" />
                        <Skeleton className="w-8 h-8 rounded-md" />
                        <Skeleton className="w-8 h-8 rounded-md" />
                    </div>
                </div>

                {/* Panel Skeleton */}
                <aside className="w-80 border-l border-border p-4 space-y-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                </aside>
            </main>

            {/* Footer Skeleton */}
            <footer className="flex items-center justify-between px-4 py-2 border-t border-border text-xs text-muted-foreground">
                <Skeleton className="w-20 h-4" />
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-16 h-4" />
            </footer>
        </div>
    );
}