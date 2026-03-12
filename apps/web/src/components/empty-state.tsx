"use client";

import { useRef, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import gsap from "gsap";

interface EmptyStateProps {
  illustration?: React.ReactNode;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
  };
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeConfig = {
  sm: { padding: "py-6", illustration: "h-[80px] w-[80px]", gap: "gap-2" },
  md: { padding: "py-10", illustration: "h-[120px] w-[120px]", gap: "gap-3" },
  lg: { padding: "py-16", illustration: "h-[160px] w-[160px]", gap: "gap-4" },
};

export function EmptyState({
  illustration,
  icon,
  title,
  description,
  action,
  size = "md",
  className,
}: EmptyStateProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  const config = sizeConfig[size];

  const actionButton = action ? (
    <Button
      variant="outline"
      size="sm"
      className="mt-1 shadow-sm"
      onClick={action.onClick}
    >
      {action.icon}
      {action.label}
    </Button>
  ) : null;

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        config.padding,
        config.gap,
        className,
      )}
    >
      {illustration ? (
        <div className={config.illustration}>{illustration}</div>
      ) : icon ? (
        <div className="text-muted-foreground/30">{icon}</div>
      ) : null}
      <p className="font-medium text-muted-foreground">{title}</p>
      {description && (
        <p className="max-w-[280px] text-sm text-muted-foreground/70">
          {description}
        </p>
      )}
      {action?.href ? (
        <Link href={action.href}>{actionButton}</Link>
      ) : (
        actionButton
      )}
    </div>
  );
}
