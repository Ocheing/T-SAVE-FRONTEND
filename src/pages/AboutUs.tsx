import { Globe, Users, Shield, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AboutUs = () => {
  return (
    <div className="min-h-screen py-20 px-4 container mx-auto">
      <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">About TembeaSave</h1>
          <p className="text-xl text-muted-foreground">
            Empowering travelers to reach their dream destinations through smart savings.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4 animate-slide-in">
            <h2 className="text-3xl font-bold">Our Mission</h2>
            <p className="text-muted-foreground">
              At TembeaSave, we believe that travel should be accessible to everyone. Our mission is to provide a secure, intuitive, and rewarding platform that helps individuals and families plan, save, and ultimately embark on the journeys of their dreams.
            </p>
            <p className="text-muted-foreground">
              We replace financial stress with excitement, turning the daunting task of saving for a trip into a fun and trackable experience.
            </p>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-[var(--shadow-elegant)] h-80 bg-muted relative animate-scale-in">
            {/* Placeholder representation, in production use actual images */}
            <div className="absolute inset-0 bg-gradient-ocean opacity-20"></div>
            <div className="w-full h-full flex items-center justify-center">
              <Globe className="h-24 w-24 text-primary" />
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
          <Card className="p-6 text-center space-y-4 hover:shadow-[var(--shadow-elegant)] transition-all hover:-translate-y-1">
            <div className="w-14 h-14 mx-auto bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
              <Shield className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-lg">Secure Savings</h3>
            <p className="text-sm text-muted-foreground">Bank-level security for your peace of mind.</p>
          </Card>
          <Card className="p-6 text-center space-y-4 hover:shadow-[var(--shadow-elegant)] transition-all hover:-translate-y-1">
            <div className="w-14 h-14 mx-auto bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-lg">Community</h3>
            <p className="text-sm text-muted-foreground">Join thousands of successful travelers.</p>
          </Card>
          <Card className="p-6 text-center space-y-4 hover:shadow-[var(--shadow-elegant)] transition-all hover:-translate-y-1">
            <div className="w-14 h-14 mx-auto bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
              <Globe className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-lg">Global Reach</h3>
            <p className="text-sm text-muted-foreground">Partnerships with top travel providers.</p>
          </Card>
          <Card className="p-6 text-center space-y-4 hover:shadow-[var(--shadow-elegant)] transition-all hover:-translate-y-1">
            <div className="w-14 h-14 mx-auto bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
              <Award className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-lg">Best Value</h3>
            <p className="text-sm text-muted-foreground">Exclusive deals for our community.</p>
          </Card>
        </div>

        <div className="text-center space-y-6 pt-12 border-t">
          <h2 className="text-3xl font-bold">Ready to start your journey?</h2>
          <Link to="/auth">
            <Button variant="hero" size="lg" className="px-8 py-6 text-lg">
              Get Started Today
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
