import * as React from "react";
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

function Accordion({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root className={cn("w-full", className)} keepMounted {...props} />;
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={cn("group/item border-b border-[#2a2f36] py-4", className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="m-0">
      <AccordionPrimitive.Trigger
        className={cn(
          "flex w-full items-start justify-between gap-4 text-left text-[1.02rem] font-medium text-white transition-colors hover:text-[#8fb0d8]",
          className
        )}
        {...props}
      >
        <span>{children}</span>
        <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--text-dim)] transition-transform duration-200 group-data-[open]/item:rotate-180" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Panel>) {
  return (
    <AccordionPrimitive.Panel
      className={cn(
        "h-[var(--accordion-panel-height)] overflow-hidden text-sm leading-7 text-[color:var(--text-muted)] transition-[height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[starting-style]:h-0 data-[ending-style]:h-0 motion-reduce:transition-none sm:text-[0.98rem]",
        className
      )}
      {...props}
    >
      <div className="pt-3 pr-6">{children}</div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
