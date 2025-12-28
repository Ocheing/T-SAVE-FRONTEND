import { MapPin, DollarSign, Star, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import heroBeach from "@/assets/hero-beach.jpg";
import mountainAdventure from "@/assets/mountain-adventure.jpg";
import savingsTravel from "@/assets/savings-travel.jpg";

const PopularDestinations = () => {
  const destinations = [
    {
      id: 1,
      name: "Diani Beach",
      location: "Mombasa, Kenya",
      price: "15,000",
      rating: 4.8,
      reviews: 324,
      image: heroBeach,
      description: "Pristine white sand beaches and crystal clear waters",
      duration: "3-5 days"
    },
    {
      id: 2,
      name: "Maasai Mara",
      location: "Narok, Kenya",
      price: "45,000",
      rating: 4.9,
      reviews: 567,
      image: mountainAdventure,
      description: "World's greatest wildlife safari experience",
      duration: "4-7 days"
    },
    {
      id: 3,
      name: "Nairobi City",
      location: "Nairobi, Kenya",
      price: "8,000",
      rating: 4.6,
      reviews: 189,
      image: savingsTravel,
      description: "Modern city life meets wildlife adventures",
      duration: "2-4 days"
    },
    {
      id: 4,
      name: "Mount Kenya",
      location: "Central Kenya",
      price: "35,000",
      rating: 4.7,
      reviews: 245,
      image: mountainAdventure,
      description: "Africa's second highest peak adventure",
      duration: "5-7 days"
    },
    {
      id: 5,
      name: "Watamu Beach",
      location: "Kilifi, Kenya",
      price: "18,000",
      rating: 4.8,
      reviews: 298,
      image: heroBeach,
      description: "Tropical paradise with marine life",
      duration: "3-6 days"
    },
    {
      id: 6,
      name: "Lake Nakuru",
      location: "Nakuru, Kenya",
      price: "22,000",
      rating: 4.7,
      reviews: 412,
      image: savingsTravel,
      description: "Flamingo sanctuary and rhino reserve",
      duration: "2-3 days"
    }
  ];

  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold mb-1">Popular Destinations</h1>
          <p className="text-sm text-muted-foreground">Most loved travel destinations in Kenya</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {destinations.map((dest, index) => (
            <Card 
              key={dest.id}
              className="overflow-hidden group hover:shadow-lg transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-2 right-2">
                  <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full">
                    <Heart className="h-3 w-3" />
                  </Button>
                </div>
                <div className="absolute top-2 left-2">
                  <Badge className="bg-primary text-primary-foreground text-xs">
                    {dest.duration}
                  </Badge>
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
                    <span className="text-xs text-muted-foreground">({dest.reviews})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">From</span>
                    <span className="text-sm font-bold text-primary">KES {dest.price}</span>
                  </div>
                </div>

                <Link to={`/booking/${dest.id}`}>
                  <Button variant="hero" size="sm" className="w-full text-xs">
                    View Details
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PopularDestinations;