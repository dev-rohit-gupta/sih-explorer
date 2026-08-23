"use client";
import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;
function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return <SelectPrimitive.Trigger className={cn("flex h-10 min-w-36 items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none hover:bg-neutral-50 focus:ring-2 focus:ring-neutral-200", className)} {...props}>{children}<SelectPrimitive.Icon asChild><ChevronDown className="size-4 text-neutral-400" /></SelectPrimitive.Icon></SelectPrimitive.Trigger>;
}
function SelectContent({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return <SelectPrimitive.Portal><SelectPrimitive.Content position="popper" sideOffset={6} className={cn("z-50 max-h-80 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-neutral-200 bg-white p-1 shadow-xl", className)} {...props}><SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport></SelectPrimitive.Content></SelectPrimitive.Portal>;
}
function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return <SelectPrimitive.Item className={cn("relative flex cursor-default select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm text-neutral-700 outline-none focus:bg-neutral-100", className)} {...props}><span className="absolute left-2 flex size-4 items-center justify-center"><SelectPrimitive.ItemIndicator><Check className="size-4" /></SelectPrimitive.ItemIndicator></span><SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText></SelectPrimitive.Item>;
}
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
