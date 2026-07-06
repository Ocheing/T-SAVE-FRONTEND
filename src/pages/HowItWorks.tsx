import { UserPlus, MapPinned, PiggyBank, Plane, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create Your Free Account",
    description: "Sign up in under a minute with your email or Google account. No fees, no commitments — just a secure space to start planning your dream trip.",
    highlights: ["Free forever", "Bank-level security", "No hidden charges"],
    gradient: "from-cyan-500/15 to-blue-500/5",
  },
  {
    number: "02",
    icon: MapPinned,
    title: "Set a Travel Goal",
    description: "Pick a destination and set your savings target. Whether it's a weekend getaway or a month-long adventure, we'll help you plan the budget.",
    highlights: ["Choose from curated destinations", "Custom budget planning", "Flexible timelines"],
    gradient: "from-emerald-500/15 to-teal-500/5",
  },
  {
    number: "03",
    icon: PiggyBank,
    title: "Save at Your Own Pace",
    description: "Add funds whenever you're ready — weekly, monthly, or whenever you can. Track your progress with visual milestones and stay motivated.",
    highlights: ["Flexible deposits via M-Pesa & card", "Real-time progress tracking", "Milestone celebrations"],
    gradient: "from-amber-500/15 to-orange-500/5",
  },
  {
    number: "04",
    icon: Plane,
    title: "Book & Travel",
    description: "Once you hit your goal, book your trip directly through the platform. We partner with trusted providers to get you the best deals.",
    highlights: ["Exclusive member deals", "Trusted travel partners", "Hassle-free booking"],
    gradient: "from-violet-500/15 to-purple-500/5",
  },
];

const HowItWorks = () => {
  const { user, isInitialized } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="absolute top-20 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-primary/3 rounded-full blur-3xl" />

        <div className="container mx-auto max-w-4xl text-center relative z-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
            <Sparkles className="h-3 w-3" />
            Simple & Transparent
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            How <span className="text-primary">TembeaSave</span> Works
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From setting your first goal to boarding your flight — here's how we make travel savings effortless.
          </p>
        </div>
      </section>

      {/* Steps Timeline */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-5xl mx-auto relative">
          {/* Vertical connector line (desktop only) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/30 via-primary/10 to-transparent -translate-x-1/2 z-0" />

          <div className="space-y-8">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Timeline dot (desktop) */}
                <div className="hidden md:flex absolute left-1/2 top-10 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-background border-2 border-primary items-center justify-center shadow-lg shadow-primary/20">
                  <span className="text-xs font-bold text-primary">{step.number}</span>
                </div>

                <Card className="p-0 overflow-hidden hover:shadow-[var(--shadow-elegant)] transition-all duration-500 hover:-translate-y-1 border-white/5">
                  <div className={`flex flex-col md:flex-row ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                    {/* Visual Side */}
                    <div className={`md:w-2/5 p-6 md:p-8 flex flex-col items-center justify-center bg-gradient-to-br ${step.gradient} relative`}>
                      <span className="absolute top-4 left-4 text-5xl font-black text-primary/8 select-none">
                        {step.number}
                      </span>
                      <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
                        <step.icon className="h-8 w-8 text-primary" />
                      </div>
                    </div>

                    {/* Content Side */}
                    <div className="md:w-3/5 p-6 md:p-8 flex flex-col justify-center">
                      {/* Mobile step badge */}
                      <div className="md:hidden inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2 w-fit">
                        Step {step.number}
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold mb-3">{step.title}</h3>
                      <p className="text-muted-foreground mb-4 leading-relaxed text-sm">{step.description}</p>
                      <ul className="space-y-2.5">
                        {step.highlights.map((h) => (
                          <li key={h} className="flex items-center gap-2.5 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground">{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary/80">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Start Saving?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Join thousands of travelers who are already saving smart with TembeaSave.
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
                    Create Free Account
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

export default HowItWorks;
