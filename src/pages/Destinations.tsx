import { MapPin, Star, Heart, Loader2, ArrowRight, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { usePublishedDestinations } from "@/hooks/useDestinations";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import heroBeach from "@/assets/hero-beach.jpg";
import { useState, useMemo } from "react";

const Destinations = () => {
  const navigate = useNavigate();
  const { data: destinations, isLoading } = usePublishedDestinations();
  const { formatPriceFromKES } = useCurrency();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "featured" | "popular">("all");

  const filteredDestinations = useMemo(() => {
    if (!destinations) return [];
    let filtered = destinations;

    // Apply category filter
    if (activeFilter === "featured") {
      filtered = filtered.filter((d) => d.is_featured);
    } else if (activeFilter === "popular") {
      filtered = filtered.filter((d) => d.is_popular);
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.location?.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [destinations, activeFilter, searchQuery]);

  /** Gate personalized actions behind auth */
  const handleAuthAction = (action: string, dest?: { name: string }) => {
    if (user) {
      if (action === "save") {
        navigate("/wishlist");
      } else if (action === "plan") {
        navigate("/travel-goals", { state: { destination: dest } });
      }
    } else {
      toast({
        title: "Create an account first",
        description: `Sign up to ${action === "save" ? "save trips to your wishlist" : "start planning your trip"}.`,
      });
      navigate("/auth");
    }
  };

  const filters = [
    { key: "all" as const, label: "All Destinations" },
    { key: "featured" as const, label: "Featured" },
    { key: "popular" as const, label: "Most Popular" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative py-12 md:py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="absolute top-10 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

        <div className="container mx-auto max-w-4xl text-center relative z-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
            <Sparkles className="h-3 w-3" />
            Explore Before You Sign Up
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            Discover Your Next <span className="text-primary">Adventure</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Browse stunning destinations, compare budgets, and find your dream trip — no account needed to explore.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search destinations, cities, or countries..."
              className="h-10 pl-10 pr-4 text-sm rounded-full bg-card/80 border-white/10 backdrop-blur-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="container mx-auto px-4 pb-16">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-8 animate-fade-in">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground mr-1" />
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeFilter === f.key
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground border border-white/5"
              }`}
            >
              {f.label}
            </button>
          ))}
          {searchQuery && (
            <span className="text-xs text-muted-foreground ml-2">
              {filteredDestinations.length} result{filteredDestinations.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : filteredDestinations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
            <MapPin className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? "No destinations match your search" : "No Destinations Available Yet"}
            </h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-md">
              {searchQuery
                ? "Try a different search term or clear your filters."
                : "We're curating amazing destinations for you. Check back soon!"}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => { setSearchQuery(""); setActiveFilter("all"); }}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          /* Destination Grid */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDestinations.map((dest, index) => (
              <Card
                key={dest.id}
                className="overflow-hidden group hover:shadow-[var(--shadow-elegant)] transition-all duration-500 hover:-translate-y-2 border-white/5 animate-fade-in"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={dest.image_url || heroBeach}
                    alt={dest.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                  />
                  {/* Save Button */}
                  <button
                    onClick={() => handleAuthAction("save", dest)}
                    className="absolute top-3 right-3 h-9 w-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/80 hover:text-red-400 hover:bg-black/60 transition-all duration-300"
                    aria-label="Save trip"
                  >
                    <Heart className="h-4 w-4" />
                  </button>
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {dest.is_featured && (
                      <Badge className="bg-primary/90 text-primary-foreground text-[10px] backdrop-blur-sm">
                        ✨ Featured
                      </Badge>
                    )}
                    {dest.duration && (
                      <Badge className="bg-black/50 text-white text-[10px] backdrop-blur-sm border-white/10">
                        {dest.duration}
                      </Badge>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  {/* Price overlay */}
                  <div className="absolute bottom-3 right-3">
                    <span className="text-xs text-white/70">From </span>
                    <span className="text-base font-bold text-white">
                      {formatPriceFromKES(Number(dest.estimated_cost))}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <div>
                    <h3 className="text-base font-bold mb-0.5 group-hover:text-primary transition-colors">
                      {dest.name}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {dest.location}
                    </p>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {dest.description}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold">{dest.rating}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ({dest.reviews_count} reviews)
                    </span>
                  </div>

                  {/* Categories */}
                  {dest.categories && dest.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {dest.categories.slice(0, 3).map((h: string) => (
                        <span
                          key={h}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-primary/8 text-primary/80 border border-primary/10"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="hero"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => handleAuthAction("plan", dest)}
                    >
                      Start Planning
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleAuthAction("save", dest)}
                    >
                      <Heart className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* CTA for non-authed users */}
      {!user && (
        <section className="py-12 md:py-16 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto animate-fade-in">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Found Your Dream Destination?
              </h2>
              <p className="text-lg text-white/90 mb-6">
                Create a free account to start saving, track your progress, and book your trip when you're ready.
              </p>
              <Button
                variant="secondary"
                size="default"
                className="text-base"
                onClick={() => navigate("/auth")}
              >
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Destinations;
