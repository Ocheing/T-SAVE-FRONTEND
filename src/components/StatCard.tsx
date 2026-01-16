import { LucideIcon } from "lucide-react";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  iconColor?: string;
  iconBgColor?: string;
}

const StatCard = ({ title, value, icon: Icon, trend, trendUp, iconColor, iconBgColor }: StatCardProps) => {
  return (
    <Card className="p-6 hover:shadow-[var(--shadow-card)] transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {trend && (
            <p className={cn("text-sm flex items-center gap-1", trendUp ? 'text-green-600' : 'text-red-600')}>
              <span>{trend}</span>
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", iconBgColor || "bg-gradient-ocean")}>
          <Icon className={cn("h-6 w-6", iconColor || "text-white")} />
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
