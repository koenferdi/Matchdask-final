import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-3 rounded-sm font-semibold transition-transform duration-200 ease-[cubic-bezier(.2,.75,.25,1)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bright disabled:opacity-50 disabled:pointer-events-none [&_svg]:size-[19px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-teal text-white hover:bg-[#08756a] hover:-translate-y-0.5",
        mint: "bg-mint text-night hover:bg-[#d0f3eb] hover:-translate-y-0.5",
        ghost:
          "border border-line bg-transparent text-ink hover:border-teal hover:-translate-y-0.5",
        onDark:
          "border border-mint/55 bg-transparent text-mint hover:border-bright hover:text-paper hover:-translate-y-0.5",
        night: "bg-night text-mint hover:bg-deep hover:-translate-y-0.5",
        link: "gap-2 bg-transparent px-0 font-semibold text-ink hover:text-teal",
      },
      size: {
        default: "px-6 py-3.5 text-sm",
        sm: "px-4 py-2.5 text-[13px]",
        full: "w-full px-6 py-3.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
