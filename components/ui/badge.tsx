import * as React from "react";
import { cn } from "@/lib/utils";

function Badge({ className, variant = "default", ...props }: React.ComponentProps<"span"> & { variant?: "default" | "outline" | "secondary" | "success" | "warning" }) {
  const variants = {
    default: "bg-neutral-950 text-white",
    outline: "border border-neutral-200 bg-white text-neutral-700",
    secondary: "bg-neutral-100 text-neutral-700",
    success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    warning: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200"
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", variants[variant], className)} {...props} />;
}
export { Badge };
