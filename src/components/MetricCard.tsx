import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "green" | "blue" | "amber" | "red";
  className?: string;
}

const variantStyles = {
  green: "gradient-energy",
  blue: "gradient-info",
  amber: "gradient-solar",
  red: "bg-destructive",
};

const MetricCard = ({ title, value, subtitle, icon: Icon, variant = "green", className }: MetricCardProps) => (
  <div className={cn("rounded-xl bg-card p-5 shadow-card transition-all hover:shadow-card-hover", className)}>
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", variantStyles[variant])}>
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
    </div>
  </div>
);

export default MetricCard;
