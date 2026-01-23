import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    MapPin,
    DollarSign,
    Calendar,
    Lock,
    Unlock,
    Loader2,
    Target,
    TrendingUp,
    CalendarDays,
    Sparkles,
} from "lucide-react";
import { useCreateTrip } from "@/hooks/useTrips";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { format, differenceInDays, addDays, addWeeks, addMonths } from "date-fns";
import type { Destination } from "@/types/database.types";

interface DestinationGoalDialogProps {
    destination: Destination | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function DestinationGoalDialog({
    destination,
    open,
    onOpenChange,
    onSuccess,
}: DestinationGoalDialogProps) {
    const createTrip = useCreateTrip();
    const { toast } = useToast();
    const { formatPrice } = useCurrency();

    // Form state - only editable fields
    const [goalType, setGoalType] = useState<"flexible" | "locked">("flexible");
    const [savingsFrequency, setSavingsFrequency] = useState<"daily" | "weekly" | "monthly">("monthly");
    const [dailyTarget, setDailyTarget] = useState("");
    const [weeklyTarget, setWeeklyTarget] = useState("");
    const [monthlyTarget, setMonthlyTarget] = useState("");
    const [targetDate, setTargetDate] = useState("");

    // Calculate suggested targets based on destination price and date
    useEffect(() => {
        if (destination && targetDate) {
            const daysUntilTarget = differenceInDays(new Date(targetDate), new Date());
            if (daysUntilTarget > 0) {
                const targetAmount = Number(destination.estimated_cost);
                const dailySuggested = (targetAmount / daysUntilTarget).toFixed(0);
                const weeklySuggested = (targetAmount / Math.ceil(daysUntilTarget / 7)).toFixed(0);
                const monthlySuggested = (targetAmount / Math.ceil(daysUntilTarget / 30)).toFixed(0);

                // Only set if empty (don't override user input)
                if (!dailyTarget) setDailyTarget(dailySuggested);
                if (!weeklyTarget) setWeeklyTarget(weeklySuggested);
                if (!monthlyTarget) setMonthlyTarget(monthlySuggested);
            }
        }
    }, [destination, targetDate]);

    // Set default target date (3 months from now)
    useEffect(() => {
        if (open && !targetDate) {
            setTargetDate(format(addMonths(new Date(), 3), "yyyy-MM-dd"));
        }
    }, [open]);

    // Reset form when dialog closes
    useEffect(() => {
        if (!open) {
            setGoalType("flexible");
            setSavingsFrequency("monthly");
            setDailyTarget("");
            setWeeklyTarget("");
            setMonthlyTarget("");
            setTargetDate("");
        }
    }, [open]);

    const handleCreateGoal = async () => {
        if (!destination || !targetDate) {
            toast({
                title: "Missing fields",
                description: "Please select a target date.",
                variant: "destructive",
            });
            return;
        }

        // Get the relevant target based on frequency
        const currentTarget =
            savingsFrequency === "daily" ? dailyTarget :
                savingsFrequency === "weekly" ? weeklyTarget : monthlyTarget;

        if (!currentTarget || parseFloat(currentTarget) <= 0) {
            toast({
                title: "Invalid target",
                description: `Please enter a valid ${savingsFrequency} savings target.`,
                variant: "destructive",
            });
            return;
        }

        try {
            await createTrip.mutateAsync({
                destination: destination.name,
                description: destination.description || null,
                category: (destination.categories?.[0] || 'adventure') as 'beach' | 'mountain' | 'city' | 'adventure' | 'cultural' | 'event',
                goal_type: goalType,
                target_amount: Number(destination.estimated_cost),
                target_date: targetDate,
                image_url: destination.image_url || null,
                // Enhanced savings goal fields
                destination_id: destination.id,
                is_custom_goal: false,
                savings_frequency: savingsFrequency,
                daily_target: parseFloat(dailyTarget) || null,
                weekly_target: parseFloat(weeklyTarget) || null,
                monthly_target: parseFloat(monthlyTarget) || null,
                location: destination.location || null,
            });

            toast({
                title: "🎯 Savings goal started!",
                description: `You're now saving for ${destination.name}. ${goalType === "locked" ? "Funds locked until you reach your goal!" : "Flexible withdrawals enabled."
                    }`,
            });

            onOpenChange(false);
            onSuccess?.();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to create savings goal.";
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        }
    };

    if (!destination) return null;

    const daysUntilTarget = targetDate
        ? differenceInDays(new Date(targetDate), new Date())
        : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg dark:bg-card dark:border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Start Saving for {destination.name}
                    </DialogTitle>
                    <DialogDescription>
                        Your destination details are locked. Set your savings targets below.
                    </DialogDescription>
                </DialogHeader>

                {/* Locked Destination Preview */}
                <Card className="overflow-hidden relative dark:bg-muted/30 dark:border-border">
                    <div className="absolute top-2 right-2 z-10">
                        <Badge variant="secondary" className="text-[10px] gap-1 bg-primary/10 text-primary border-none">
                            <Lock className="h-2.5 w-2.5" />
                            Locked
                        </Badge>
                    </div>
                    <div className="flex">
                        <div className="w-28 h-24 flex-shrink-0">
                            <img
                                src={destination.image_url || "/placeholder.jpg"}
                                alt={destination.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="p-3 flex-1 min-w-0">
                            <h3 className="font-bold text-sm truncate">{destination.name}</h3>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                                <MapPin className="h-2.5 w-2.5" />
                                {destination.location || "Various locations"}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="default" className="text-xs font-black">
                                    <DollarSign className="h-3 w-3 mr-0.5" />
                                    {formatPrice(Number(destination.estimated_cost))}
                                </Badge>
                                {destination.duration && (
                                    <Badge variant="outline" className="text-[10px]">
                                        {destination.duration}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="space-y-4 py-2">
                    {/* Target Date */}
                    <div className="space-y-2">
                        <Label htmlFor="target_date" className="text-xs flex items-center gap-1.5">
                            <CalendarDays className="h-3 w-3 text-primary" />
                            Target Date *
                        </Label>
                        <Input
                            id="target_date"
                            type="date"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                            min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
                            className="dark:bg-background dark:border-input"
                        />
                        {daysUntilTarget > 0 && (
                            <p className="text-[10px] text-muted-foreground">
                                {daysUntilTarget} days to reach your goal
                            </p>
                        )}
                    </div>

                    {/* Savings Frequency */}
                    <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-1.5">
                            <TrendingUp className="h-3 w-3 text-primary" />
                            Savings Frequency
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                            {(["daily", "weekly", "monthly"] as const).map((freq) => (
                                <Button
                                    key={freq}
                                    type="button"
                                    variant={savingsFrequency === freq ? "default" : "outline"}
                                    size="sm"
                                    className="text-xs capitalize"
                                    onClick={() => setSavingsFrequency(freq)}
                                >
                                    {freq}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Savings Targets */}
                    <div className="space-y-3 p-3 rounded-lg bg-muted/50 dark:bg-muted/30">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-semibold">Your Savings Targets</span>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="daily_target" className="text-[10px] text-muted-foreground">
                                    Daily
                                </Label>
                                <Input
                                    id="daily_target"
                                    type="number"
                                    placeholder="0"
                                    value={dailyTarget}
                                    onChange={(e) => setDailyTarget(e.target.value)}
                                    className={`h-8 text-sm ${savingsFrequency === "daily" ? "ring-2 ring-primary" : ""} dark:bg-background`}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="weekly_target" className="text-[10px] text-muted-foreground">
                                    Weekly
                                </Label>
                                <Input
                                    id="weekly_target"
                                    type="number"
                                    placeholder="0"
                                    value={weeklyTarget}
                                    onChange={(e) => setWeeklyTarget(e.target.value)}
                                    className={`h-8 text-sm ${savingsFrequency === "weekly" ? "ring-2 ring-primary" : ""} dark:bg-background`}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="monthly_target" className="text-[10px] text-muted-foreground">
                                    Monthly
                                </Label>
                                <Input
                                    id="monthly_target"
                                    type="number"
                                    placeholder="0"
                                    value={monthlyTarget}
                                    onChange={(e) => setMonthlyTarget(e.target.value)}
                                    className={`h-8 text-sm ${savingsFrequency === "monthly" ? "ring-2 ring-primary" : ""} dark:bg-background`}
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            💡 Your <span className="font-semibold text-primary">{savingsFrequency}</span> target is highlighted
                        </p>
                    </div>

                    <Separator />

                    {/* Goal Type */}
                    <div className="space-y-2">
                        <Label className="text-xs">Goal Type</Label>
                        <RadioGroup
                            value={goalType}
                            onValueChange={(value: "flexible" | "locked") => setGoalType(value)}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="flexible" id="flexible" />
                                <Label htmlFor="flexible" className="flex items-center gap-1 cursor-pointer text-sm">
                                    <Unlock className="h-4 w-4 text-green-600" />
                                    <span>Flexible</span>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="locked" id="locked" />
                                <Label htmlFor="locked" className="flex items-center gap-1 cursor-pointer text-sm">
                                    <Lock className="h-4 w-4 text-orange-600" />
                                    <span>Locked</span>
                                </Label>
                            </div>
                        </RadioGroup>
                        <p className="text-[10px] text-muted-foreground">
                            {goalType === "flexible"
                                ? "💡 Withdraw anytime - perfect for flexible travel plans"
                                : "🔒 Funds locked until you reach your goal - helps you stay committed!"}
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="hero"
                        onClick={handleCreateGoal}
                        disabled={createTrip.isPending}
                    >
                        {createTrip.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Target className="h-4 w-4 mr-2" />
                                Start Saving
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default DestinationGoalDialog;
