/**
 * Responsive Utilities
 * Helper functions and CSS classes for responsive design
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Responsive class utilities
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate responsive class names
 */
export function responsiveClass(
  mobile: string,
  tablet?: string,
  desktop?: string
): string {
  const classes = [mobile];
  if (tablet) classes.push(tablet);
  if (desktop) classes.push(desktop);
  return cn(...classes);
}

/**
 * Responsive spacing utilities
 */
export const responsiveSpacing = {
  // Padding
  p: {
    mobile: {
      xs: 'p-1',
      sm: 'p-2',
      md: 'p-3',
      lg: 'p-4',
      xl: 'p-6',
    },
    tablet: {
      xs: 'sm:p-1',
      sm: 'sm:p-2',
      md: 'sm:p-3',
      lg: 'sm:p-4',
      xl: 'sm:p-6',
    },
    desktop: {
      xs: 'lg:p-1',
      sm: 'lg:p-2',
      md: 'lg:p-3',
      lg: 'lg:p-4',
      xl: 'lg:p-6',
    }
  },
  
  // Margin
  m: {
    mobile: {
      xs: 'm-1',
      sm: 'm-2',
      md: 'm-3',
      lg: 'm-4',
      xl: 'm-6',
    },
    tablet: {
      xs: 'sm:m-1',
      sm: 'sm:m-2',
      md: 'sm:m-3',
      lg: 'sm:m-4',
      xl: 'sm:m-6',
    },
    desktop: {
      xs: 'lg:m-1',
      sm: 'lg:m-2',
      md: 'lg:m-3',
      lg: 'lg:m-4',
      xl: 'lg:m-6',
    }
  },
  
  // Gap
  gap: {
    mobile: {
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-3',
      lg: 'gap-4',
      xl: 'gap-6',
    },
    tablet: {
      xs: 'sm:gap-1',
      sm: 'sm:gap-2',
      md: 'sm:gap-3',
      lg: 'sm:gap-4',
      xl: 'sm:gap-6',
    },
    desktop: {
      xs: 'lg:gap-1',
      sm: 'lg:gap-2',
      md: 'lg:gap-3',
      lg: 'lg:gap-4',
      xl: 'lg:gap-6',
    }
  }
} as const;

/**
 * Responsive layout utilities
 */
export const responsiveLayout = {
  // Display
  display: {
    mobile: {
      block: 'block',
      hidden: 'hidden',
      flex: 'flex',
      grid: 'grid',
    },
    tablet: {
      block: 'sm:block',
      hidden: 'sm:hidden',
      flex: 'sm:flex',
      grid: 'sm:grid',
    },
    desktop: {
      block: 'lg:block',
      hidden: 'lg:hidden',
      flex: 'lg:flex',
      grid: 'lg:grid',
    }
  },
  
  // Flex direction
  flexDirection: {
    mobile: {
      row: 'flex-row',
      col: 'flex-col',
      'row-reverse': 'flex-row-reverse',
      'col-reverse': 'flex-col-reverse',
    },
    tablet: {
      row: 'sm:flex-row',
      col: 'sm:flex-col',
      'row-reverse': 'sm:flex-row-reverse',
      'col-reverse': 'sm:flex-col-reverse',
    },
    desktop: {
      row: 'lg:flex-row',
      col: 'lg:flex-col',
      'row-reverse': 'lg:flex-row-reverse',
      'col-reverse': 'lg:flex-col-reverse',
    }
  },
  
  // Grid
  grid: {
    mobile: {
      cols: {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
      }
    },
    tablet: {
      cols: {
        1: 'sm:grid-cols-1',
        2: 'sm:grid-cols-2',
        3: 'sm:grid-cols-3',
        4: 'sm:grid-cols-4',
      }
    },
    desktop: {
      cols: {
        1: 'lg:grid-cols-1',
        2: 'lg:grid-cols-2',
        3: 'lg:grid-cols-3',
        4: 'lg:grid-cols-4',
      }
    }
  }
} as const;

/**
 * Responsive text utilities
 */
export const responsiveText = {
  size: {
    mobile: {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    },
    tablet: {
      xs: 'sm:text-xs',
      sm: 'sm:text-sm',
      md: 'sm:text-base',
      lg: 'sm:text-lg',
      xl: 'sm:text-xl',
    },
    desktop: {
      xs: 'lg:text-xs',
      sm: 'lg:text-sm',
      md: 'lg:text-base',
      lg: 'lg:text-lg',
      xl: 'lg:text-xl',
    }
  }
} as const;

/**
 * Get responsive class helper
 */
export function getResponsiveClass<T extends Record<string, any>>(
  utility: T,
  category: keyof T,
  size: keyof T[keyof T],
  device: 'mobile' | 'tablet' | 'desktop' = 'mobile'
): string {
  return utility[category]?.[device]?.[size] || '';
}

/**
 * Responsive component props helper
 */
export interface ResponsiveProps {
  className?: string;
  mobileClassName?: string;
  tabletClassName?: string;
  desktopClassName?: string;
}

/**
 * Combine responsive class names
 */
export function combineResponsiveClasses(props: ResponsiveProps): string {
  const { className, mobileClassName, tabletClassName, desktopClassName } = props;
  return cn(
    className,
    mobileClassName,
    tabletClassName,
    desktopClassName
  );
}

/**
 * Responsive container utilities
 */
export const responsiveContainer = {
  // Container sizing
  container: {
    mobile: 'w-full max-w-full',
    tablet: 'sm:w-full sm:max-w-full',
    desktop: 'lg:w-full lg:max-w-7xl lg:mx-auto',
  },
  
  // Panel/Card sizing
  panel: {
    mobile: 'w-full h-full min-w-0',
    tablet: 'sm:w-full sm:max-w-md sm:h-auto',
    desktop: 'lg:w-full lg:max-w-2xl lg:h-auto',
  },
  
  // Modal sizing
  modal: {
    mobile: 'w-[95vw] max-w-[95vw]',
    tablet: 'sm:w-[80vw] sm:max-w-lg',
    desktop: 'lg:w-[70vw] lg:max-w-4xl',
  }
} as const;

/**
 * Responsive animation utilities
 */
export const responsiveAnimation = {
  // Animation duration
  duration: {
    mobile: {
      fast: 'duration-150',
      normal: 'duration-200',
      slow: 'duration-300',
    },
    tablet: {
      fast: 'sm:duration-150',
      normal: 'sm:duration-200',
      slow: 'sm:duration-300',
    },
    desktop: {
      fast: 'lg:duration-150',
      normal: 'lg:duration-200',
      slow: 'lg:duration-300',
    }
  },
  
  // Transition properties
  transition: {
    mobile: 'transition-all ease-in-out',
    tablet: 'sm:transition-all sm:ease-in-out',
    desktop: 'lg:transition-all lg:ease-in-out',
  }
} as const;
