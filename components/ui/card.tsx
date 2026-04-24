import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-white border border-ink-100 shadow-card",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pb-2", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-ink-600", className)} {...props} />;
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-3", className)} {...props} />;
}

export function KpiCard({
  label,
  value,
  hint,
  tone = "clinic",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "clinic" | "mint" | "coral" | "sand";
}) {
  const tones: Record<string, string> = {
    clinic: "from-clinic-50 to-white text-clinic-700",
    mint: "from-mint-50 to-white text-mint-700",
    coral: "from-coral-50 to-white text-coral-700",
    sand: "from-sand-50 to-white text-ink-800",
  };
  return (
    <div
      className={cn(
        "rounded-3xl border border-ink-100 p-4 bg-gradient-to-b shadow-card",
        tones[tone]
      )}
    >
      <div className="text-xs font-medium uppercase tracking-wide opacity-70">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs opacity-70">{hint}</div>}
    </div>
  );
}
