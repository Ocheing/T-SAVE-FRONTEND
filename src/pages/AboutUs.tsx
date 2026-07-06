import { Globe, Users, Shield, Award, Heart, Target, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import heroBeach from "@/assets/hero-beach.jpg";
import logo from "@/assets/tembeasave-logo.png";

const stats = [
  { value: "10K+", label: "Active Savers" },
  { value: "50+", label: "Destinations" },
  { value: "KES 25M+", label: "Saved So Far" },
  { value: "4.8★", label: "User Rating" },
];

const values = [
  {
    icon: Shield,
    title: "Security First",
    description: "Your savings are protected with bank-level encryption and secure payment processing.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Join a growing community of smart travelers who inspire and support each other.",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "Access destinations worldwide with partnerships from top travel providers.",
  },
  {
    icon: Award,
    title: "Best Value",
    description: "Exclusive deals and competitive rates to maximize every shilling you save.",
  },
  {
    icon: Heart,
    title: "User Focused",
    description: "Every feature is designed with you in mind — intuitive, simple, and rewarding.",
  },
  {
    icon: Target,
    title: "Goal Oriented",
    description: "Visual progress tracking keeps you motivated and on track to achieve your dreams.",
  },
];

const AboutUs = () => {
  const { user, isInitialized } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="absolute top-10 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary/3 rounded-full blur-3xl" />

        <div className="container mx-auto max-w-4xl text-center relative z-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
            <Sparkles className="h-3 w-3" />
            Our Story
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            About <span className="text-primary">TembeaSave</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Empowering travelers to reach their dream destinations through smart, secure, and rewarding savings.
          </p>
        </div>
      </section>

      {/* Mission Section — Image + Text */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Image Side */}
            <div className="relative animate-scale-in order-2 lg:order-1">
              <div className="rounded-3xl overflow-hidden shadow-[var(--shadow-elegant)] relative group">
                <img
                  src={heroBeach}
                  alt="Dream travel destination"
                  className="w-full h-[320px] object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                {/* Floating stats overlay */}
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="grid grid-cols-2 gap-3">
                    {stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="bg-black/40 backdrop-blur-md rounded-xl p-3 border border-white/10"
                      >
                        <div className="text-xl font-bold text-white">{stat.value}</div>
                        <div className="text-xs text-white/70">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Floating logo badge */}
              <div className="absolute -top-5 -right-5 w-16 h-16 rounded-2xl bg-card border border-white/10 shadow-xl flex items-center justify-center animate-float">
                <img src={logo} alt="TembeaSave" className="w-10 h-10 rounded-full" />
              </div>
            </div>

            {/* Text Side */}
            <div className="space-y-6 animate-fade-in order-1 lg:order-2">
              <h2 className="text-2xl md:text-3xl font-bold">Our Mission</h2>
              <p className="text-muted-foreground text-base leading-relaxed">
                At TembeaSave, we believe that travel should be accessible to everyone. Our platform provides a secure, intuitive, and rewarding way to plan, save, and embark on the journeys of your dreams.
              </p>
              <p className="text-muted-foreground text-base leading-relaxed">
                We replace financial stress with excitement, turning the daunting task of saving for a trip into a fun, trackable, and motivating experience. Every shilling counts, and we make sure each one brings you closer to paradise.
              </p>

              <div className="space-y-3 pt-2">
                {["Save securely with bank-level encryption", "Track progress with visual milestones", "Book trips directly through the platform", "Access exclusive deals and curated destinations"].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <Link to="/how-it-works" className="inline-block pt-2">
                <Button variant="hero" size="default" className="px-6">
                  See How It Works
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-16 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 animate-fade-in">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">What We Stand For</h2>
            <p className="text-muted-foreground text-base max-w-2xl mx-auto">
              Our core values shape every feature we build and every experience we create.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {values.map((value, index) => (
              <Card
                key={value.title}
                className="p-5 text-center space-y-3 hover:shadow-[var(--shadow-elegant)] transition-all duration-500 hover:-translate-y-2 border-white/5 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 mx-auto bg-primary/12 rounded-2xl flex items-center justify-center text-primary border border-primary/10">
                  <value.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base">{value.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary/80">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Join thousands of travelers saving smart with TembeaSave. Your dream trip is closer than you think.
            </p>
            {isInitialized && (
              user ? (
                <Link to="/dashboard">
                  <Button variant="secondary" size="default" className="text-base px-6">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button variant="secondary" size="default" className="text-base px-6">
                    Get Started Today
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
