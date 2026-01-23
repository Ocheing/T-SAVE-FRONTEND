import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: {
        value: string;
        isUp: boolean;
    };
    className?: string;
    iconClassName?: string;
}

export function StatsCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    className,
    iconClassName
}: StatsCardProps) {
    return (
        <Card className={cn("border-none shadow-md", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className={cn("p-2 rounded-lg bg-primary/10 text-primary", iconClassName)}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {(description || trend) && (
                    <div className="flex items-center mt-1 text-xs text-muted-foreground">
                        {trend && (
                            <span className={cn(
                                "font-semibold mr-1",
                                trend.isUp ? "text-emerald-500" : "text-destructive"
                            )}>
                                {trend.value}
                            </span>
                        )}
                        <span>{description}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
