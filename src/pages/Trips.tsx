import { useState, useEffect } from "react";
import { Search, MapPin, DollarSign, Calendar, MessageCircle, Heart, Star, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useDestinations } from "@/hooks/useDestinations";
import heroBeach from "@/assets/hero-beach.jpg";
import { useTranslation } from "react-i18next";
import type { Destination } from "@/types/database.types";

const Trips = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const navigate = useNavigate();
  const { formatPriceFromKES } = useCurrency();
  const { t } = useTranslation();

  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  const { data: allDestinations, isLoading } = useDestinations();

  const filteredDestinations = (allDestinations || []).filter(dest =>
    dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (dest.categories || []).some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const featuredDestinations = (allDestinations || []).filter(d => d.is_featured).slice(0, 2);
  const popularDestinations = (allDestinations || []).filter(d => d.is_popular).slice(0, 3);

  const handleStartSaving = (destination: Destination) => {
    navigate('/travel-goals', { state: { destination: destination } });
  };

  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4">
        <div className="mb-6 animate-fade-in flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-1">{t('trips.browseTrips')}</h1>
            <p className="text-sm text-muted-foreground">{t('trips.exploreDesc', 'Find your next adventure and start saving')}</p>
          </div>
          <div className="flex gap-2">
            <Link to="/wishlist">
              <Button size="icon" variant="outline" className="h-10 w-10">
                <Heart className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="mb-6 animate-scale-in">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t('common.search') + "..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : searchQuery ? (
          <div className="grid md:grid-cols-3 gap-6">
            {filteredDestinations.length > 0 ? (
              filteredDestinations.map((dest, index) => (
                <DestinationCard key={index} destination={dest} onStartSaving={() => handleStartSaving(dest)} />
              ))
            ) : (
              <div className="col-span-3 text-center py-20 bg-muted/30 rounded-2xl border-2 border-dashed">
                <p className="text-muted-foreground">{t('common.noData')} "{searchQuery}"</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured Section */}
            {featuredDestinations.length > 0 && (
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">{t('trips.featured')}</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {featuredDestinations.map((dest, index) => (
                    <div
                      key={index}
                      className="relative h-56 rounded-xl overflow-hidden group cursor-pointer shadow-md"
                      onClick={() => handleStartSaving(dest)}
                    >
                      <img
                        src={dest.image_url || heroBeach}
                        alt={dest.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-primary text-white border-none shadow-lg">{t('trips.featured')}</Badge>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                        <div className="text-white">
                          <h3 className="font-bold text-2xl mb-1">{dest.name}</h3>
                          <p className="text-xs text-white/80 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {dest.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-white/60 mb-0.5">{t('trips.from')}</p>
                          <Badge className="bg-white text-primary text-lg font-black h-8">{formatPriceFromKES(Number(dest.estimated_cost))}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Popular Section */}
            {popularDestinations.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">{t('trips.popular')}</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {popularDestinations.map((dest, index) => (
                    <DestinationCard key={index} destination={dest} onStartSaving={() => handleStartSaving(dest)} />
                  ))}
                </div>
              </section>
            )}

            {/* All Section */}
            <section>
              <h2 className="text-xl font-bold mb-4">{t('trips.allDestinations')}</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {(allDestinations || []).map((dest, index) => (
                  <DestinationCard key={index} destination={dest} onStartSaving={() => handleStartSaving(dest)} />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

const DestinationCard = ({ destination, onStartSaving }: { destination: Destination, onStartSaving: () => void }) => {
  const { formatPriceFromKES } = useCurrency();
  const { t } = useTranslation();
  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-primary/10">
      <div className="relative h-44 overflow-hidden">
        <img
          src={destination.image_url || heroBeach}
          alt={destination.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 right-3">
          <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/90 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
        {destination.popularity_badge && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-primary text-white text-[10px] font-bold px-2 py-0.5">
              {destination.popularity_badge}
            </Badge>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold truncate max-w-[150px]">{destination.name}</h3>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {destination.location || 'various'}
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] font-semibold">
            {destination.categories?.[0] || 'Travel'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 h-8">
          {destination.description}
        </p>
        <div className="flex justify-between items-center pt-3 border-t">
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">{t('wishlist.estimatedCost')}</p>
            <p className="text-base font-black text-primary">{formatPriceFromKES(Number(destination.estimated_cost))}</p>
          </div>
          <Button
            variant="hero"
            size="sm"
            className="h-8 text-xs"
            onClick={onStartSaving}
          >
            {t('trips.startSaving')}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default Trips;
