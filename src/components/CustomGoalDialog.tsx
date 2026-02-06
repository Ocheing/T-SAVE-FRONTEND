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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Target,
    Lock,
    Unlock,
    Loader2,
    DollarSign,
    CalendarDays,
    TrendingUp,
    Sparkles,
    Palmtree,
    Mountain,
    Building2,
    Compass,
    Theater,
    Music,
    PenLine,
} from "lucide-react";
import { useCreateTrip } from "@/hooks/useTrips";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, addMonths, differenceInDays } from "date-fns";

interface CustomGoalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    initialCategory?: string;
}

const CATEGORIES = [
    { value: "beach", label: "Beach", icon: Palmtree, color: "text-sky-500" },
    { value: "mountain", label: "Mountain", icon: Mountain, color: "text-amber-700" },
    { value: "city", label: "City", icon: Building2, color: "text-indigo-500" },
    { value: "adventure", label: "Adventure", icon: Compass, color: "text-emerald-500" },
    { value: "cultural", label: "Cultural", icon: Theater, color: "text-rose-500" },
    { value: "event", label: "Live Event", icon: Music, color: "text-fuchsia-500" },
];

export function CustomGoalDialog({
    open,
    onOpenChange,
    onSuccess,
    initialCategory = "adventure",
}: CustomGoalDialogProps) {
    const createTrip = useCreateTrip();
    const { toast } = useToast();

    // Fully editable form fields
    const [goalName, setGoalName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState(initialCategory);
    const [targetAmount, setTargetAmount] = useState("");
    const [targetDate, setTargetDate] = useState("");
    const [goalType, setGoalType] = useState<"flexible" | "locked">("flexible");
    const [savingsFrequency, setSavingsFrequency] = useState<"daily" | "weekly" | "monthly">("monthly");
    const [dailyTarget, setDailyTarget] = useState("");
    const [weeklyTarget, setWeeklyTarget] = useState("");
    const [monthlyTarget, setMonthlyTarget] = useState("");

    // Auto-calculate suggested targets when target amount or date changes
    useEffect(() => {
        if (targetAmount && targetDate) {
            const daysUntilTarget = differenceInDays(new Date(targetDate), new Date());
            if (daysUntilTarget > 0) {
                const amount = parseFloat(targetAmount);
                if (!isNaN(amount) && amount > 0) {
                    const dailySuggested = (amount / daysUntilTarget).toFixed(0);
                    const weeklySuggested = (amount / Math.ceil(daysUntilTarget / 7)).toFixed(0);
                    const monthlySuggested = (amount / Math.ceil(daysUntilTarget / 30)).toFixed(0);

                    // Only set if empty
                    if (!dailyTarget) setDailyTarget(dailySuggested);
                    if (!weeklyTarget) setWeeklyTarget(weeklySuggested);
                    if (!monthlyTarget) setMonthlyTarget(monthlySuggested);
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetAmount, targetDate]);

    // Set default target date
    useEffect(() => {
        if (open && !targetDate) {
            setTargetDate(format(addMonths(new Date(), 3), "yyyy-MM-dd"));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Reset form when dialog closes
    useEffect(() => {
        if (!open) {
            setGoalName("");
            setDescription("");
            setCategory(initialCategory);
            setTargetAmount("");
            setTargetDate("");
            setGoalType("flexible");
            setSavingsFrequency("monthly");
            setDailyTarget("");
            setWeeklyTarget("");
            setMonthlyTarget("");
        }
    }, [open, initialCategory]);

    const handleCreateGoal = async () => {
        if (!goalName.trim()) {
            toast({
                title: "Missing goal name",
                description: "Please enter a name for your savings goal.",
                variant: "destructive",
            });
            return;
        }

        if (!targetAmount || parseFloat(targetAmount) <= 0) {
            toast({
                title: "Invalid target amount",
                description: "Please enter a valid target amount.",
                variant: "destructive",
            });
            return;
        }

        if (!targetDate) {
            toast({
                title: "Missing target date",
                description: "Please select a target date.",
                variant: "destructive",
            });
            return;
        }

        const currentTarget =
            savingsFrequency === "daily" ? dailyTarget :
                savingsFrequency === "weekly" ? weeklyTarget : monthlyTarget;

        if (!currentTarget || parseFloat(currentTarget) <= 0) {
            toast({
                title: "Invalid savings target",
                description: `Please enter a valid ${savingsFrequency} savings target.`,
                variant: "destructive",
            });
            return;
        }

        try {
            await createTrip.mutateAsync({
                destination: goalName.trim(),
                description: description.trim() || null,
                category: category as 'beach' | 'mountain' | 'city' | 'adventure' | 'cultural' | 'event',
                goal_type: goalType,
                target_amount: parseFloat(targetAmount),
                target_date: targetDate,
                // Custom goal specific fields
                destination_id: null,
                is_custom_goal: true,
                savings_frequency: savingsFrequency,
                daily_target: parseFloat(dailyTarget) || null,
                weekly_target: parseFloat(weeklyTarget) || null,
                monthly_target: parseFloat(monthlyTarget) || null,
                location: null,
            });

            toast({
                title: "🎯 Custom goal created!",
                description: `Your savings goal "${goalName}" has been created. ${goalType === "locked" ? "Funds locked until you reach your goal!" : "Flexible withdrawals enabled."
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

    const daysUntilTarget = targetDate
        ? differenceInDays(new Date(targetDate), new Date())
        : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-card dark:border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <PenLine className="h-5 w-5 text-primary" />
                        Create Custom Savings Goal
                    </DialogTitle>
                    <DialogDescription>
                        Design your own goal with full control over all details.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Goal Name */}
                    <div className="space-y-2">
                        <Label htmlFor="goal_name" className="text-xs flex items-center gap-1.5">
                            <Target className="h-3 w-3 text-primary" />
                            Goal Name *
                        </Label>
                        <Input
                            id="goal_name"
                            placeholder="e.g., Dream Vacation, Wedding Fund, Emergency Travel"
                            value={goalName}
                            onChange={(e) => setGoalName(e.target.value)}
                            className="dark:bg-background dark:border-input"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-xs flex items-center gap-1.5">
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            placeholder="Describe your savings goal..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="resize-none dark:bg-background dark:border-input"
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label className="text-xs">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="dark:bg-background dark:border-input">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                        <div className="flex items-center gap-2">
                                            <cat.icon className={`h-4 w-4 ${cat.color}`} />
                                            {cat.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Target Amount */}
                    <div className="space-y-2">
                        <Label htmlFor="target_amount" className="text-xs flex items-center gap-1.5">
                            <DollarSign className="h-3 w-3 text-primary" />
                            Target Amount ($) *
                        </Label>
                        <Input
                            id="target_amount"
                            type="number"
                            placeholder="5000"
                            value={targetAmount}
                            onChange={(e) => setTargetAmount(e.target.value)}
                            className="dark:bg-background dark:border-input"
                        />
                    </div>

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

                    <Separator />

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
                                <Label htmlFor="custom_daily_target" className="text-[10px] text-muted-foreground">
                                    Daily
                                </Label>
                                <Input
                                    id="custom_daily_target"
                                    type="number"
                                    placeholder="0"
                                    value={dailyTarget}
                                    onChange={(e) => setDailyTarget(e.target.value)}
                                    className={`h-8 text-sm ${savingsFrequency === "daily" ? "ring-2 ring-primary" : ""} dark:bg-background`}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="custom_weekly_target" className="text-[10px] text-muted-foreground">
                                    Weekly
                                </Label>
                                <Input
                                    id="custom_weekly_target"
                                    type="number"
                                    placeholder="0"
                                    value={weeklyTarget}
                                    onChange={(e) => setWeeklyTarget(e.target.value)}
                                    className={`h-8 text-sm ${savingsFrequency === "weekly" ? "ring-2 ring-primary" : ""} dark:bg-background`}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="custom_monthly_target" className="text-[10px] text-muted-foreground">
                                    Monthly
                                </Label>
                                <Input
                                    id="custom_monthly_target"
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
                                <RadioGroupItem value="flexible" id="custom_flexible" />
                                <Label htmlFor="custom_flexible" className="flex items-center gap-1 cursor-pointer text-sm">
                                    <Unlock className="h-4 w-4 text-green-600" />
                                    <span>Flexible</span>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="locked" id="custom_locked" />
                                <Label htmlFor="custom_locked" className="flex items-center gap-1 cursor-pointer text-sm">
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
                                Create Goal
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default CustomGoalDialog;
