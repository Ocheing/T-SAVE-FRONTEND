import { DollarSign, TrendingUp, Target, Calendar, MessageCircle, Plus, Receipt, Plane, CalendarDays, Compass, ArrowRight, Star, Palmtree, Mountain, Building2, Compass as AdventureIcon, Theater, Music, Loader2, MapPin } from "lucide-react";
import StatCard from "@/components/StatCard";
import TripCard from "@/components/TripCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import heroBeach from "@/assets/hero-beach.jpg";
import mountainAdventure from "@/assets/mountain-adventure.jpg";
import savingsTravel from "@/assets/savings-travel.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { useTrips, useTripStats } from "@/hooks/useTrips";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTransactionStats } from "@/hooks/useTransactions";
import { useDestinations } from "@/hooks/useDestinations";
import { useRecommendedEvents } from "@/hooks/useEvents";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

// ALL_DESTINATIONS removed - now fetched from Supabase via useDestinations hook

const Dashboard = () => {
  const { profile } = useAuth();
  const { formatPrice, formatPriceFromKES } = useCurrency();
  const { data: allTrips } = useTrips();
  const { data: tripStats } = useTripStats();
  const { data: transactionStats } = useTransactionStats();
  const { data: destinations, isLoading: isLoadingDestinations } = useDestinations();
  const { t } = useTranslation();

  const userName = profile?.full_name?.split(' ')[0] || 'Traveler';
  const hasPreferences = profile?.travel_preferences && profile.travel_preferences.length > 0;

  // Active Trips for "Your Travel Goals"
  const activeTrips = allTrips?.filter(t => t.status === 'active').slice(0, 2) || [];

  // Completed Trips for "Recent Bookings"
  const recentBookings = allTrips?.filter(t => t.status === 'completed').slice(0, 2).map(t => ({
    destination: t.destination,
    date: t.updated_at ? format(new Date(t.updated_at), "MMM d, yyyy") : format(new Date(), "MMM d, yyyy"),
    status: t.status === 'completed' ? 'Completed' : 'Active'
  })) || [];

  // Recommended Events Logic (Personalized)
  const { data: recommendedEvents, isLoading: isLoadingEvents } = useRecommendedEvents();

  // Filter featured destinations
  const featuredDestinations = (() => {
    if (!destinations) return [];
    const prefs = profile?.travel_preferences || [];
    if (prefs.length === 0) return destinations.slice(0, 3);

    return [...destinations]
      .map(dest => ({
        ...dest,
        matchCount: (dest.categories || []).filter(c => prefs.includes(c)).length
      }))
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 3);
  })();

  const nextTripInfo = (() => {
    if (!activeTrips.length) return "No trips";
    const sorted = [...activeTrips].sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime());
    return formatDistanceToNow(new Date(sorted[0].target_date), { addSuffix: false });
  })();

  const quickActions = [
    { icon: Plus, label: t('dashboard.addSavingsGoal'), link: "/travel-goals" },
    { icon: Plane, label: t('dashboard.bookTrip'), link: "/trips" },
    { icon: Receipt, label: t('dashboard.viewTransactions'), link: "/transactions" }
  ];

  return (
    <div className="min-h-screen py-6 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6 animate-fade-in flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">{t('dashboard.welcome')}, {userName}! <Plane className="h-6 w-6 text-primary" /></h1>
            <p className="text-xs text-muted-foreground">{t('travelGoals.subtitle')}</p>
          </div>
          <Link to="/chat">
            <Button size="icon" variant="outline" className="h-9 w-9">
              <MessageCircle className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Quiz Recommendation Card */}
        {!hasPreferences && (
          <Card className="p-4 mb-6 bg-primary/10 border-primary/20 animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Compass className="h-24 w-24 text-primary" />
            </div>
            <div className="flex items-start gap-4 relative z-10">
              <div className="p-2 bg-background rounded-full shadow-sm">
                <Compass className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold mb-1">{t('dashboard.designHolidays')}, {userName}!</h3>
                <p className="text-xs text-muted-foreground mb-3 max-w-md">
                  {t('dashboard.quizDescription')}
                </p>
                <Link to="/quiz">
                  <Button variant="hero" size="sm">
                    {t('dashboard.takeQuiz')}
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-3 mb-6 animate-scale-in">
          <StatCard
            title={t('dashboard.totalSavings')}
            value={formatPrice(tripStats?.totalSaved || 0)}
            icon={DollarSign}
            trend={transactionStats?.percentChange ? `${transactionStats.percentChange > 0 ? '+' : ''}${transactionStats.percentChange}% this month` : undefined}
            trendUp={transactionStats?.percentChange ? transactionStats.percentChange > 0 : undefined}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <StatCard
            title={t('dashboard.monthlyAverage')}
            value={formatPrice(transactionStats?.thisMonthSavings || 0)}
            icon={TrendingUp}
            trend={transactionStats?.lastMonthSavings ? `vs ${formatPrice(transactionStats.lastMonthSavings)}` : "Keep saving!"}
            trendUp={true}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <StatCard
            title={t('dashboard.activeGoals')}
            value={String(tripStats?.activeGoals || 0)}
            icon={Target}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
          <StatCard
            title={t('dashboard.nextTrip')}
            value={nextTripInfo}
            icon={Calendar}
            iconColor="text-amber-600"
            iconBgColor="bg-amber-100"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Main Column */}
          <div className="md:col-span-2 space-y-8">

            {/* Eye-Catching Travel Goals Section */}
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 p-5 shadow-sm relative overflow-hidden group">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

              <div className="flex justify-between items-center mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Star className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold">Your Travel Goals</h2>
                </div>
                <Link to="/travel-goals">
                  <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary hover:bg-primary/10 transition-colors">
                    View All →
                  </Button>
                </Link>
              </div>

              <div className="space-y-4 relative z-10">
                {activeTrips.length > 0 ? (
                  activeTrips.map((trip, index) => (
                    <div key={trip.id} className="transform transition-all duration-300 hover:scale-[1.01]">
                      <TripCard
                        id={trip.id}
                        destination={trip.destination}
                        targetAmount={trip.target_amount}
                        savedAmount={trip.saved_amount}
                        targetDate={format(new Date(trip.target_date), 'MMM yyyy')}
                        image={trip.image_url || (trip.category === 'beach' ? heroBeach : trip.category === 'mountain' ? mountainAdventure : savingsTravel)}
                        status={trip.status}
                      />
                    </div>
                  ))
                ) : (
                  <Card className="p-8 text-center text-muted-foreground text-sm border-dashed bg-background/50 backdrop-blur-sm">
                    <p className="mb-2">{t('dashboard.noGoalsYet')}</p>
                    <Link to="/travel-goals">
                      <Button variant="default" size="sm">{t('dashboard.createFirstGoal')}</Button>
                    </Link>
                  </Card>
                )}
              </div>
            </div>

            {/* Featured Destinations */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold">{t('dashboard.featuredDestinations')}</h2>
                <Link to="/trips">
                  <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary">
                    {t('common.viewAll')} →
                  </Button>
                </Link>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {isLoadingDestinations ? (
                  <div className="col-span-full flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  featuredDestinations.map((dest, index) => (
                    <Link key={index} to="/travel-goals" state={{ destination: dest }}>
                      <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300 border-primary/10">
                        <div className="relative h-28 overflow-hidden">
                          <img src={dest.image_url || heroBeach} alt={dest.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute bottom-2 left-3 right-3 flex justify-between items-end text-white">
                            <h3 className="font-bold text-sm truncate mr-2">{dest.name}</h3>
                            <Badge className="bg-white/90 text-primary hover:bg-white text-[10px] font-bold h-5">{formatPriceFromKES(Number(dest.estimated_cost))}</Badge>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="sidebar-container space-y-6">
            <Card className="p-4 border-primary/10 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-bold">{t('dashboard.upcomingEvents')}</h2>
                </div>
                <Badge variant="secondary" className="text-[10px] font-bold">For You</Badge>
              </div>
              <div className="space-y-4">
                {isLoadingEvents ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : (recommendedEvents || []).length > 0 ? (
                  recommendedEvents?.map((event, index) => (
                    <div key={event.id} className="group cursor-pointer">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/5 flex flex-col items-center justify-center border border-primary/10">
                          <span className="text-[10px] uppercase font-bold text-primary">{format(new Date(event.event_date), "MMM")}</span>
                          <span className="text-sm font-black text-foreground leading-none">{format(new Date(event.event_date), "d")}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <h3 className="text-xs font-bold truncate group-hover:text-primary transition-colors">{event.name}</h3>
                            {event.is_featured && <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />}
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" /> {event.location}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-primary">{formatPrice(Number(event.price))}</span>
                            {event.is_seasonal && <Badge className="h-3 text-[8px] bg-blue-50 text-blue-600 border-none hover:bg-blue-50 px-1">Seasonal</Badge>}
                            {event.is_trending && <Badge className="h-3 text-[8px] bg-orange-50 text-orange-600 border-none hover:bg-orange-50 px-1">Trending</Badge>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-[10px] text-muted-foreground">No events recommended yet.</p>
                  </div>
                )}
              </div>
              <Button variant="ghost" className="w-full mt-4 h-8 text-xs text-muted-foreground hover:text-primary transition-colors">
                Discover More Events
              </Button>
            </Card>

            <Card className="p-4">
              <h2 className="text-base font-bold mb-3">{t('dashboard.quickActions')}</h2>
              <div className="space-y-2">
                {quickActions.map((action, index) => (
                  <Link key={index} to={action.link}>
                    <Button variant="outline" className="w-full justify-start text-xs h-8" size="sm">
                      <action.icon className="h-3 w-3 mr-2 text-muted-foreground" />
                      {/* We're using action.label which is hardcoded in quickActions array. 
                          We should ideally translate that array too, but it's defined inside component. */}
                      {action.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="text-base font-bold mb-3">{t('dashboard.recentBookings')}</h2>
              <div className="space-y-2">
                {recentBookings.length > 0 ? (
                  recentBookings.map((booking, index) => (
                    <div key={index} className="pb-2 border-b last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <p className="font-semibold text-xs">{booking.destination}</p>
                        <Badge variant={booking.status === "Confirmed" ? "default" : "secondary"} className="text-[10px] h-4">
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{booking.date}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No completed bookings yet.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div >
    </div >
  );
};

export default Dashboard;