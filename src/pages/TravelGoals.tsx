import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Target,
  Plus,
  TrendingUp,
  Loader2,
  Trash2,
  DollarSign,
  Lock,
  Unlock,
  Music,
  ArrowDownCircle,
  Star,
  Receipt,
  Palmtree,
  Mountain,
  Building2,
  Compass,
  Theater,
  Mic,
  Tent,
  Trophy,
  ClipboardList,
  Pin,
  Plane,
  MapPin,
  CalendarDays,
  PenLine,
  Sparkles,
  Clock,
} from "lucide-react";
import TripCard from "@/components/TripCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTrips, useCreateTrip, useDeleteTrip, useTripStats } from "@/hooks/useTrips";
import { useCreateTransaction } from "@/hooks/useTransactions";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslation } from "react-i18next";
import { DestinationGoalDialog } from "@/components/DestinationGoalDialog";
import { CustomGoalDialog } from "@/components/CustomGoalDialog";
import PaystackPaymentModal from "@/components/PaystackPaymentModal";
import { formatKES } from "@/lib/paystackService"; // used by payment modal internally
import heroBeach from "@/assets/hero-beach.jpg";
import mountainAdventure from "@/assets/mountain-adventure.jpg";
import savingsTravel from "@/assets/savings-travel.jpg";
import type { Destination, Trip } from "@/types/database.types";

const TravelGoals = () => {
  const location = useLocation();
  const { data: trips, isLoading, refetch } = useTrips();
  const { data: tripStats } = useTripStats();
  const deleteTrip = useDeleteTrip();
  const createTransaction = useCreateTransaction();

  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();

  // Dialog states
  const [isDestinationDialogOpen, setIsDestinationDialogOpen] = useState(false);
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [isAddFundsDialogOpen, setIsAddFundsDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [activeTab, setActiveTab] = useState("trips");
  const [isPaymentReady, setIsPaymentReady] = useState(false);

  // For destination-based goals from navigation state
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);

  // Check if navigated from a destination click
  useEffect(() => {
    const destinationFromState = location.state?.destination as Destination | undefined;
    if (destinationFromState) {
      setSelectedDestination(destinationFromState);
      setIsDestinationDialogOpen(true);
      // Clear the state to prevent re-opening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const getImageForCategory = (category: string | null) => {
    switch (category) {
      case "beach": return heroBeach;
      case "mountain": return mountainAdventure;
      case "event": return savingsTravel;
      default: return savingsTravel;
    }
  };

  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case "beach": return Palmtree;
      case "mountain": return Mountain;
      case "city": return Building2;
      case "adventure": return Compass;
      case "cultural": return Theater;
      case "event": return Music;
      default: return Target;
    }
  };

  const handleDeleteTrip = async () => {
    if (!tripToDelete) return;

    try {
      await deleteTrip.mutateAsync(tripToDelete);
      toast({
        title: "Goal deleted",
        description: "Your savings goal has been removed.",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete goal.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setTripToDelete(null);
    }
  };

  const handlePaymentInitiated = (reference: string) => {
    // Payment has been initiated and user will be redirected to Paystack.
    // After payment, they return to /payment/callback which handles verification.
    // The DB function automatically updates savings when payment succeeds.
    console.log('[TravelGoals] Payment initiated, reference:', reference);
  };

  const handleWithdraw = async () => {
    if (!selectedTripId || !withdrawAmount || !selectedTrip) return;

    const amount = parseFloat(withdrawAmount);

    // Check if it's a locked goal
    if (
      selectedTrip.goal_type === "locked" &&
      selectedTrip.saved_amount < selectedTrip.target_amount
    ) {
      toast({
        title: "Cannot withdraw",
        description:
          "This is a locked goal. You can only withdraw once you've reached your target amount.",
        variant: "destructive",
      });
      return;
    }

    // Check if enough balance
    if (amount > selectedTrip.saved_amount) {
      toast({
        title: "Insufficient funds",
        description: "You cannot withdraw more than your saved amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createTransaction.mutateAsync({
        trip_id: selectedTripId,
        type: "withdrawal",
        amount: amount,
        description: "Withdrawal from savings",
      });

      toast({
        title: "✅ Withdrawal successful!",
        description: `${formatPrice(amount)} has been withdrawn from your savings.`,
      });

      setWithdrawAmount("");
      setIsWithdrawDialogOpen(false);
      setSelectedTripId(null);
      setSelectedTrip(null);
      refetch();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to withdraw funds.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const openWithdrawDialog = (trip: Trip) => {
    setSelectedTripId(trip.id);
    setSelectedTrip(trip);
    setIsWithdrawDialogOpen(true);
  };

  const totalSaved = tripStats?.totalSaved || 0;
  const totalTarget = tripStats?.totalTarget || 0;
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const activeTrips = trips?.filter((t) => t.status === "active" && t.category !== "event") || [];
  const eventTrips = trips?.filter((t) => t.status === "active" && t.category === "event") || [];

  // Split by goal type
  const destinationGoals = activeTrips.filter((t) => !t.is_custom_goal);
  const customGoals = activeTrips.filter((t) => t.is_custom_goal);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderGoalCard = (trip: Trip, index: number) => {
    const progress = (trip.saved_amount / trip.target_amount) * 100;
    const daysLeft = differenceInDays(new Date(trip.target_date), new Date());
    const CategoryIcon = getCategoryIcon(trip.category);

    return (
      <div
        key={trip.id}
        className="animate-fade-in"
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 dark:bg-card dark:border-border group">
          <div className="flex flex-col md:flex-row">
            {/* Image Section */}
            <div className="md:w-48 h-32 md:h-auto relative overflow-hidden">
              <img
                src={trip.image_url || getImageForCategory(trip.category)}
                alt={trip.destination}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r md:bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                {trip.goal_type === "locked" ? (
                  <Badge className="bg-orange-500/90 text-white text-[10px] border-none">
                    <Lock className="h-2.5 w-2.5 mr-0.5" />
                    Locked
                  </Badge>
                ) : (
                  <Badge className="bg-green-500/90 text-white text-[10px] border-none">
                    <Unlock className="h-2.5 w-2.5 mr-0.5" />
                    Flexible
                  </Badge>
                )}
                {trip.is_custom_goal && (
                  <Badge variant="secondary" className="text-[10px]">
                    <PenLine className="h-2.5 w-2.5 mr-0.5" />
                    Custom
                  </Badge>
                )}
              </div>
              {!trip.is_custom_goal && (
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary" className="text-[10px] bg-black/50 text-white border-none">
                    <MapPin className="h-2.5 w-2.5 mr-0.5" />
                    {trip.location || "Destination"}
                  </Badge>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="flex-1 p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <CategoryIcon className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-base">{trip.destination}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    <span>Target: {format(new Date(trip.target_date), "MMM dd, yyyy")}</span>
                    {daysLeft > 0 && (
                      <Badge variant="outline" className="text-[8px] h-4">
                        <Clock className="h-2 w-2 mr-0.5" />
                        {daysLeft}d left
                      </Badge>
                    )}
                  </div>
                </div>
                {trip.savings_frequency && (
                  <Badge variant="outline" className="text-[10px] capitalize">
                    <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                    {trip.savings_frequency}
                  </Badge>
                )}
              </div>

              {/* Savings Target Display */}
              {(trip.daily_target || trip.weekly_target || trip.monthly_target) && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  {trip.daily_target && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${trip.savings_frequency === "daily" ? "bg-primary/20 text-primary font-semibold" : "bg-muted"}`}>
                      Daily: {formatPrice(trip.daily_target)}
                    </span>
                  )}
                  {trip.weekly_target && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${trip.savings_frequency === "weekly" ? "bg-primary/20 text-primary font-semibold" : "bg-muted"}`}>
                      Weekly: {formatPrice(trip.weekly_target)}
                    </span>
                  )}
                  {trip.monthly_target && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${trip.savings_frequency === "monthly" ? "bg-primary/20 text-primary font-semibold" : "bg-muted"}`}>
                      Monthly: {formatPrice(trip.monthly_target)}
                    </span>
                  )}
                </div>
              )}

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-primary">
                    {formatPrice(trip.saved_amount)} saved
                  </span>
                  <span className="text-muted-foreground">
                    of {formatPrice(trip.target_amount)}
                  </span>
                </div>
                <Progress value={Math.min(progress, 100)} className="h-2" />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-muted-foreground">
                    {progress.toFixed(1)}% complete
                  </span>
                  {progress >= 100 && (
                    <Badge className="bg-green-500 text-white text-[10px] border-none">
                      <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                      Goal Reached!
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    setSelectedTripId(trip.id);
                    setSelectedTrip(trip);
                    setIsAddFundsDialogOpen(true);
                  }}
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Add Funds
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openWithdrawDialog(trip)}
                  disabled={
                    trip.goal_type === "locked" &&
                    trip.saved_amount < trip.target_amount
                  }
                >
                  <ArrowDownCircle className="h-4 w-4 mr-1" />
                  Withdraw
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setTripToDelete(trip.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {trip.goal_type === "locked" &&
                trip.saved_amount < trip.target_amount && (
                  <p className="text-[10px] text-orange-600 mt-2">
                    🔒 Withdrawal locked until you reach{" "}
                    {formatPrice(trip.target_amount)}
                  </p>
                )}
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen py-6 dark:bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-6 animate-fade-in flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Target className="h-7 w-7 text-primary" />
              {t('travelGoals.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('travelGoals.subtitle')}
            </p>
          </div>
          <Link to="/transactions">
            <Button variant="outline" size="sm">
              <Receipt className="h-4 w-4 mr-2" />
              {t('dashboard.viewTransactions')}
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8 animate-scale-in">
          <Card className="p-4 dark:bg-card dark:border-border">
            <div className="text-xs text-muted-foreground mb-1">{t('dashboard.totalSavings')}</div>
            <div className="text-xl font-bold text-primary">
              {formatPrice(totalSaved)}
            </div>
          </Card>
          <Card className="p-4 dark:bg-card dark:border-border">
            <div className="text-xs text-muted-foreground mb-1">Total Target</div>
            <div className="text-xl font-bold">{formatPrice(totalTarget)}</div>
          </Card>
          <Card className="p-4 dark:bg-card dark:border-border">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {t('travelGoals.progress')}
            </div>
            <div className="text-xl font-bold text-primary">
              {overallProgress.toFixed(1)}%
            </div>
            <Progress value={Math.min(overallProgress, 100)} className="h-1 mt-1" />
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <TabsList className="dark:bg-muted">
              <TabsTrigger value="trips" className="text-sm">
                <Plane className="h-4 w-4 mr-2" />
                {t('travelGoals.title')} ({activeTrips.length})
              </TabsTrigger>
              <TabsTrigger value="events" className="text-sm">
                <Music className="h-4 w-4 mr-2" />
                Live Events ({eventTrips.length})
              </TabsTrigger>
            </TabsList>

            {/* Create Goal Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="hero">
                  <Plus className="h-4 w-4 mr-1" />
                  {t('travelGoals.createGoal')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/trips" className="flex items-center gap-2 cursor-pointer">
                    <MapPin className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">{t('trips.browseTrips')}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Save for a destination from our catalog
                      </p>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setIsCustomDialogOpen(true)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <PenLine className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">{t('travelGoals.customGoal')}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Create your own savings goal
                    </p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <TabsContent value="trips">
            {activeTrips.length === 0 ? (
              <Card className="p-12 text-center dark:bg-card dark:border-border">
                <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">{t('dashboard.noGoalsYet')}</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {t('travelGoals.startExploring')}
                </p>
                <div className="flex gap-3 justify-center">
                  <Link to="/trips">
                    <Button variant="default">
                      <MapPin className="h-4 w-4 mr-2" />
                      {t('wishlist.exploreDestinations')}
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => setIsCustomDialogOpen(true)}
                  >
                    <PenLine className="h-4 w-4 mr-2" />
                    {t('travelGoals.customGoal')}
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeTrips.map((trip, index) => renderGoalCard(trip, index))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="events">
            {eventTrips.length === 0 ? (
              <Card className="p-12 text-center dark:bg-card dark:border-border">
                <Music className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">{t('travelGoals.noEventsYet')}</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {t('travelGoals.saveForEvents')}
                </p>
                <Button
                  variant="hero"
                  onClick={() => {
                    setIsCustomDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('travelGoals.createGoal')}
                </Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {eventTrips.map((trip, index) => (
                  <Card
                    key={trip.id}
                    className="overflow-hidden animate-fade-in dark:bg-card dark:border-border"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <Badge className="mb-2 text-xs gap-1">
                            {trip.event_type === "concert" && (
                              <>
                                <Mic className="h-3 w-3" />
                                Concert
                              </>
                            )}
                            {trip.event_type === "festival" && (
                              <>
                                <Tent className="h-3 w-3" />
                                Festival
                              </>
                            )}
                            {trip.event_type === "sports" && (
                              <>
                                <Trophy className="h-3 w-3" />
                                Sports
                              </>
                            )}
                            {trip.event_type === "conference" && (
                              <>
                                <ClipboardList className="h-3 w-3" />
                                Conference
                              </>
                            )}
                            {trip.event_type === "other" && (
                              <>
                                <Pin className="h-3 w-3" />
                                Event
                              </>
                            )}
                            {!trip.event_type && (
                              <>
                                <Music className="h-3 w-3" />
                                Event
                              </>
                            )}
                          </Badge>
                          <h3 className="font-bold text-lg">{trip.destination}</h3>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(trip.target_date), "MMM dd, yyyy")}
                          </p>
                        </div>
                        {trip.goal_type === "locked" ? (
                          <Lock className="h-4 w-4 text-orange-500" />
                        ) : (
                          <Unlock className="h-4 w-4 text-green-500" />
                        )}
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-semibold">
                            {formatPrice(trip.saved_amount)}
                          </span>
                          <span className="text-muted-foreground">
                            / {formatPrice(trip.target_amount)}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(
                            (trip.saved_amount / trip.target_amount) * 100,
                            100
                          )}
                          className="h-2"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedTripId(trip.id);
                            setSelectedTrip(trip);
                            setIsAddFundsDialogOpen(true);
                          }}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openWithdrawDialog(trip)}
                          disabled={
                            trip.goal_type === "locked" &&
                            trip.saved_amount < trip.target_amount
                          }
                        >
                          <ArrowDownCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setTripToDelete(trip.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Destination Goal Dialog */}
        <DestinationGoalDialog
          destination={selectedDestination}
          open={isDestinationDialogOpen}
          onOpenChange={(open) => {
            setIsDestinationDialogOpen(open);
            if (!open) setSelectedDestination(null);
          }}
          onSuccess={() => refetch()}
        />

        {/* Custom Goal Dialog */}
        <CustomGoalDialog
          open={isCustomDialogOpen}
          onOpenChange={setIsCustomDialogOpen}
          onSuccess={() => refetch()}
        />

        {/* Add Funds Dialog - Step 1: Enter Amount */}
        <Dialog open={isAddFundsDialogOpen && !isPaymentReady} onOpenChange={(open) => {
          if (!open) {
            setIsAddFundsDialogOpen(false);
            setDepositAmount("");
            setSelectedTripId(null);
            setSelectedTrip(null);
            setIsPaymentReady(false);
          }
        }}>
          <DialogContent className="dark:bg-card dark:border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                {t('travelGoals.addFunds')}
              </DialogTitle>
              <DialogDescription>
                {selectedTrip ? (
                  <>Adding funds to: <strong>{selectedTrip.destination}</strong></>
                ) : (
                  t('travelGoals.enterAddFundsAmount')
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {selectedTrip && (
                <div className="bg-muted/50 p-3 rounded-lg text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Current savings</span>
                    <span className="font-medium">{formatPrice(selectedTrip.saved_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target</span>
                    <span className="font-medium">{formatPrice(selectedTrip.target_amount)}</span>
                  </div>
                  <Progress
                    value={Math.min((selectedTrip.saved_amount / selectedTrip.target_amount) * 100, 100)}
                    className="h-1.5 mt-2"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">{t('transactions.amount')} (KES)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="1000"
                  min="1"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="dark:bg-background dark:border-input text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the amount in Kenyan Shillings (KES)
                </p>
              </div>

              {/* Quick amount buttons */}
              <div className="flex flex-wrap gap-2">
                {[500, 1000, 2500, 5000, 10000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setDepositAmount(amount.toString())}
                    className="text-xs"
                  >
                    KES {amount.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddFundsDialogOpen(false);
                  setSelectedTripId(null);
                  setSelectedTrip(null);
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="hero"
                disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                onClick={() => {
                  // Transition from the amount entry dialog to the payment modal
                  setIsPaymentReady(true);
                }}
              >
                Continue to Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Paystack Payment Modal - Step 2: Process Payment */}
        <PaystackPaymentModal
          open={isAddFundsDialogOpen && isPaymentReady && !!depositAmount && parseFloat(depositAmount) > 0}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddFundsDialogOpen(false);
              setDepositAmount("");
              setSelectedTripId(null);
              setSelectedTrip(null);
              setIsPaymentReady(false);
            }
          }}
          amount={parseFloat(depositAmount) || 0}
          description={selectedTrip ? `Savings for ${selectedTrip.destination}` : 'Add funds to savings'}
          goalName={selectedTrip?.destination}
          tripId={selectedTripId || undefined}
          paymentType="savings_deposit"
          onInitiated={handlePaymentInitiated}
          onCancel={() => {
            setDepositAmount("");
          }}
        />

        {/* Withdraw Funds Dialog */}
        <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
          <DialogContent className="dark:bg-card dark:border-border">
            <DialogHeader>
              <DialogTitle>{t('transactions.withdrawal')}</DialogTitle>
              <DialogDescription>
                {selectedTrip?.goal_type === "locked"
                  ? t('travelGoals.congratulations')
                  : t('travelGoals.withdrawDesc')}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="bg-muted p-3 rounded-lg mb-4 dark:bg-muted/50">
                <p className="text-sm">
                  {t('travelGoals.availableBalance')}:{" "}
                  <span className="font-bold">
                    {formatPrice(selectedTrip?.saved_amount || 0)}
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="withdraw_amount">{t('transactions.amount')}</Label>
                <Input
                  id="withdraw_amount"
                  type="number"
                  placeholder="100"
                  max={selectedTrip?.saved_amount || 0}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="dark:bg-background dark:border-input"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsWithdrawDialogOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="hero"
                onClick={handleWithdraw}
                disabled={
                  createTransaction.isPending ||
                  !withdrawAmount ||
                  parseFloat(withdrawAmount) > (selectedTrip?.saved_amount || 0)
                }
              >
                {createTransaction.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('transactions.withdrawal')
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!tripToDelete}
          onOpenChange={() => setTripToDelete(null)}
        >
          <AlertDialogContent className="dark:bg-card dark:border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>{t('travelGoals.deleteGoal')}?</AlertDialogTitle>
              <AlertDialogDescription>
                {t('travelGoals.deleteDesc')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTrip}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteTrip.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('common.delete')
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div >
    </div >
  );
};

export default TravelGoals;