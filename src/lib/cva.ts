import { clsx, type ClassValue } from "@/lib/utils"

type ConfigSchema = Record<string, Record<string, ClassValue>>

type ConfigVariants<T extends ConfigSchema> = {
  [K in keyof T]?: keyof T[K] | null | undefined
}

export type VariantProps<T extends (...args: any) => any> = Parameters<T>[0]

export function cva<T extends ConfigSchema>(
  base?: ClassValue,
  config?: {
    variants?: T
    defaultVariants?: ConfigVariants<T>
    compoundVariants?: Array<ConfigVariants<T> & { className?: ClassValue }>
  }
) {
  return (props?: ConfigVariants<T> & { className?: ClassValue }) => {
    if (!config?.variants) {
      return clsx(base, props?.className)
    }
    const { variants, defaultVariants } = config
    const result: ClassValue[] = [base]

    for (const variant in variants) {
      const variantProp = props?.[variant] ?? defaultVariants?.[variant]
      if (variantProp != null) {
        const variantObj = variants[variant]
        if (variantObj && (variantProp as string) in variantObj) {
          result.push(variantObj[variantProp as string])
        }
      }
    }
    if (props?.className) {
      result.push(props.className)
    }
    return clsx(...result)
  }
} 
