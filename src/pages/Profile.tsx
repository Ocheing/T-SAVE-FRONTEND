import { useState, useEffect, useRef } from "react";
import { User, Mail, Phone, MapPin, Settings, LogOut, CreditCard, Globe, Bell, DollarSign, Loader2, Save, Camera, Smartphone, Building, Plus, Trash2, Star, Check, Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";

// Comprehensive list of world currencies
const CURRENCIES = [
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", flag: "🇰🇪" },
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
  { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", flag: "🇹🇿" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh", flag: "🇺🇬" },
  { code: "RWF", name: "Rwandan Franc", symbol: "FRw", flag: "🇷🇼" },
  { code: "ETB", name: "Ethiopian Birr", symbol: "Br", flag: "🇪🇹" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "🇧🇷" },
  { code: "MXN", name: "Mexican Peso", symbol: "Mex$", flag: "🇲🇽" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "🇰🇷" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  { code: "THB", name: "Thai Baht", symbol: "฿", flag: "🇹🇭" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", flag: "🇲🇾" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", flag: "🇵🇭" },
];

// Comprehensive list of world languages
const LANGUAGES = [
  { code: "en", name: "English", native: "English", flag: "🇬🇧" },
  { code: "sw", name: "Swahili", native: "Kiswahili", flag: "🇰🇪" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italian", native: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "🇵🇹" },
  { code: "zh", name: "Chinese", native: "中文", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", native: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", native: "한국어", flag: "🇰🇷" },
  { code: "ar", name: "Arabic", native: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "am", name: "Amharic", native: "አማርኛ", flag: "🇪🇹" },
  { code: "ha", name: "Hausa", native: "Hausa", flag: "🇳🇬" },
  { code: "zu", name: "Zulu", native: "isiZulu", flag: "🇿🇦" },
];

// Payment method type icons
const PAYMENT_ICONS = {
  mpesa: { icon: Smartphone, color: "text-green-600", bg: "bg-green-100", name: "M-Pesa" },
  card: { icon: CreditCard, color: "text-blue-600", bg: "bg-blue-100", name: "Card" },
  bank: { icon: Building, color: "text-purple-600", bg: "bg-purple-100", name: "Bank" },
};

interface PaymentMethod {
  id: string;
  type: 'mpesa' | 'card' | 'bank';
  name: string;
  details: {
    phone?: string;
    cardNumber?: string;
    bankName?: string;
    accountNumber?: string;
  };
  is_default: boolean;
}

const Profile = () => {
  const { profile: authProfile, signOut, user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    id_number: '',
    location: '',
    language: 'en',
    currency: 'kes',
    email_notifications: true,
    trip_reminders: true,
    savings_milestones: true,
  });

  const [countryCode, setCountryCode] = useState("+254");

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [newPayment, setNewPayment] = useState({
    type: 'mpesa' as 'mpesa' | 'card' | 'bank',
    name: '',
    phone: '',
    cardNumber: '',
    bankName: '',
    accountNumber: '',
  });

  // Auto-populate form data when profile loads
  useEffect(() => {
    if (profile) {
      let extractedPhone = profile.phone || '';
      let extractedCode = "+254";

      const codes = ["+254", "+255", "+256", "+250", "+251", "+971", "+44", "+1"];
      for (const code of codes) {
        if (extractedPhone.startsWith(code)) {
          extractedCode = code;
          extractedPhone = extractedPhone.replace(code, '');
          break;
        }
      }

      setFormData({
        full_name: profile.full_name || '',
        phone: extractedPhone,
        id_number: profile.id_number || '',
        location: profile.location || '',
        language: profile.language || 'en',
        currency: profile.currency || 'kes',
        email_notifications: profile.email_notifications ?? true,
        trip_reminders: profile.trip_reminders ?? true,
        savings_milestones: profile.savings_milestones ?? true,
      });
      setCountryCode(extractedCode);
      if (profile.avatar_url) {
        setAvatarPreview(profile.avatar_url);
      }
    } else if (authProfile) {
      setFormData(prev => ({
        ...prev,
        full_name: authProfile.full_name || '',
      }));
    }
  }, [profile, authProfile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      toast({
        title: "Avatar updated",
        description: "Your new avatar will be saved when you save your profile.",
      });
    }
  };

  const handleSave = async () => {
    try {
      const fullPhone = `${countryCode}${formData.phone}`;
      await updateProfile.mutateAsync({
        ...formData,
        phone: fullPhone
      });
      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile. Please try again.";
      toast({
        title: "Update failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  const handleAddPayment = () => {
    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      type: newPayment.type,
      name: newPayment.name || (
        newPayment.type === 'mpesa' ? `M-Pesa (${newPayment.phone})` :
          newPayment.type === 'card' ? `Card ending ${newPayment.cardNumber.slice(-4)}` :
            `${newPayment.bankName} - ${newPayment.accountNumber.slice(-4)}`
      ),
      details: {
        phone: newPayment.phone,
        cardNumber: newPayment.cardNumber,
        bankName: newPayment.bankName,
        accountNumber: newPayment.accountNumber,
      },
      is_default: paymentMethods.length === 0,
    };

    setPaymentMethods([...paymentMethods, newMethod]);
    setNewPayment({
      type: 'mpesa',
      name: '',
      phone: '',
      cardNumber: '',
      bankName: '',
      accountNumber: '',
    });
    setIsPaymentDialogOpen(false);

    toast({
      title: "Payment method added",
      description: `${PAYMENT_ICONS[newMethod.type].name} has been added successfully.`,
    });
  };

  const handleRemovePayment = (id: string) => {
    setPaymentMethods(paymentMethods.filter(p => p.id !== id));
    toast({
      title: "Payment method removed",
      description: "The payment method has been removed.",
    });
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(paymentMethods.map(p => ({
      ...p,
      is_default: p.id === id
    })));
    toast({
      title: "Default updated",
      description: "Your default payment method has been updated.",
    });
  };

  const getInitials = () => {
    const name = formData.full_name || profile?.full_name || authProfile?.full_name || '';
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  const displayEmail = profile?.email || authProfile?.email || user?.email || '';

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-3xl font-bold mb-1">Your Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <div className="space-y-4">
          {/* Profile Card with Avatar */}
          <Card className="p-6 animate-scale-in">
            <div className="flex items-start gap-4 mb-6">
              <div className="relative group">
                <Avatar className="h-20 w-20 cursor-pointer" onClick={handleAvatarClick}>
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} alt="Avatar" />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={handleAvatarClick}
                >
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">{formData.full_name || 'User'}</h2>
                <p className="text-sm text-muted-foreground mb-3">
                  Member since {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : 'Recently'}
                </p>
                <Button variant="outline" size="sm" onClick={handleAvatarClick}>
                  <Camera className="h-4 w-4 mr-2" />
                  Change Avatar
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="fullName" className="flex items-center gap-2 text-xs">
                    <User className="h-3 w-3 text-primary" />
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email" className="flex items-center gap-2 text-xs">
                    <Mail className="h-3 w-3 text-primary" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={displayEmail}
                    className="h-9 bg-muted"
                    disabled
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-xs">
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
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="700 000 000"
                      className="h-9 flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="idNumber" className="flex items-center gap-2 text-xs">
                    <CreditCard className="h-3 w-3 text-primary" />
                    ID Number
                  </Label>
                  <Input
                    id="idNumber"
                    value={formData.id_number}
                    onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                    placeholder="12345678"
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="location" className="flex items-center gap-2 text-xs">
                  <MapPin className="h-3 w-3 text-primary" />
                  Location
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Nairobi, Kenya"
                  className="h-9"
                />
              </div>

              <div className="pt-2">
                <Button
                  variant="hero"
                  size="sm"
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Payment Methods Card */}
          <Card className="p-6 animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Payment Methods</h2>
              </div>
              <Button size="sm" variant="outline" onClick={() => setIsPaymentDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add New
              </Button>
            </div>

            <div className="mb-6">
              <Link to="/transactions">
                <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-2">
                  <Receipt className="h-4 w-4" />
                  View Transaction History
                </Button>
              </Link>
            </div>

            {paymentMethods.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">No payment methods</h3>
                <p className="text-sm text-muted-foreground mb-4">Add M-Pesa, Card, or Bank account</p>
                <Button size="sm" onClick={() => setIsPaymentDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const PayIcon = PAYMENT_ICONS[method.type];
                  return (
                    <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${PayIcon.bg}`}>
                          <PayIcon.icon className={`h-5 w-5 ${PayIcon.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{method.name}</span>
                            {method.is_default && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{PayIcon.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!method.is_default && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSetDefault(method.id)}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemovePayment(method.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Preferences Card */}
          <Card className="p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Preferences</h2>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="language" className="text-xs">Language</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) => setFormData({ ...formData, language: value })}
                  >
                    <SelectTrigger id="language" className="h-9">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-[200px]">
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <span className="flex items-center gap-2">
                              <span>{lang.flag}</span>
                              <span>{lang.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="currency" className="text-xs flex items-center gap-2">
                    <DollarSign className="h-3 w-3 text-primary" />
                    Currency
                  </Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger id="currency" className="h-9">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-[200px]">
                        {CURRENCIES.map((curr) => (
                          <SelectItem key={curr.code} value={curr.code.toLowerCase()}>
                            <span className="flex items-center gap-2">
                              <span>{curr.flag}</span>
                              <span>{curr.code}</span>
                              <span className="text-muted-foreground">({curr.symbol})</span>
                            </span>
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>

          {/* Notifications Card */}
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
                <Switch
                  checked={formData.email_notifications}
                  onCheckedChange={(checked) => setFormData({ ...formData, email_notifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="font-semibold text-sm">Trip Reminders</h3>
                  <p className="text-xs text-muted-foreground">Get notified about upcoming trips</p>
                </div>
                <Switch
                  checked={formData.trip_reminders}
                  onCheckedChange={(checked) => setFormData({ ...formData, trip_reminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="font-semibold text-sm">Savings Milestones</h3>
                  <p className="text-xs text-muted-foreground">Celebrate your savings achievements</p>
                </div>
                <Switch
                  checked={formData.savings_milestones}
                  onCheckedChange={(checked) => setFormData({ ...formData, savings_milestones: checked })}
                />
              </div>
            </div>
          </Card>

          {/* Account Settings Card */}
          <Card className="p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-4">
              <Settings className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Account Settings</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <LogOut className="h-4 w-4 text-primary" />
                    Sign Out
                  </h3>
                  <p className="text-xs text-muted-foreground">Sign out of your account</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>Sign Out</Button>
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

        {/* Add Payment Method Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
              <DialogDescription>
                Choose how you'd like to add funds to your savings
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Payment Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['mpesa', 'card', 'bank'] as const).map((type) => {
                    const PayIcon = PAYMENT_ICONS[type];
                    return (
                      <Button
                        key={type}
                        variant={newPayment.type === type ? 'default' : 'outline'}
                        className="flex-col h-20"
                        onClick={() => setNewPayment({ ...newPayment, type })}
                      >
                        <PayIcon.icon className="h-6 w-6 mb-1" />
                        <span className="text-xs">{PayIcon.name}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {newPayment.type === 'mpesa' && (
                <div className="space-y-2">
                  <Label htmlFor="mpesa_phone">M-Pesa Phone Number</Label>
                  <Input
                    id="mpesa_phone"
                    placeholder="+254 7XX XXX XXX"
                    value={newPayment.phone}
                    onChange={(e) => setNewPayment({ ...newPayment, phone: e.target.value })}
                  />
                </div>
              )}

              {newPayment.type === 'card' && (
                <div className="space-y-2">
                  <Label htmlFor="card_number">Card Number</Label>
                  <Input
                    id="card_number"
                    placeholder="XXXX XXXX XXXX XXXX"
                    value={newPayment.cardNumber}
                    onChange={(e) => setNewPayment({ ...newPayment, cardNumber: e.target.value })}
                  />
                </div>
              )}

              {newPayment.type === 'bank' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Input
                      id="bank_name"
                      placeholder="e.g., Equity Bank"
                      value={newPayment.bankName}
                      onChange={(e) => setNewPayment({ ...newPayment, bankName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_number">Account Number</Label>
                    <Input
                      id="account_number"
                      placeholder="Account number"
                      value={newPayment.accountNumber}
                      onChange={(e) => setNewPayment({ ...newPayment, accountNumber: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="hero" onClick={handleAddPayment}>
                <Check className="h-4 w-4 mr-2" />
                Add Method
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Profile;
