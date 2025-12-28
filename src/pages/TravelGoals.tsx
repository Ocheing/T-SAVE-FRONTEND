import { Target, Plus, TrendingUp } from "lucide-react";
import TripCard from "@/components/TripCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import heroBeach from "@/assets/hero-beach.jpg";
import mountainAdventure from "@/assets/mountain-adventure.jpg";
import savingsTravel from "@/assets/savings-travel.jpg";

const TravelGoals = () => {
  const trips = [
    {
      destination: "Bali Paradise",
      targetAmount: 5000,
      savedAmount: 3200,
      targetDate: "Dec 2025",
      image: heroBeach
    },
    {
      destination: "Swiss Alps",
      targetAmount: 8000,
      savedAmount: 2400,
      targetDate: "Mar 2026",
      image: mountainAdventure
    },
    {
      destination: "Diani Beach Getaway",
      targetAmount: 3000,
      savedAmount: 1800,
      targetDate: "Aug 2025",
      image: savingsTravel
    },
    {
      destination: "Maasai Mara Safari",
      targetAmount: 6500,
      savedAmount: 4200,
      targetDate: "Jul 2025",
      image: mountainAdventure
    }
  ];

  const totalSaved = trips.reduce((sum, trip) => sum + trip.savedAmount, 0);
  const totalTarget = trips.reduce((sum, trip) => sum + trip.targetAmount, 0);
  const overallProgress = (totalSaved / totalTarget) * 100;

  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Target className="h-7 w-7 text-primary" />
            Your Travel Goals
          </h1>
          <p className="text-sm text-muted-foreground">Track all your savings goals in one place</p>
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

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Active Goals ({trips.length})</h2>
          <Button size="sm" variant="hero">
            <Plus className="h-4 w-4 mr-1" />
            Add New Goal
          </Button>
        </div>

        <div className="space-y-4">
          {trips.map((trip, index) => (
            <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <TripCard {...trip} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TravelGoals;