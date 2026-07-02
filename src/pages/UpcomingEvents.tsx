import { CalendarDays, MapPin, Star, Loader2, Search, SlidersHorizontal, Sparkles, Clock, Users, ArrowRight, Flame, Snowflake, ArrowUpDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/hooks/useEvents";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { format, formatDistanceToNow, isAfter } from "date-fns";

type FilterKey = "all" | "featured" | "trending" | "seasonal";
type SortKey = "date" | "price-low" | "price-high" | "name";

const UpcomingEvents = () => {
  const navigate = useNavigate();
  const { data: events, isLoading } = useEvents();
  const { formatPriceFromKES } = useCurrency();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [sortBy, setSortBy] = useState<SortKey>("date");

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    let filtered = [...events];

    // Apply category filter
    if (activeFilter === "featured") {
      filtered = filtered.filter((e) => e.is_featured);
    } else if (activeFilter === "trending") {
      filtered = filtered.filter((e) => e.is_trending);
    } else if (activeFilter === "seasonal") {
      filtered = filtered.filter((e) => e.is_seasonal);
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          (e.categories || []).some(c => c.toLowerCase().includes(q))
      );
    }

    // Apply sort
    switch (sortBy) {
      case "date":
        filtered.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
        break;
      case "price-low":
        filtered.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price-high":
        filtered.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [events, activeFilter, searchQuery, sortBy]);

  /** Gate personalized actions behind auth */
  const handleAuthAction = (action: string, event?: { name: string }) => {
    if (user) {
      if (action === "book") {
        navigate("/booking", { state: { eventName: event?.name } });
      } else if (action === "save") {
        navigate("/travel-goals", { state: { eventName: event?.name } });
      }
    } else {
      toast({
        title: "Create an account first",
        description: `Sign up to ${action === "book" ? "book this event" : "save this event to your goals"}.`,
      });
      navigate("/auth");
    }
  };

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All Events" },
    { key: "featured", label: "✨ Featured" },
    { key: "trending", label: "🔥 Trending" },
    { key: "seasonal", label: "❄️ Seasonal" },
  ];

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "date", label: "Nearest Date" },
    { key: "price-low", label: "Price: Low → High" },
    { key: "price-high", label: "Price: High → Low" },
    { key: "name", label: "Name A-Z" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="absolute top-10 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-56 h-56 bg-violet-500/5 rounded-full blur-3xl" />

        <div className="container mx-auto max-w-4xl text-center relative z-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Discover Experiences
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Upcoming <span className="text-primary">Events</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Explore festivals, concerts, adventures, and cultural experiences — find your next unforgettable moment.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search events, locations, or categories..."
              className="h-12 pl-12 pr-4 text-base rounded-full bg-card/80 border-white/10 backdrop-blur-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Filters + Sort + Grid */}
      <section className="container mx-auto px-4 pb-20">
        {/* Filter Tabs & Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in">
          <div className="flex flex-wrap items-center gap-2">
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
                {filteredEvents.length} result{filteredEvents.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1">
              {sortOptions.map(s => (
                <button
                  key={s.key}
                  onClick={() => setSortBy(s.key)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                    sortBy === s.key
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
            <CalendarDays className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? "No events match your search" : "No Upcoming Events"}
            </h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-md">
              {searchQuery
                ? "Try a different search term or clear your filters."
                : "We're working on bringing you exciting events. Check back soon!"}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => { setSearchQuery(""); setActiveFilter("all"); }}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          /* Events Grid */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, index) => {
              const eventDate = new Date(event.event_date);
              const isUpcoming = isAfter(eventDate, new Date());
              const timeUntil = isUpcoming ? formatDistanceToNow(eventDate, { addSuffix: true }) : null;

              return (
                <Card
                  key={event.id}
                  className="overflow-hidden group hover:shadow-[var(--shadow-elegant)] transition-all duration-500 hover:-translate-y-2 border-white/5 animate-fade-in"
                  style={{ animationDelay: `${index * 0.06}s` }}
                >
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden">
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt={event.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 via-violet-500/10 to-primary/5 flex items-center justify-center">
                        <CalendarDays className="h-12 w-12 text-primary/40" />
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      {event.is_featured && (
                        <Badge className="bg-primary/90 text-primary-foreground text-[10px] backdrop-blur-sm gap-1">
                          <Star className="h-2.5 w-2.5 fill-current" /> Featured
                        </Badge>
                      )}
                      {event.is_trending && (
                        <Badge className="bg-orange-500/90 text-white text-[10px] backdrop-blur-sm gap-1">
                          <Flame className="h-2.5 w-2.5" /> Trending
                        </Badge>
                      )}
                      {event.is_seasonal && (
                        <Badge className="bg-blue-500/90 text-white text-[10px] backdrop-blur-sm gap-1">
                          <Snowflake className="h-2.5 w-2.5" /> Seasonal
                        </Badge>
                      )}
                    </div>

                    {/* Date chip */}
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-center border border-white/10">
                      <div className="text-[10px] uppercase font-bold text-primary leading-none">
                        {format(eventDate, "MMM")}
                      </div>
                      <div className="text-lg font-black text-white leading-none">
                        {format(eventDate, "d")}
                      </div>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    {/* Price overlay */}
                    <div className="absolute bottom-3 right-3">
                      <span className="text-xs text-white/70">From </span>
                      <span className="text-lg font-bold text-white">
                        {formatPriceFromKES(Number(event.price))}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-lg font-bold mb-0.5 group-hover:text-primary transition-colors line-clamp-1">
                        {event.name}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.start_time || format(eventDate, "h:mm a")}
                        </span>
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center gap-3 text-xs">
                      {timeUntil && (
                        <span className="text-primary font-medium">
                          {timeUntil}
                        </span>
                      )}
                      {event.max_participants && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {event.max_participants} spots
                        </span>
                      )}
                    </div>

                    {/* Categories */}
                    {event.categories && event.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {event.categories.slice(0, 3).map((c: string) => (
                          <span
                            key={c}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-primary/8 text-primary/80 border border-primary/10"
                          >
                            {c}
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
                        onClick={() => handleAuthAction("book", event)}
                      >
                        Book Now
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleAuthAction("save", event)}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA for non-authed users */}
      {!user && (
        <section className="py-20 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto animate-fade-in">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Found an Event You Love?
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Create a free account to save events, set savings goals, and book your spot when you're ready.
              </p>
              <Button
                variant="secondary"
                size="lg"
                className="text-lg"
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

export default UpcomingEvents;
