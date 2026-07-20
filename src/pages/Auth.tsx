import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Mail, Lock, User, Loader2, Eye, EyeOff, Phone, CreditCard
} from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/tembeasave-logo.png";
import authIllustration from "@/assets/auth-illustration.png";
import { useTranslation } from "react-i18next";
import "./Auth.css";

/**
 * Unified Auth Page - Single login for all users (regular, admin, super_admin)
 * Instant role-based redirect after login with no loading delays
 * 
 * Redesigned with dark glassmorphism split-panel layout
 */
const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);

  // --- Sign In fields ---
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // --- Sign Up fields ---
  const [signupEmail, setSignupEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+254");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentTab, setCurrentTab] = useState<"login" | "signup">("login");
  const [signupSuccess, setSignupSuccess] = useState(false);

  /** Resets every form field back to its default empty state */
  const resetAllFields = () => {
    setLoginEmail("");
    setLoginPassword("");
    setSignupEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setPhone("");
    setIdNumber("");
    setCountryCode("+254");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const { signIn, signUp, signInWithGoogle, user, isInitialized, getRedirectPath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Get intended destination from location state (for protected route redirects)
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  // Reset all fields on every navigation to this page (fresh state on each visit)
  useEffect(() => {
    resetAllFields();
    setCurrentTab("login");
    setSignupSuccess(false);
  }, [location.key]);

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
      <div className="auth-loading">
        <img src={logo} alt="TembeaSave" className="auth-loading-logo" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const trimmedEmail = loginEmail.trim();
    if (!trimmedEmail) {
      toast({
        title: t('common.error'),
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast({
        title: t('common.error'),
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (!loginPassword) {
      toast({
        title: t('common.error'),
        description: "Please enter your password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Optimistically prefetch admin chunks in the background while authenticating
    // to ensure zero network lag if the user turns out to be an admin.
    import("@/admin/components/AdminLayout").catch(() => {});
    import("@/admin/pages/Dashboard").catch(() => {});

    try {
      // signIn returns role and redirectTo immediately
      const { error, role, redirectTo } = await signIn(trimmedEmail, loginPassword);

      if (error) {
        // Show a clear, user-friendly message for invalid credentials
        const msg = error.message?.toLowerCase() || '';
        const isCredentialError =
          msg.includes('invalid') ||
          msg.includes('credentials') ||
          msg.includes('password') ||
          msg.includes('not found') ||
          msg.includes('email');

        toast({
          title: "Login Failed",
          description: isCredentialError
            ? "Incorrect email address or password."
            : error.message,
          variant: "destructive",
        });
        // Only clear the password, keep email so user doesn't have to retype it
        setLoginPassword("");
        setShowPassword(false);
        setIsLoading(false);
        return;
      }

      toast({
        title: t('auth.loginSuccess'),
      });

      resetAllFields();
      // Instant redirect - no waiting for state updates
      navigate(from || redirectTo, { replace: true });

    } catch {
      toast({
        title: t('common.error'),
        description: t('messages.somethingWentWrong'),
        variant: "destructive",
      });
      resetAllFields();
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
      resetAllFields();
      return;
    }

    if (password.length < 6) {
      toast({
        title: t('auth.passwordShort'),
        description: t('auth.passwordShortDesc'),
        variant: "destructive",
      });
      resetAllFields();
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail.trim())) {
      toast({
        title: t('common.error'),
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const fullPhone = `${countryCode}${phone}`;
      const { error, session: newSession } = await signUp(signupEmail.trim(), password, fullName, fullPhone, idNumber);

      if (error) {
        if (error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("already exists")) {
          toast({
            title: t('auth.accountExists'),
            description: t('auth.accountExistsDesc'),
            variant: "destructive",
          });
          resetAllFields();
          setCurrentTab("login");
          setIsLoading(false);
          return;
        }
        toast({
          title: t('common.error'),
          description: error.message,
          variant: "destructive",
        });
        resetAllFields();
      } else if (newSession) {
        // Auto-confirmed: user is logged in immediately with profile already populated
        toast({
          title: "Account created successfully! 🎉",
          description: `Welcome aboard, ${fullName || 'Traveler'}!`,
        });
        resetAllFields();
        // Redirect to dashboard — profile data is already in AuthContext
        navigate('/dashboard', { replace: true });
      } else {
        // Email confirmation required
        toast({
          title: t('auth.signupSuccess'),
          description: t('auth.verificationDesc', { email: signupEmail }),
        });
        resetAllFields();
        setSignupSuccess(true);
        setCurrentTab("login");
      }
    } catch {
      toast({
        title: t('common.error'),
        description: t('messages.somethingWentWrong'),
        variant: "destructive",
      });
      resetAllFields();
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

  const handleTabSwitch = (tab: "login" | "signup") => {
    resetAllFields();
    setCurrentTab(tab);
    setSignupSuccess(false);
  };

  return (
    <div className="auth-page">
      {/* Ambient background effects */}
      <div className="auth-bg-glow auth-bg-glow--1" />
      <div className="auth-bg-glow auth-bg-glow--2" />

      <div className="auth-container">
        {/* ===== LEFT PANEL - Branding ===== */}
        <div className="auth-branding">
          <div className="auth-branding__content">
            <Link to="/" className="auth-logo-link">
              <img src={logo} alt="TembeaSave Logo" className="auth-logo" />
            </Link>

            <h1 className="auth-branding__title">
              {t('auth.welcomeBack')}
            </h1>
            <p className="auth-branding__subtitle">
              {t('auth.continueJourney')}
            </p>

            <div className="auth-illustration-wrapper">
              <div className="auth-illustration-glow" />
              <img
                src={authIllustration}
                alt="Savings Growth"
                className="auth-illustration"
              />
            </div>
          </div>
        </div>

        {/* ===== RIGHT PANEL - Form ===== */}
        <div className="auth-form-panel">
          <div className="auth-form-card">
            {/* Google Sign In */}
            <button
              type="button"
              className="auth-google-btn"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              {isLoading && currentTab === "login" ? (
                <Loader2 className="auth-google-btn__icon auth-spin" />
              ) : (
                <FaGoogle className="auth-google-btn__icon" />
              )}
              <span>{t('auth.continueWithGoogle')}</span>
            </button>

            {/* Divider */}
            <div className="auth-divider">
              <span className="auth-divider__line" />
              <span className="auth-divider__text">{t('auth.orContinueWith')}</span>
              <span className="auth-divider__line" />
            </div>

            {/* Tab Switcher */}
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${currentTab === "login" ? "auth-tab--active" : ""}`}
                onClick={() => handleTabSwitch("login")}
              >
                {t('auth.signIn')}
              </button>
              <button
                type="button"
                className={`auth-tab ${currentTab === "signup" ? "auth-tab--active" : ""}`}
                onClick={() => handleTabSwitch("signup")}
              >
                {t('auth.signUp')}
              </button>
            </div>

            {/* ===== LOGIN FORM ===== */}
            <div className={`auth-form-content ${currentTab === "login" ? "auth-form-content--visible" : ""}`}>
              {currentTab === "login" && (
                <form onSubmit={handleLogin} className="auth-form">
                  {/* Email */}
                  <div className="auth-field">
                    <Label htmlFor="email" className="auth-field__label">
                      <Mail className="auth-field__icon" />
                      {t('auth.email')}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      className="auth-input"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      autoComplete="off"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="auth-field">
                    <Label htmlFor="password" className="auth-field__label">
                      <Lock className="auth-field__icon" />
                      {t('auth.password')}
                    </Label>
                    <div className="auth-input-wrapper">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="auth-input auth-input--password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        autoComplete="off"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="auth-password-toggle"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me + Forgot */}
                  <div className="auth-options">
                    <label className="auth-checkbox-label">
                      <input type="checkbox" className="auth-checkbox" />
                      <span>{t('auth.rememberMe')}</span>
                    </label>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); toast({ title: "Coming Soon", description: "Password reset will be available shortly." }); }}
                      className="auth-forgot-link"
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="auth-spin h-4 w-4" />
                        <span>{t('auth.signingIn')}</span>
                      </>
                    ) : (
                      <span>{t('auth.signIn')}</span>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* ===== SIGNUP FORM ===== */}
            <div className={`auth-form-content ${currentTab === "signup" ? "auth-form-content--visible" : ""}`}>
              {currentTab === "signup" && (
                <>
                  {signupSuccess ? (
                    <div className="auth-success">
                      <div className="auth-success__icon-wrap">
                        <Mail className="auth-success__icon" />
                      </div>
                      <h3 className="auth-success__title">{t('auth.verificationSent')}</h3>
                      <p className="auth-success__text">
                        {t('auth.verificationDesc', { email: signupEmail })}
                      </p>
                      <button
                        type="button"
                        className="auth-submit-btn auth-submit-btn--outline"
                        onClick={() => handleTabSwitch("login")}
                      >
                        {t('auth.goToLogin')}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSignUp} className="auth-form">
                      {/* Full Name */}
                      <div className="auth-field">
                        <Label htmlFor="name" className="auth-field__label">
                          <User className="auth-field__icon" />
                          {t('auth.fullName')}
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="John Doe"
                          className="auth-input"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>

                      {/* Email */}
                      <div className="auth-field">
                        <Label htmlFor="signup-email" className="auth-field__label">
                          <Mail className="auth-field__icon" />
                          {t('auth.email')}
                        </Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your.email@example.com"
                          className="auth-input"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          autoComplete="off"
                          required
                        />
                      </div>

                      {/* Phone + ID Number */}
                      <div className="auth-field-row">
                        <div className="auth-field auth-field--half">
                          <Label htmlFor="signup-phone" className="auth-field__label">
                            <Phone className="auth-field__icon" />
                            {t('auth.phone')}
                          </Label>
                          <div className="auth-phone-row">
                            <Select value={countryCode} onValueChange={setCountryCode}>
                              <SelectTrigger className="auth-country-select">
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
                              className="auth-input auth-input--phone"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div className="auth-field auth-field--half">
                          <Label htmlFor="signup-id" className="auth-field__label">
                            <CreditCard className="auth-field__icon" />
                            {t('auth.idNumber')}
                          </Label>
                          <Input
                            id="signup-id"
                            type="text"
                            placeholder="1234..."
                            className="auth-input"
                            value={idNumber}
                            onChange={(e) => setIdNumber(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="auth-field">
                        <Label htmlFor="signup-password" className="auth-field__label">
                          <Lock className="auth-field__icon" />
                          {t('auth.password')}
                        </Label>
                        <div className="auth-input-wrapper">
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="auth-input auth-input--password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="auth-password-toggle"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="auth-field">
                        <Label htmlFor="confirm-password" className="auth-field__label">
                          <Lock className="auth-field__icon" />
                          {t('auth.confirmPassword')}
                        </Label>
                        <div className="auth-input-wrapper">
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="auth-input auth-input--password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="auth-password-toggle"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="auth-spin h-4 w-4" />
                            <span>{t('auth.creatingAccount')}</span>
                          </>
                        ) : (
                          <span>{t('auth.createAccount')}</span>
                        )}
                      </button>

                      <p className="auth-terms">
                        {t('auth.terms')}
                      </p>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
