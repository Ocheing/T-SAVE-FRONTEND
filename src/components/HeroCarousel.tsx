import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Wallet, TrendingUp, Target } from "lucide-react";
import { Button } from "./ui/button";
import heroBeach from "@/assets/hero-beach.jpg";
import savingsTravel from "@/assets/savings-travel.jpg";
import mountainAdventure from "@/assets/mountain-adventure.jpg";

const slides = [
  {
    image: heroBeach,
    icon: Wallet,
    title: "Save Smart, Travel More",
    description: "Start your journey by setting aside funds for your dream destinations. Every penny saved brings you closer to paradise."
  },
  {
    image: savingsTravel,
    icon: Target,
    title: "Set Your Travel Goals",
    description: "Choose your dream destinations and create custom savings plans. Track your progress and watch your travel fund grow."
  },
  {
    image: mountainAdventure,
    icon: TrendingUp,
    title: "Watch Your Dreams Come True",
    description: "Monitor your monthly savings, track achievements, and celebrate milestones as you reach your travel goals."
  }
];

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(timer);
  }, [currentSlide]);

  const handleNext = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentSlide((prev) => (prev + 1) % slides.length);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const handlePrev = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="relative h-[600px] overflow-hidden rounded-3xl">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: `url(${slide.image})`,
          transform: isAnimating ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
      </div>

      <div className="relative h-full flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl animate-fade-in">
            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-ocean shadow-[var(--shadow-elegant)]">
              <Icon className="h-8 w-8 text-white" />
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white animate-slide-in">
              {slide.title}
            </h1>
            
            <p className="text-xl text-white/90 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {slide.description}
            </p>

            <div className="flex gap-2 sm:gap-4 animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <Button variant="hero" size="sm" className="sm:px-6 sm:py-5 sm:text-base">
                Start Saving Today
              </Button>
              <Button variant="outline" size="sm" className="sm:px-6 sm:py-5 sm:text-base bg-accent text-white border-accent hover:bg-accent/90">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'w-8 bg-primary' 
                : 'w-2 bg-primary/30 hover:bg-primary/50'
            }`}
          />
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/20 backdrop-blur-sm hover:bg-background/40"
        onClick={handlePrev}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/20 backdrop-blur-sm hover:bg-background/40"
        onClick={handleNext}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default HeroCarousel;
