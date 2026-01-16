import { useState } from "react";
import { Target, Plus, TrendingUp, Loader2, Trash2, DollarSign, Lock, Unlock, Music, ArrowDownCircle, Star, Receipt, Palmtree, Mountain, Building2, Compass, Theater, Mic, Tent, Trophy, ClipboardList, Pin, Plane } from "lucide-react";
import TripCard from "@/components/TripCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useTrips, useCreateTrip, useDeleteTrip, useTripStats } from "@/hooks/useTrips";
import { useCreateTransaction } from "@/hooks/useTransactions";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

import { Link } from "react-router-dom";
import { useCurrency } from "@/contexts/CurrencyContext";
import heroBeach from "@/assets/hero-beach.jpg";
import mountainAdventure from "@/assets/mountain-adventure.jpg";
import savingsTravel from "@/assets/savings-travel.jpg";

const TravelGoals = () => {
  const { data: trips, isLoading } = useTrips();
  const { data: tripStats } = useTripStats();
  const createTrip = useCreateTrip();
  const deleteTrip = useDeleteTrip();
  const createTransaction = useCreateTransaction();

  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddFundsDialogOpen, setIsAddFundsDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [activeTab, setActiveTab] = useState("trips");

  const [newTrip, setNewTrip] = useState({
    destination: "",
    description: "",
    category: "beach" as const,
    goal_type: "flexible" as "flexible" | "locked",
    event_type: null as string | null,
    target_amount: "",
    target_date: "",
  });

  const getImageForCategory = (category: string | null) => {
    switch (category) {
      case 'beach': return heroBeach;
      case 'mountain': return mountainAdventure;
      case 'event': return savingsTravel;
      default: return savingsTravel;
    }
  };

  const handleCreateTrip = async () => {
    if (!newTrip.destination || !newTrip.target_amount || !newTrip.target_date) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createTrip.mutateAsync({
        destination: newTrip.destination,
        description: newTrip.description || null,
        category: newTrip.category,
        goal_type: newTrip.goal_type,
        event_type: newTrip.category === 'event' ? newTrip.event_type : null,
        target_amount: parseFloat(newTrip.target_amount),
        target_date: newTrip.target_date,
      });

      toast({
        title: "Goal created!",
        description: `Your ${newTrip.goal_type === 'locked' ? 'locked' : 'flexible'} savings goal for ${newTrip.destination} has been created.`,
      });

      setNewTrip({
        destination: "",
        description: "",
        category: "beach",
        goal_type: "flexible",
        event_type: null,
        target_amount: "",
        target_date: "",
      });
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create goal. Please try again.",
        variant: "destructive",
      });
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete goal.",
        variant: "destructive",
      });
    } finally {
      setTripToDelete(null);
    }
  };

  const handleAddFunds = async () => {
    if (!selectedTripId || !depositAmount) return;

    try {
      await createTransaction.mutateAsync({
        trip_id: selectedTripId,
        type: 'deposit',
        amount: parseFloat(depositAmount),
        description: 'Savings deposit',
      });

      toast({
        title: "Funds added!",
        description: `${formatPrice(parseFloat(depositAmount))} has been added to your savings.`,
      });

      setDepositAmount("");
      setIsAddFundsDialogOpen(false);
      setSelectedTripId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add funds.",
        variant: "destructive",
      });
    }
  };

  const handleWithdraw = async () => {
    if (!selectedTripId || !withdrawAmount || !selectedTrip) return;

    const amount = parseFloat(withdrawAmount);

    // Check if it's a locked goal
    if (selectedTrip.goal_type === 'locked' && selectedTrip.saved_amount < selectedTrip.target_amount) {
      toast({
        title: "Cannot withdraw",
        description: "This is a locked goal. You can only withdraw once you've reached your target amount.",
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
        type: 'withdrawal',
        amount: amount,
        description: 'Withdrawal from savings',
      });

      toast({
        title: "Withdrawal successful!",
        description: `$${withdrawAmount} has been withdrawn from your savings.`,
      });

      setWithdrawAmount("");
      setIsWithdrawDialogOpen(false);
      setSelectedTripId(null);
      setSelectedTrip(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to withdraw funds.",
        variant: "destructive",
      });
    }
  };

  const openWithdrawDialog = (trip: any) => {
    setSelectedTripId(trip.id);
    setSelectedTrip(trip);
    setIsWithdrawDialogOpen(true);
  };

  const totalSaved = tripStats?.totalSaved || 0;
  const totalTarget = tripStats?.totalTarget || 0;
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const activeTrips = trips?.filter(t => t.status === 'active' && t.category !== 'event') || [];
  const eventTrips = trips?.filter(t => t.status === 'active' && t.category === 'event') || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-6 animate-fade-in flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Target className="h-7 w-7 text-primary" />
              Your Savings Goals
            </h1>
            <p className="text-sm text-muted-foreground">Track travel and event savings in one place</p>
          </div>
          <Link to="/transactions">
            <Button variant="outline" size="sm">
              <Receipt className="h-4 w-4 mr-2" />
              View Transactions
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8 animate-scale-in">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Saved</div>
            <div className="text-xl font-bold text-primary">${totalSaved.toLocaleString()}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Target</div>
            <div className="text-xl font-bold">${totalTarget.toLocaleString()}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Overall Progress
            </div>
            <div className="text-xl font-bold text-primary">{overallProgress.toFixed(1)}%</div>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="trips" className="text-sm">
                <Plane className="h-4 w-4 mr-2" /> Travel Goals ({activeTrips.length})
              </TabsTrigger>
              <TabsTrigger value="events" className="text-sm">
                <Music className="h-4 w-4 mr-2" /> Live Events ({eventTrips.length})
              </TabsTrigger>
            </TabsList>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="hero">
                  <Plus className="h-4 w-4 mr-1" />
                  Add New Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Savings Goal</DialogTitle>
                  <DialogDescription>
                    Save for trips, concerts, festivals, and more!
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Goal Type *</Label>
                    <RadioGroup
                      value={newTrip.goal_type}
                      onValueChange={(value: "flexible" | "locked") => setNewTrip({ ...newTrip, goal_type: value })}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="flexible" id="flexible" />
                        <Label htmlFor="flexible" className="flex items-center gap-1 cursor-pointer">
                          <Unlock className="h-4 w-4 text-green-600" />
                          <span>Flexible</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="locked" id="locked" />
                        <Label htmlFor="locked" className="flex items-center gap-1 cursor-pointer">
                          <Lock className="h-4 w-4 text-orange-600" />
                          <span>Locked</span>
                        </Label>
                      </div>
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground">
                      {newTrip.goal_type === 'flexible'
                        ? '💡 Withdraw anytime - perfect for flexible travel plans'
                        : '🔒 Funds locked until you reach your goal - helps you stay committed!'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="destination">
                      {newTrip.category === 'event' ? 'Event Name *' : 'Destination *'}
                    </Label>
                    <Input
                      id="destination"
                      placeholder={newTrip.category === 'event' ? "e.g., Coldplay Concert, Nyege Nyege" : "e.g., Bali, Swiss Alps, Tokyo"}
                      value={newTrip.destination}
                      onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Brief description"
                      value={newTrip.description}
                      onChange={(e) => setNewTrip({ ...newTrip, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newTrip.category}
                        onValueChange={(value: any) => setNewTrip({ ...newTrip, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beach">
                            <div className="flex items-center gap-2">
                              <Palmtree className="h-4 w-4 text-sky-500" /> Beach
                            </div>
                          </SelectItem>
                          <SelectItem value="mountain">
                            <div className="flex items-center gap-2">
                              <Mountain className="h-4 w-4 text-amber-700" /> Mountain
                            </div>
                          </SelectItem>
                          <SelectItem value="city">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-indigo-500" /> City
                            </div>
                          </SelectItem>
                          <SelectItem value="adventure">
                            <div className="flex items-center gap-2">
                              <Compass className="h-4 w-4 text-emerald-500" /> Adventure
                            </div>
                          </SelectItem>
                          <SelectItem value="cultural">
                            <div className="flex items-center gap-2">
                              <Theater className="h-4 w-4 text-rose-500" /> Cultural
                            </div>
                          </SelectItem>
                          <SelectItem value="event">
                            <div className="flex items-center gap-2">
                              <Music className="h-4 w-4 text-fuchsia-500" /> Live Event
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {newTrip.category === 'event' && (
                      <div className="space-y-2">
                        <Label htmlFor="event_type">Event Type</Label>
                        <Select
                          value={newTrip.event_type || ''}
                          onValueChange={(value) => setNewTrip({ ...newTrip, event_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="concert">
                              <div className="flex items-center gap-2">
                                <Mic className="h-4 w-4" /> Concert
                              </div>
                            </SelectItem>
                            <SelectItem value="festival">
                              <div className="flex items-center gap-2">
                                <Tent className="h-4 w-4" /> Festival
                              </div>
                            </SelectItem>
                            <SelectItem value="sports">
                              <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4" /> Sports Event
                              </div>
                            </SelectItem>
                            <SelectItem value="conference">
                              <div className="flex items-center gap-2">
                                <ClipboardList className="h-4 w-4" /> Conference
                              </div>
                            </SelectItem>
                            <SelectItem value="other">
                              <div className="flex items-center gap-2">
                                <Pin className="h-4 w-4" /> Other
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {newTrip.category !== 'event' && (
                      <div className="space-y-2">
                        <Label htmlFor="target_amount">Target Amount ($) *</Label>
                        <Input
                          id="target_amount"
                          type="number"
                          placeholder="5000"
                          value={newTrip.target_amount}
                          onChange={(e) => setNewTrip({ ...newTrip, target_amount: e.target.value })}
                        />
                      </div>
                    )}
                  </div>

                  {newTrip.category === 'event' && (
                    <div className="space-y-2">
                      <Label htmlFor="target_amount">Target Amount *</Label>
                      <Input
                        id="target_amount"
                        type="number"
                        placeholder="500"
                        value={newTrip.target_amount}
                        onChange={(e) => setNewTrip({ ...newTrip, target_amount: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="target_date">Target Date *</Label>
                    <Input
                      id="target_date"
                      type="date"
                      value={newTrip.target_date}
                      onChange={(e) => setNewTrip({ ...newTrip, target_date: e.target.value })}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="hero"
                    onClick={handleCreateTrip}
                    disabled={createTrip.isPending}
                  >
                    {createTrip.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Goal'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="trips">
            {activeTrips.length === 0 ? (
              <Card className="p-12 text-center">
                <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">No travel goals yet</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Start by exploring destinations and creating your first savings goal!
                </p>
                <Link to="/trips">
                  <Button variant="hero">
                    <Plus className="h-4 w-4 mr-2" />
                    Explore Destinations
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeTrips.map((trip, index) => (
                  <div key={trip.id} className="animate-fade-in relative group" style={{ animationDelay: `${index * 0.1}s` }}>
                    <Card className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-48 h-32 md:h-auto relative">
                          <img
                            src={trip.image_url || getImageForCategory(trip.category)}
                            alt={trip.destination}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 flex gap-1">
                            {trip.goal_type === 'locked' ? (
                              <Badge className="bg-orange-500 text-white text-xs">
                                <Lock className="h-3 w-3 mr-1" />
                                Locked
                              </Badge>
                            ) : (
                              <Badge className="bg-green-500 text-white text-xs">
                                <Unlock className="h-3 w-3 mr-1" />
                                Flexible
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-bold text-lg">{trip.destination}</h3>
                              <p className="text-xs text-muted-foreground">
                                Target: {format(new Date(trip.target_date), 'MMM dd, yyyy')}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Star className="h-3 w-3" />
                              0 reviews
                            </div>
                          </div>

                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>{formatPrice(trip.saved_amount)} saved</span>
                              <span className="text-muted-foreground">of {formatPrice(trip.target_amount)}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${Math.min((trip.saved_amount / trip.target_amount) * 100, 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {((trip.saved_amount / trip.target_amount) * 100).toFixed(1)}% complete
                            </p>
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setSelectedTripId(trip.id);
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
                              disabled={trip.goal_type === 'locked' && trip.saved_amount < trip.target_amount}
                            >
                              <ArrowDownCircle className="h-4 w-4 mr-1" />
                              Withdraw
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setTripToDelete(trip.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {trip.goal_type === 'locked' && trip.saved_amount < trip.target_amount && (
                            <p className="text-xs text-orange-600 mt-2">
                              🔒 Withdrawal locked until you reach {formatPrice(trip.target_amount)}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="events">
            {eventTrips.length === 0 ? (
              <Card className="p-12 text-center">
                <Music className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">No event savings yet</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Save for concerts, festivals, sports events, and more!
                </p>
                <Button variant="hero" onClick={() => {
                  setNewTrip({ ...newTrip, category: 'event' });
                  setIsCreateDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Save for an Event
                </Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {eventTrips.map((trip, index) => (
                  <Card key={trip.id} className="overflow-hidden animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <Badge className="mb-2 text-xs gap-1">
                            {trip.event_type === 'concert' && <><Mic className="h-3 w-3" /> Concert</>}
                            {trip.event_type === 'festival' && <><Tent className="h-3 w-3" /> Festival</>}
                            {trip.event_type === 'sports' && <><Trophy className="h-3 w-3" /> Sports</>}
                            {trip.event_type === 'conference' && <><ClipboardList className="h-3 w-3" /> Conference</>}
                            {trip.event_type === 'other' && <><Pin className="h-3 w-3" /> Event</>}
                            {!trip.event_type && <><Music className="h-3 w-3" /> Event</>}
                          </Badge>
                          <h3 className="font-bold text-lg">{trip.destination}</h3>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(trip.target_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        {trip.goal_type === 'locked' ? (
                          <Lock className="h-4 w-4 text-orange-500" />
                        ) : (
                          <Unlock className="h-4 w-4 text-green-500" />
                        )}
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-semibold">${trip.saved_amount.toLocaleString()}</span>
                          <span className="text-muted-foreground">/ ${trip.target_amount.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${Math.min((trip.saved_amount / trip.target_amount) * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedTripId(trip.id);
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
                          disabled={trip.goal_type === 'locked' && trip.saved_amount < trip.target_amount}
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

        {/* Add Funds Dialog */}
        <Dialog open={isAddFundsDialogOpen} onOpenChange={setIsAddFundsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Funds to Savings</DialogTitle>
              <DialogDescription>
                Enter the amount you want to add to this savings goal.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="100"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddFundsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="hero"
                onClick={handleAddFunds}
                disabled={createTransaction.isPending || !depositAmount}
              >
                {createTransaction.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Funds'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Withdraw Funds Dialog */}
        <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Withdraw Funds</DialogTitle>
              <DialogDescription>
                {selectedTrip?.goal_type === 'locked'
                  ? 'Congratulations on reaching your goal! You can now withdraw your funds.'
                  : 'Enter the amount you want to withdraw from this savings goal.'}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="bg-muted p-3 rounded-lg mb-4">
                <p className="text-sm">Available balance: <span className="font-bold">${selectedTrip?.saved_amount?.toLocaleString() || 0}</span></p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="withdraw_amount">Withdraw Amount ($)</Label>
                <Input
                  id="withdraw_amount"
                  type="number"
                  placeholder="100"
                  max={selectedTrip?.saved_amount || 0}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsWithdrawDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="hero"
                onClick={handleWithdraw}
                disabled={createTransaction.isPending || !withdrawAmount || parseFloat(withdrawAmount) > (selectedTrip?.saved_amount || 0)}
              >
                {createTransaction.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Withdraw'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!tripToDelete} onOpenChange={() => setTripToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Savings Goal?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your savings goal and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTrip}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteTrip.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div >
  );
};

export default TravelGoals;