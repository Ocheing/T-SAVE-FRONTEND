import { MapPin, Star, Heart, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { usePopularDestinations } from "@/hooks/useDestinations";
import { useCurrency } from "@/contexts/CurrencyContext";
import heroBeach from "@/assets/hero-beach.jpg";

const PopularDestinations = () => {
  const navigate = useNavigate();
  const { data: destinations, isLoading } = usePopularDestinations();
  const { formatPrice } = useCurrency();

  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold mb-1">Popular Destinations</h1>
          <p className="text-sm text-muted-foreground">Most loved travel destinations</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {destinations?.map((dest, index) => (
              <Card
                key={dest.id}
                className="overflow-hidden group hover:shadow-lg transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={dest.image_url || heroBeach}
                    alt={dest.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-2 right-2">
                    <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full">
                      <Heart className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="absolute top-2 left-2">
                    {dest.duration && (
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        {dest.duration}
                      </Badge>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                <div className="p-3 space-y-2">
                  <div>
                    <h3 className="text-base font-bold mb-0.5">{dest.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {dest.location}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">{dest.description}</p>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-semibold">{dest.rating}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">({dest.reviews_count} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">From</span>
                      <span className="text-sm font-bold text-primary">{formatPrice(Number(dest.estimated_cost))}</span>
                    </div>
                  </div>

                  <Button
                    variant="hero"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => navigate('/travel-goals', { state: { destination: dest } })}
                  >
                    Start Saving
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

export default PopularDestinations;