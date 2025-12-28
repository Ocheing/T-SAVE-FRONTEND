import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { Link } from "react-router-dom";
import logo from "@/assets/tembeasave-logo.png";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Authentication logic would go here
    setTimeout(() => setIsLoading(false), 1500);
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    // Google OAuth logic would go here
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-muted/20">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
           <Link to="/" className="inline-flex items-center justify-center gap-2 mb-6">
              <img 
    src={logo} 
    alt="TembeaSave Logo" 
    className="h-8 w-auto rounded-lg"
  />
          </Link>
          <h1 className="text-2xl font-bold mb-1">Welcome Back!</h1>
          <p className="text-sm text-muted-foreground">Continue your savings journey</p>
        </div>

        <Card className="p-6 shadow-lg">
           <Button
            type="button"
            variant="default" // Changed from "outline" to "default"
            size="sm"
            className="w-full mb-4 bg-primary hover:bg-primary/90" // Added matching background colors
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <FaGoogle className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>

          <div className="relative my-4">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              OR
            </span>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="text-xs">Login</TabsTrigger>
              <TabsTrigger value="signup" className="text-xs">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="flex items-center gap-1.5 text-xs">
                    <Mail className="h-3 w-3 text-primary" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    className="h-9 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="flex items-center gap-1.5 text-xs">
                    <Lock className="h-3 w-3 text-primary" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="h-9 text-sm"
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" className="rounded h-3 w-3" />
                    <span>Remember me</span>
                  </label>
                  <a href="#" className="text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="flex items-center gap-1.5 text-xs">
                    <User className="h-3 w-3 text-primary" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    className="h-9 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="flex items-center gap-1.5 text-xs">
                    <Mail className="h-3 w-3 text-primary" />
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your.email@example.com"
                    className="h-9 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="flex items-center gap-1.5 text-xs">
                    <Lock className="h-3 w-3 text-primary" />
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    className="h-9 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="flex items-center gap-1.5 text-xs">
                    <Lock className="h-3 w-3 text-primary" />
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    className="h-9 text-sm"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <p className="text-[10px] text-center text-muted-foreground">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
