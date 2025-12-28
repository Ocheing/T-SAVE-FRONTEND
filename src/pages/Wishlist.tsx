import { Heart, Eye, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Wishlist = () => {
  const wishlistItems: any[] = []; // Empty for demo
  const recentlyViewed: any[] = []; // Empty for demo

  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* My Wishlist Section */}
        <div className="mb-12">
          <div className="mb-4 animate-fade-in">
            <h1 className="text-2xl font-bold mb-1">My Wishlist</h1>
            <p className="text-sm text-muted-foreground">Save your favorite destinations for later</p>
          </div>

          {wishlistItems.length === 0 ? (
            <Card className="p-16 text-center animate-fade-in">
              <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-bold mb-2">Nothing here yet</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Select the heart icon to save and categorize experiences you liked.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                <Link to="/trips">
                  <Button variant="hero" size="sm" className="text-xs sm:text-sm w-full sm:w-auto">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Start a New Wishlist
                  </Button>
                </Link>
                <Link to="/trips">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm w-full sm:w-auto">
                    Explore Experiences
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {/* Wishlist items would be mapped here */}
            </div>
          )}
        </div>

        {/* Recently Viewed Section */}
        <div>
          <div className="mb-4 animate-fade-in">
            <h2 className="text-2xl font-bold mb-1">Recently Viewed</h2>
            <p className="text-sm text-muted-foreground">Quick access to destinations you've checked out</p>
          </div>

          {recentlyViewed.length === 0 ? (
            <Card className="p-16 text-center animate-fade-in">
              <Eye className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-bold mb-2">No recently viewed products</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Explore Viator's activities and find your next adventure.
              </p>
              <Link to="/trips">
                <Button variant="hero" size="sm">
                  Start Exploring
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {/* Recently viewed items would be mapped here */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
