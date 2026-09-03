import * as React from "react"

export function VisuallyHidden({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className="sr-only" {...props}>
      {children}
    </span>
  )
}
