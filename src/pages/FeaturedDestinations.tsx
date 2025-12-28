import { MapPin, DollarSign, Star, Heart, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import heroBeach from "@/assets/hero-beach.jpg";
import mountainAdventure from "@/assets/mountain-adventure.jpg";
import savingsTravel from "@/assets/savings-travel.jpg";

const FeaturedDestinations = () => {
  const destinations = [
    {
      id: 1,
      name: "Amboseli National Park",
      location: "Kajiado, Kenya",
      price: "38,000",
      rating: 4.9,
      reviews: 456,
      image: mountainAdventure,
      description: "Spectacular views of Mount Kilimanjaro with elephant herds",
      duration: "3-5 days",
      featured: true
    },
    {
      id: 2,
      name: "Lamu Island",
      location: "Lamu, Kenya",
      price: "28,000",
      rating: 4.8,
      reviews: 387,
      image: heroBeach,
      description: "UNESCO World Heritage Site with rich Swahili culture",
      duration: "4-6 days",
      featured: true
    },
    {
      id: 3,
      name: "Hell's Gate",
      location: "Naivasha, Kenya",
      price: "12,000",
      rating: 4.7,
      reviews: 298,
      image: savingsTravel,
      description: "Unique walking and cycling safari experience",
      duration: "1-2 days",
      featured: true
    },
    {
      id: 4,
      name: "Tsavo National Park",
      location: "Coast/Eastern, Kenya",
      price: "42,000",
      rating: 4.8,
      reviews: 523,
      image: mountainAdventure,
      description: "Kenya's largest national park with red elephants",
      duration: "4-7 days",
      featured: true
    }
  ];

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

        <div className="grid md:grid-cols-2 gap-6">
          {destinations.map((dest, index) => (
            <Card 
              key={dest.id}
              className="overflow-hidden group hover:shadow-xl transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={dest.image}
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
                  <Badge className="bg-primary text-primary-foreground text-xs">
                    {dest.duration}
                  </Badge>
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

                <p className="text-sm text-muted-foreground">{dest.description}</p>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold">{dest.rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">({dest.reviews} reviews)</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Starting from</div>
                    <div className="text-lg font-bold text-primary">KES {dest.price}</div>
                  </div>
                </div>

                <Link to={`/booking/${dest.id}`}>
                  <Button variant="hero" size="sm" className="w-full">
                    Explore Package
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

export default FeaturedDestinations;