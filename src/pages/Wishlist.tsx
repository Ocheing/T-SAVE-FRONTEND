import { Heart, Eye, Plus, Trash2, MapPin, DollarSign, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useWishlist, useRemoveFromWishlist } from "@/hooks/useWishlist";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslation } from "react-i18next";
import heroBeach from "@/assets/hero-beach.jpg";
import mountainAdventure from "@/assets/mountain-adventure.jpg";
import savingsTravel from "@/assets/savings-travel.jpg";

const Wishlist = () => {
  const { data: wishlistItems, isLoading } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();

  const getImageForCategory = (category: string | null) => {
    switch (category) {
      case 'beach': return heroBeach;
      case 'mountain': return mountainAdventure;
      default: return savingsTravel;
    }
  };

  const handleRemove = async (id: string, destination: string) => {
    try {
      await removeFromWishlist.mutateAsync(id);
      toast({
        title: t('messages.removedFromWishlist'),
        description: `${destination} ${t('messages.removedFromWishlist').toLowerCase()}.`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('messages.somethingWentWrong');
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (isLoading && !wishlistItems) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* My Wishlist Section */}
        <div className="mb-12">
          <div className="mb-4 animate-fade-in">
            <h1 className="text-2xl font-bold mb-1">{t('wishlist.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('wishlist.subtitle')}</p>
          </div>

          {!wishlistItems || wishlistItems.length === 0 ? (
            <Card className="p-16 text-center animate-fade-in">
              <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-bold mb-2">{t('wishlist.emptyWishlist')}</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {t('wishlist.exploreDestinations')}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                <Link to="/trips">
                  <Button variant="hero" size="sm" className="text-xs sm:text-sm w-full sm:w-auto">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    {t('common.create')}
                  </Button>
                </Link>
                <Link to="/trips">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm w-full sm:w-auto">
                    {t('wishlist.exploreDestinations')}
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {wishlistItems.map((item, index) => (
                <Card
                  key={item.id}
                  className="overflow-hidden group hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={item.image_url || getImageForCategory(item.category)}
                      alt={item.destination}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-3 right-3 flex gap-2">
                      {item.category && (
                        <Badge className="bg-primary text-primary-foreground text-xs capitalize">
                          {item.category}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-3 left-3 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemove(item.id, item.destination)}
                      disabled={removeFromWishlist.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        {item.destination}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      {item.estimated_cost && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-primary" />
                          <span className="font-semibold">{formatPrice(Number(item.estimated_cost))}</span>
                        </div>
                      )}
                      {item.duration && (
                        <div className="flex items-center gap-1">
                          <span>{item.duration}</span>
                        </div>
                      )}
                    </div>

                    {item.notes && (
                      <p className="text-xs text-muted-foreground italic">"{item.notes}"</p>
                    )}

                    <Link to="/travel-goals">
                      <Button className="w-full" variant="hero" size="sm">
                        {t('wishlist.startSaving')}
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        {wishlistItems && wishlistItems.length > 0 && (
          <div className="text-center">
            <Link to="/trips">
              <Button variant="outline" size="lg">
                <Eye className="h-5 w-5 mr-2" />
                {t('wishlist.exploreDestinations')}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
