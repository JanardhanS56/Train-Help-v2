import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[8px] text-sm font-medium whitespace-nowrap transition-colors duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:opacity-90 border-transparent font-medium",
        secondary:
          "border border-border bg-surface text-foreground hover:bg-background hover:border-muted-foreground/40 active:bg-muted",
        outline:
          "border border-border bg-surface text-foreground hover:bg-background hover:border-muted-foreground/40",
        ghost:
          "bg-transparent text-foreground hover:bg-background hover:text-foreground",
        destructive:
          "bg-disruption-tint border border-disruption/20 text-disruption hover:bg-disruption-tint/80 font-medium",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto font-medium",
      },
      size: {
        default: "h-10 md:h-10 min-h-[44px] md:min-h-[40px] px-4 gap-2 text-sm",
        sm: "h-8 min-h-[36px] px-3 gap-1.5 text-xs",
        xs: "h-7 min-h-[28px] px-2.5 gap-1 text-xs",
        lg: "h-11 min-h-[44px] px-5 gap-2 text-base",
        icon: "size-10 min-h-[44px] md:min-h-[40px] p-0",
        "icon-sm": "size-8 min-h-[32px] p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
