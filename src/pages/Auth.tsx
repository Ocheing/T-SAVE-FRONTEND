import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Phone, CreditCard
} from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/tembeasave-logo.png";
import { useTranslation } from "react-i18next";

/**
 * Unified Auth Page - Single login for all users (regular, admin, super_admin)
 * Instant role-based redirect after login with no loading delays
 */
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

  const { signIn, signUp, signInWithGoogle, user, isInitialized, getRedirectPath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Get intended destination from location state (for protected route redirects)
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  // If already logged in, redirect immediately based on role
  useEffect(() => {
    if (isInitialized && user) {
      const redirectTo = from || getRedirectPath();
      navigate(redirectTo, { replace: true });
    }
  }, [user, isInitialized, navigate, from, getRedirectPath]);

  // Don't render form if user is already logged in (prevents flicker)
  if (isInitialized && user) {
    return null;
  }

  // Show minimal loading only during initial auth check
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="TembeaSave" className="h-12 w-auto rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // signIn returns role and redirectTo immediately
      const { error, role, redirectTo } = await signIn(email, password);

      if (error) {
        toast({
          title: t('common.error'), // Or specific "Login failed" if you add it
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: t('auth.loginSuccess'),
      });

      // Instant redirect - no waiting for state updates
      navigate(from || redirectTo, { replace: true });

    } catch {
      toast({
        title: t('common.error'),
        description: t('messages.somethingWentWrong'),
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: t('auth.passwordsNoMatch'),
        description: t('auth.passwordsNoMatchDesc'),
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: t('auth.passwordShort'),
        description: t('auth.passwordShortDesc'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const fullPhone = `${countryCode}${phone}`;
      const { error } = await signUp(email, password, fullName, fullPhone, idNumber);

      if (error) {
        if (error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("already exists")) {
          toast({
            title: t('auth.accountExists'),
            description: t('auth.accountExistsDesc'),
            variant: "destructive",
          });
          setCurrentTab("login");
          setIsLoading(false);
          return;
        }
        toast({
          title: t('common.error'),
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: t('auth.signupSuccess'),
          description: t('auth.verificationDesc', { email }),
        });
        setSignupSuccess(true);
        setCurrentTab("login");
      }
    } catch {
      toast({
        title: t('common.error'),
        description: t('messages.somethingWentWrong'),
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
          title: "Google sign-in failed", // Keep English or add specific key
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
      }
      // Note: Google OAuth will redirect, so we don't handle success here
    } catch {
      toast({
        title: t('common.error'),
        description: t('messages.somethingWentWrong'),
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
          <h1 className="text-2xl font-bold mb-1">{t('auth.welcomeBack')}</h1>
          <p className="text-sm text-muted-foreground">{t('auth.continueJourney')}</p>
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
            {t('auth.continueWithGoogle')}
          </Button>

          <div className="relative my-4">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              {t('auth.orContinueWith')}
            </span>
          </div>

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="text-xs">{t('auth.signIn')}</TabsTrigger>
              <TabsTrigger value="signup" className="text-xs">{t('auth.signUp')}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="flex items-center gap-1.5 text-xs">
                    <Mail className="h-3 w-3 text-primary" />
                    {t('auth.email')}
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
                    {t('auth.password')}
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
                    <span>{t('auth.rememberMe')}</span>
                  </label>
                  <a href="#" className="text-primary hover:underline">
                    {t('auth.forgotPassword')}
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
                      {t('auth.signingIn')}
                    </>
                  ) : (
                    <>
                      {t('auth.signIn')}
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
                  <h3 className="text-lg font-bold">{t('auth.verificationSent')}</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    {t('auth.verificationDesc', { email })}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => setCurrentTab("login")}
                  >
                    {t('auth.goToLogin')}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="flex items-center gap-1.5 text-xs">
                      <User className="h-3 w-3 text-primary" />
                      {t('auth.fullName')}
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
                      {t('auth.email')}
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
                        {t('auth.phone')}
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
                        {t('auth.idNumber')}
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
                      {t('auth.password')}
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
                      {t('auth.confirmPassword')}
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
                        {t('auth.creatingAccount')}
                      </>
                    ) : (
                      <>
                        {t('auth.createAccount')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <p className="text-[10px] text-center text-muted-foreground">
                    {t('auth.terms')}
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
