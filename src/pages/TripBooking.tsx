import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Plane, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TripBooking = () => {
  const [activeTab, setActiveTab] = useState("upcoming");

  const upcomingBookings: any[] = []; // Empty for demo
  const pastBookings: any[] = []; // Empty for demo

  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold mb-1">My Bookings</h1>
          <p className="text-sm text-muted-foreground">Manage your travel bookings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upcoming" className="text-sm">
              <Calendar className="h-4 w-4 mr-2" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="past" className="text-sm">
              <X className="h-4 w-4 mr-2" />
              Past & Cancelled
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-0">
            {upcomingBookings.length === 0 ? (
              <Card className="p-16 text-center animate-fade-in">
                <Plane className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-bold mb-2">No trips booked yet!</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Start planning your next adventure
                </p>
                <Link to="/trips">
                  <Button variant="hero" size="sm">
                    Find Things to Do
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Upcoming bookings would be mapped here */}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-0">
            {pastBookings.length === 0 ? (
              <Card className="p-16 text-center animate-fade-in">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-bold mb-2">No past bookings</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Your booking history will appear here
                </p>
                <Link to="/trips">
                  <Button variant="hero" size="sm">
                    Find Things to Do
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Past bookings would be mapped here */}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TripBooking;
