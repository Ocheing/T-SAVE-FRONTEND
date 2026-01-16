import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Phone, CreditCard } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/tembeasave-logo.png";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [currentTab, setCurrentTab] = useState("login");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [countryCode, setCountryCode] = useState("+254");
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Get the redirect path from location state, default to dashboard
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";

  // Redirect if already logged in - use useEffect to avoid setState during render
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // Show nothing while redirecting
  if (user) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const fullPhone = `${countryCode}${phone}`;
      const { error } = await signUp(email, password, fullName, fullPhone, idNumber);

      if (error) {
        if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")) {
          toast({
            title: "Account exists",
            description: "An account with this email already exists. Please login instead.",
            variant: "destructive",
          });
          setCurrentTab("login");
          return;
        }
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
        setSignupSuccess(true);
        // Switch to login tab automatically
        setCurrentTab("login");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      const { error } = await signInWithGoogle();

      if (error) {
        toast({
          title: "Google sign-in failed",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
      }
      // Note: Google OAuth will redirect, so we don't need to handle success here
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
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
            variant="default"
            size="sm"
            className="w-full mb-4 bg-primary hover:bg-primary/90"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FaGoogle className="mr-2 h-4 w-4" />
            )}
            Continue with Google
          </Button>

          <div className="relative my-4">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              OR
            </span>
          </div>

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="text-xs">Login</TabsTrigger>
              <TabsTrigger value="signup" className="text-xs">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="flex items-center gap-1.5 text-xs">
                    <Lock className="h-3 w-3 text-primary" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-9 text-sm pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
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
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      Login
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              {signupSuccess ? (
                <div className="py-8 text-center space-y-4 animate-fade-in">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-2">
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold">Verification Sent!</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    We've sent a confirmation email to <strong>{email}</strong>.
                    Please verify your account to start your savings journey.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => setCurrentTab("login")}
                  >
                    Go to Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
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
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-phone" className="flex items-center gap-1.5 text-xs">
                        <Phone className="h-3 w-3 text-primary" />
                        Phone Number
                      </Label>
                      <div className="flex gap-2">
                        <Select value={countryCode} onValueChange={setCountryCode}>
                          <SelectTrigger className="w-[100px] h-9 text-xs">
                            <SelectValue placeholder="Code" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="+254">🇰🇪 +254</SelectItem>
                            <SelectItem value="+255">🇹🇿 +255</SelectItem>
                            <SelectItem value="+256">🇺🇬 +256</SelectItem>
                            <SelectItem value="+250">🇷🇼 +250</SelectItem>
                            <SelectItem value="+251">🇪🇹 +251</SelectItem>
                            <SelectItem value="+1">🇺🇸 +1</SelectItem>
                            <SelectItem value="+44">🇬🇧 +44</SelectItem>
                            <SelectItem value="+971">🇦🇪 +971</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder="712..."
                          className="h-9 text-sm flex-1"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-id" className="flex items-center gap-1.5 text-xs">
                        <CreditCard className="h-3 w-3 text-primary" />
                        ID Number
                      </Label>
                      <Input
                        id="signup-id"
                        type="text"
                        placeholder="1234..."
                        className="h-9 text-sm"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="flex items-center gap-1.5 text-xs">
                      <Lock className="h-3 w-3 text-primary" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="h-9 text-sm pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password" className="flex items-center gap-1.5 text-xs">
                      <Lock className="h-3 w-3 text-primary" />
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="h-9 text-sm pr-10"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="hero"
                    size="sm"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <p className="text-[10px] text-center text-muted-foreground">
                    By signing up, you agree to our Terms of Service and Privacy Policy
                  </p>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
