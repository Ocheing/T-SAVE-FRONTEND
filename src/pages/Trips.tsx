import { useState } from "react";
import { Search, MapPin, DollarSign, Calendar, MessageCircle, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import heroBeach from "@/assets/hero-beach.jpg";
import mountainAdventure from "@/assets/mountain-adventure.jpg";
import savingsTravel from "@/assets/savings-travel.jpg";

const Trips = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const popularDestinations = [
    {
      name: "Maldives",
      category: "Beach",
      estimatedCost: "4500",
      duration: "7 days",
      image: heroBeach,
      description: "Crystal clear waters and luxury resorts",
      popularity: "Trending"
    },
    {
      name: "Swiss Alps",
      category: "Mountain",
      estimatedCost: "6000",
      duration: "10 days",
      image: mountainAdventure,
      description: "Adventure and breathtaking mountain views",
      popularity: "Popular"
    },
    {
      name: "Tokyo",
      category: "City",
      estimatedCost: "3500",
      duration: "5 days",
      image: savingsTravel,
      description: "Modern culture meets ancient traditions",
      popularity: "Hot"
    }
  ];

  const destinations = [
    {
      name: "Santorini",
      category: "Beach",
      estimatedCost: "4000",
      duration: "6 days",
      image: heroBeach,
      description: "Stunning sunsets and white-washed villages"
    },
    {
      name: "Patagonia",
      category: "Mountain",
      estimatedCost: "5500",
      duration: "12 days",
      image: mountainAdventure,
      description: "Epic hiking and pristine wilderness"
    },
    {
      name: "Dubai",
      category: "City",
      estimatedCost: "5000",
      duration: "5 days",
      image: savingsTravel,
      description: "Luxury shopping and modern architecture"
    }
  ];

  const featuredDestinations = [
    {
      name: "Bora Bora",
      image: heroBeach,
      price: "$5,200",
      badge: "Featured"
    },
    {
      name: "Iceland",
      image: mountainAdventure,
      price: "$4,800",
      badge: "Featured"
    }
  ];

  const allDestinations = [...popularDestinations, ...destinations];
  const filteredDestinations = allDestinations.filter(dest =>
    dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dest.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4">
        <div className="mb-6 animate-fade-in flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-1">Explore Destinations</h1>
            <p className="text-sm text-muted-foreground">Find your next adventure and start saving</p>
          </div>
          <div className="flex gap-2">
            <Link to="/wishlist">
              <Button size="icon" variant="outline" className="h-10 w-10">
                <Heart className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/chat">
              <Button size="icon" variant="outline" className="h-10 w-10">
                <MessageCircle className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="mb-6 animate-scale-in">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search destinations or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12"
            />
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Featured Destinations</h2>
            <Link to="/featured-destinations">
              <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary">
                View All →
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {featuredDestinations.map((dest, index) => (
              <Card key={index} className="overflow-hidden group cursor-pointer hover:shadow-md transition-all">
                <div className="relative h-48">
                  <img src={dest.image} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-secondary text-secondary-foreground">{dest.badge}</Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                    <h3 className="text-white font-bold text-xl">{dest.name}</h3>
                    <Badge className="bg-primary text-primary-foreground text-base">{dest.price}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Popular Destinations</h2>
            <Link to="/popular-destinations">
              <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary">
                View All →
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {popularDestinations.map((destination, index) => (
              <Card 
                key={index} 
                className="overflow-hidden group hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Badge className="bg-secondary text-secondary-foreground text-xs">
                      {destination.popularity}
                    </Badge>
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      {destination.category}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {destination.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{destination.description}</p>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-primary" />
                      <span className="font-semibold">${destination.estimatedCost}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-primary" />
                      <span>{destination.duration}</span>
                    </div>
                  </div>

                  <Button className="w-full" variant="hero" size="sm">
                    Start Saving for This Trip
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">All Destinations</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {filteredDestinations.slice(3).map((destination, index) => (
              <Card 
                key={index} 
                className="overflow-hidden group hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      {destination.category}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {destination.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{destination.description}</p>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-primary" />
                      <span className="font-semibold">${destination.estimatedCost}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-primary" />
                      <span>{destination.duration}</span>
                    </div>
                  </div>

                  <Button className="w-full" variant="hero" size="sm">
                    Start Saving for This Trip
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trips;
