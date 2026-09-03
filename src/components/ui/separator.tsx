"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
    orientation?: "horizontal" | "vertical"
    decorative?: boolean
}

function Separator({
    className,
    orientation = "horizontal",
    decorative = true,
    ...props
}: SeparatorProps) {
    return (
        <div
            data-slot="separator-root"
            role={decorative ? "none" : "separator"}
            aria-orientation={orientation}
            className={cn(
                "bg-border shrink-0 orientation-horizontal:h-px orientation-horizontal:w-full orientation-vertical:h-full orientation-vertical:w-px",
                orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
                className
            )}
            {...props}
        />
    )
}

export { Separator }
