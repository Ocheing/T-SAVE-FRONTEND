import { MapPin, Calendar, TrendingUp } from "lucide-react";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";

interface TripCardProps {
  destination: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string;
  image: string;
}

const TripCard = ({ destination, targetAmount, savedAmount, targetDate, image }: TripCardProps) => {
  const progress = (savedAmount / targetAmount) * 100;

  return (
    <Card className="overflow-hidden group hover:shadow-[var(--shadow-elegant)] transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={image} 
          alt={destination}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {destination}
          </h3>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Saved</p>
            <p className="text-2xl font-bold text-primary">${savedAmount.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Goal</p>
            <p className="text-xl font-semibold">${targetAmount.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Target: {targetDate}</span>
        </div>

        <Button className="w-full" variant="hero" size="sm">
          <TrendingUp className="h-4 w-4 mr-2" />
          Add Funds
        </Button>
      </div>
    </Card>
  );
};

export default TripCard;
