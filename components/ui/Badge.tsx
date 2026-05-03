import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "sale" | "outOfStock" | "pending" | "confirmed" | "shipped" | "delivered" | "failed" | "lowStock";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:    "bg-brand-cream text-brand-brown border border-brand-cream-dark",
  sale:       "bg-brand-gold text-brand-brown",
  outOfStock: "bg-gray-800 text-white",
  pending:    "bg-amber-100 text-amber-800",
  confirmed:  "bg-green-100 text-green-800",
  shipped:    "bg-blue-100 text-blue-800",
  delivered:  "bg-emerald-100 text-emerald-800",
  failed:     "bg-red-100 text-red-800",
  lowStock:   "bg-orange-100 text-orange-800",
};

export default function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
