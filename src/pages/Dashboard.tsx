import { DollarSign, TrendingUp, Target, Calendar, MessageCircle, Plus, Receipt, Plane, CalendarDays, Brain, ArrowRight } from "lucide-react";
import StatCard from "@/components/StatCard";
import TripCard from "@/components/TripCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import heroBeach from "@/assets/hero-beach.jpg";
import mountainAdventure from "@/assets/mountain-adventure.jpg";
import savingsTravel from "@/assets/savings-travel.jpg";

const Dashboard = () => {
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
    }
  ];

  const upcomingEvents = [
    { date: "Dec 15", event: "Bali Trip Payment Due" },
    { date: "Jan 5", event: "Swiss Alps Booking Opens" },
    { date: "Feb 20", event: "Savings Goal Review" }
  ];

  const featuredDestinations = [
    {
      name: "Santorini",
      image: heroBeach,
      price: "$4,200"
    },
    {
      name: "Tokyo",
      image: savingsTravel,
      price: "$3,800"
    }
  ];

  const recentBookings = [
    { destination: "Maldives", date: "Jan 15, 2025", status: "Confirmed" },
    { destination: "Paris", date: "Dec 20, 2024", status: "Completed" }
  ];

  const quickActions = [
    { icon: Plus, label: "Add Savings Goal", link: "/trips" },
    { icon: Plane, label: "Book a Trip", link: "/trips" },
    { icon: Receipt, label: "View Transactions", link: "/profile" }
  ];

  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4">
        <div className="mb-6 animate-fade-in flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-1">Welcome back, Millicent! ✈️</h1>
            <p className="text-xs text-muted-foreground">Track your progress and manage your savings</p>
          </div>
          <Link to="/chat">
            <Button size="icon" variant="outline" className="h-9 w-9">
              <MessageCircle className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Quiz Recommendation Card */}
        <Card className="p-4 mb-6 bg-primary/10 border-primary/20 animate-fade-in">
          <div className="flex items-start gap-3">
            <Brain className="h-10 w-10 text-primary flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-base font-bold mb-1">Design your holidays, Millicent!</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Fill out the survey to get the best recommendations from us.
              </p>
              <Button variant="hero" size="sm">
                Take a Quiz
                <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-4 gap-3 mb-6 animate-scale-in">
          <StatCard
            title="Total Saved"
            value="$5,600"
            icon={DollarSign}
            trend="+12% this month"
            trendUp={true}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <StatCard
            title="Monthly Average"
            value="$850"
            icon={TrendingUp}
            trend="+8% from last month"
            trendUp={true}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <StatCard
            title="Active Goals"
            value="2"
            icon={Target}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
          <StatCard
            title="Next Trip"
            value="8 months"
            icon={Calendar}
            iconColor="text-amber-600"
            iconBgColor="bg-amber-100"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold">Your Travel Goals</h2>
                <Link to="/travel-goals">
                  <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary">
                    View All →
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {trips.map((trip, index) => (
                  <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <TripCard {...trip} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold">Featured Destinations</h2>
                <Link to="/featured-destinations">
                  <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary">
                    View All →
                  </Button>
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {featuredDestinations.map((dest, index) => (
                  <Link key={index} to="/featured-destinations">
                    <Card className="overflow-hidden group cursor-pointer hover:shadow-md transition-all">
                      <div className="relative h-28">
                        <img src={dest.image} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                          <h3 className="text-white font-bold text-base">{dest.name}</h3>
                          <Badge className="bg-primary text-primary-foreground text-xs">{dest.price}</Badge>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="h-5 w-5 text-primary" />
                <h2 className="text-base font-bold">Upcoming Events</h2>
              </div>
              <div className="space-y-2">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0 w-12 text-center">
                      <div className="text-xs font-bold text-primary">{event.date}</div>
                    </div>
                    <div className="text-xs">{event.event}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="text-base font-bold mb-3">Quick Actions</h2>
              <div className="space-y-2">
                {quickActions.map((action, index) => (
                  <Link key={index} to={action.link}>
                    <Button variant="outline" className="w-full justify-start text-xs h-8" size="sm">
                      <action.icon className="h-3 w-3 mr-2 text-muted-foreground" />
                      {action.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="text-base font-bold mb-3">Recent Bookings</h2>
              <div className="space-y-2">
                {recentBookings.map((booking, index) => (
                  <div key={index} className="pb-2 border-b last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <p className="font-semibold text-xs">{booking.destination}</p>
                      <Badge variant={booking.status === "Confirmed" ? "default" : "secondary"} className="text-[10px] h-4">
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{booking.date}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;