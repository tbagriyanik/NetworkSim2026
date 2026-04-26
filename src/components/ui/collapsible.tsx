"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CollapsibleProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
}

interface CollapsibleContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | undefined>(undefined)

function useCollapsible() {
  const context = React.useContext(CollapsibleContext)
  if (!context) {
    throw new Error("useCollapsible must be used within a Collapsible")
  }
  return context
}

const Collapsible: React.FC<CollapsibleProps> = ({ 
  children, 
  open: controlledOpen, 
  onOpenChange,
  defaultOpen = false 
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }, [isControlled, onOpenChange])

  return (
    <CollapsibleContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </CollapsibleContext.Provider>
  )
}

interface CollapsibleTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

const CollapsibleTrigger: React.FC<CollapsibleTriggerProps> = ({ children, asChild }) => {
  const { open, onOpenChange } = useCollapsible()
  
  const handleClick = () => {
    onOpenChange(!open)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, { onClick: handleClick })
  }

  return (
    <button type="button" onClick={handleClick}>
      {children}
    </button>
  )
}

interface CollapsibleContentProps {
  children: React.ReactNode
  className?: string
}

const CollapsibleContent: React.FC<CollapsibleContentProps> = ({ children, className }) => {
  const { open } = useCollapsible()
  
  return (
    <div 
      className={cn(
        "overflow-hidden transition-all duration-300",
        open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
        className
      )}
    >
      {children}
    </div>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
