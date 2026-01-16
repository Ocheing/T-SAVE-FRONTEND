import { MapPin, Star, Heart, Award, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useFeaturedDestinations } from "@/hooks/useDestinations";
import { useCurrency } from "@/contexts/CurrencyContext";
import heroBeach from "@/assets/hero-beach.jpg";

const FeaturedDestinations = () => {
  const navigate = useNavigate();
  const { data: destinations, isLoading } = useFeaturedDestinations();
  const { formatPrice } = useCurrency();

  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4">
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <Award className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Featured Destinations</h1>
          </div>
          <p className="text-sm text-muted-foreground">Handpicked premium experiences for you</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {destinations?.map((dest, index) => (
              <Card
                key={dest.id}
                className="overflow-hidden group hover:shadow-xl transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={dest.image_url || heroBeach}
                    alt={dest.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-secondary text-secondary-foreground text-xs">
                      <Award className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                    {dest.duration && (
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        {dest.duration}
                      </Badge>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-lg font-bold mb-1">{dest.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {dest.location}
                    </p>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">{dest.description}</p>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold">{dest.rating}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">({dest.reviews_count} reviews)</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Starting from</div>
                      <div className="text-lg font-bold text-primary">{formatPrice(Number(dest.estimated_cost))}</div>
                    </div>
                  </div>

                  <Button
                    variant="hero"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate('/travel-goals', { state: { destination: dest } })}
                  >
                    Start Saving for This Trip
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedDestinations;