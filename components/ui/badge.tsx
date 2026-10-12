import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium leading-none whitespace-nowrap transition-colors select-none [&>svg]:pointer-events-none [&>svg]:size-3.5!",
  {
    variants: {
      variant: {
        default:
          "bg-neutral-tint text-foreground border border-border/80",
        secondary:
          "bg-muted text-foreground border border-border/60",
        success:
          "bg-success-tint text-success border border-success/30",
        warning:
          "bg-warning-tint text-warning border border-warning/30",
        disruption:
          "bg-disruption-tint text-disruption border border-disruption/30",
        destructive:
          "bg-disruption-tint text-disruption border border-disruption/30",
        outline:
          "border border-border text-foreground bg-surface",
        ghost:
          "bg-transparent text-muted-foreground hover:text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
