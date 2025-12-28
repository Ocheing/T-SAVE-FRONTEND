import { User, Mail, Phone, MapPin, Settings, LogOut, CreditCard, Globe, Bell, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const Profile = () => {
  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-3xl font-bold mb-1">Your Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <div className="space-y-4">
          <Card className="p-6 animate-scale-in">
            <div className="flex items-start gap-4 mb-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">JD</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">John Doe</h2>
                <p className="text-sm text-muted-foreground mb-3">Member since January 2025</p>
                <Button variant="outline" size="sm">Change Avatar</Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="flex items-center gap-2 text-xs">
                    <User className="h-3 w-3 text-primary" />
                    First Name
                  </Label>
                  <Input id="firstName" defaultValue="John" className="h-9" />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="lastName" className="flex items-center gap-2 text-xs">
                    <User className="h-3 w-3 text-primary" />
                    Last Name
                  </Label>
                  <Input id="lastName" defaultValue="Doe" className="h-9" />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="flex items-center gap-2 text-xs">
                  <Mail className="h-3 w-3 text-primary" />
                  Email Address
                </Label>
                <Input id="email" type="email" defaultValue="john.doe@example.com" className="h-9" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone" className="flex items-center gap-2 text-xs">
                  <Phone className="h-3 w-3 text-primary" />
                  Phone Number
                </Label>
                <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" className="h-9" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="location" className="flex items-center gap-2 text-xs">
                  <MapPin className="h-3 w-3 text-primary" />
                  Location
                </Label>
                <Input id="location" defaultValue="New York, USA" className="h-9" />
              </div>

              <div className="pt-2">
                <Button variant="hero" size="sm">
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Preferences</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="language" className="text-xs">Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger id="language" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="currency" className="text-xs flex items-center gap-2">
                  <DollarSign className="h-3 w-3 text-primary" />
                  Currency
                </Label>
                <Select defaultValue="usd">
                  <SelectTrigger id="currency" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="eur">EUR (€)</SelectItem>
                    <SelectItem value="gbp">GBP (£)</SelectItem>
                    <SelectItem value="jpy">JPY (¥)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-6 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-3 mb-4">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Notifications</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="font-semibold text-sm">Email Notifications</h3>
                  <p className="text-xs text-muted-foreground">Receive updates about your savings</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="font-semibold text-sm">Trip Reminders</h3>
                  <p className="text-xs text-muted-foreground">Get notified about upcoming trips</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="font-semibold text-sm">Savings Milestones</h3>
                  <p className="text-xs text-muted-foreground">Celebrate your savings achievements</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>

          <Card className="p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-4">
              <Settings className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Account Settings</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Payment Methods
                  </h3>
                  <p className="text-xs text-muted-foreground">Manage your payment options</p>
                </div>
                <Button variant="outline" size="sm">Manage</Button>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <h3 className="font-semibold text-sm">Change Password</h3>
                  <p className="text-xs text-muted-foreground">Update your account password</p>
                </div>
                <Button variant="outline" size="sm">Change</Button>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <LogOut className="h-4 w-4 text-primary" />
                    Sign Out
                  </h3>
                  <p className="text-xs text-muted-foreground">Sign out of your account</p>
                </div>
                <Button variant="outline" size="sm">Sign Out</Button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="font-semibold text-sm text-destructive">Delete Account</h3>
                  <p className="text-xs text-muted-foreground">Permanently remove your account</p>
                </div>
                <Button variant="destructive" size="sm">Delete</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
