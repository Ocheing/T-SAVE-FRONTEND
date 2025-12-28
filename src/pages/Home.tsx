import { ArrowRight, Shield, TrendingUp, Zap } from "lucide-react";
import HeroCarousel from "@/components/HeroCarousel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Home = () => {
  const features = [
    {
      icon: Shield,
      title: "Secure Savings",
      description: "Your funds are protected with bank-level security. Save with confidence knowing your money is safe."
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Monitor your savings growth with detailed analytics and beautiful visualizations of your journey."
    },
    {
      icon: Zap,
      title: "Quick Setup",
      description: "Create your account in minutes and start saving for your dream destinations right away."
    }
  ];

  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-12">
        <HeroCarousel />
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4">Why Choose TembeaSave?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The smarter way to save for your travel adventures
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-8 hover:shadow-[var(--shadow-elegant)] transition-all duration-300 hover:-translate-y-2 animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mb-4 inline-flex p-4 rounded-2xl bg-primary">
                <feature.icon className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of travelers who are making their dreams come true with TembeaSave
            </p>
            <Link to="/auth">
              <Button variant="secondary" size="lg" className="text-lg">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
