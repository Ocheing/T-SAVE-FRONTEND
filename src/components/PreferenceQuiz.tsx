import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
    Loader2,
    Palmtree,
    Mountain,
    Building2,
    Check,
    Wallet,
    Leaf,
    Gem,
    Compass,
    Waves,
    Sun,
    ThermometerSnowflake,
    CloudSun,
    Tent,
    Hotel,
    Home,
    Users,
    User,
    Heart,
    Footprints,
    Activity,
    Coffee,
    Clock,
    Calendar,
    Plane,
    MapPin,
    ArrowRight,
    ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

const QUIZ_QUESTIONS = [
    {
        id: "style",
        question: "What's your preferred travel style?",
        description: "Choose the vibe that best describes your ideal getaway.",
        options: [
            { id: "adventure", label: "Adventure", tags: ["Adventure"], icon: Compass },
            { id: "relaxed", label: "Relaxed", tags: ["Relaxed"], icon: Coffee },
            { id: "cultural", label: "Cultural", tags: ["Cultural"], icon: Building2 },
            { id: "nature", label: "Nature", tags: ["Nature"], icon: Leaf },
        ]
    },
    {
        id: "budget",
        question: "What's your typical budget level?",
        description: "This helps us suggest destinations that fit your wallet.",
        options: [
            { id: "budget", label: "Budget-Friendly", tags: ["Budget"], icon: Wallet },
            { id: "mid", label: "Mid-Range", tags: ["Mid-range"], icon: Hotel },
            { id: "luxury", label: "Luxury", tags: ["Luxury"], icon: Gem },
        ]
    },
    {
        id: "duration",
        question: "How long do you usually like to travel?",
        description: "From quick escapes to long journeys.",
        options: [
            { id: "short", label: "Weekend Trip", tags: ["Short"], icon: Clock },
            { id: "medium", label: "1-2 Weeks", tags: ["Medium"], icon: Calendar },
            { id: "long", label: "2+ Weeks", tags: ["Long"], icon: Plane },
        ]
    },
    {
        id: "companions",
        question: "Who do you usually travel with?",
        description: "Travel is better when shared (or not!).",
        options: [
            { id: "solo", label: "Solo Traveler", tags: ["Solo"], icon: User },
            { id: "couple", label: "As a Couple", tags: ["Couple"], icon: Heart },
            { id: "family", label: "With Family", tags: ["Family"], icon: Home },
            { id: "friends", label: "With Friends", tags: ["Friends"], icon: Users },
        ]
    },
    {
        id: "climate",
        question: "Which climate do you prefer?",
        description: "Sunshine or snow?",
        options: [
            { id: "tropical", label: "Tropical Heat", tags: ["Tropical"], icon: Sun },
            { id: "cold", label: "Cold/Snow", tags: ["Cold"], icon: ThermometerSnowflake },
            { id: "mild", label: "Mild/Pleasant", tags: ["Mild"], icon: CloudSun },
        ]
    },
    {
        id: "activity",
        question: "How active do you like to be?",
        description: "From lounging to mountain climbing.",
        options: [
            { id: "low", label: "Low (Relaxing)", tags: ["Low-Activity"], icon: Coffee },
            { id: "moderate", label: "Moderate", tags: ["Moderate-Activity"], icon: Footprints },
            { id: "high", label: "High (Non-stop)", tags: ["High-Activity"], icon: Activity },
        ]
    },
    {
        id: "accommodation",
        question: "Where do you prefer to stay?",
        description: "Home away from home.",
        options: [
            { id: "hostel", label: "Hostel/Guesthouse", tags: ["Hostel"], icon: Tent },
            { id: "hotel", label: "Boutique Hotel", tags: ["Hotel"], icon: Hotel },
            { id: "resort", label: "All-inclusive Resort", tags: ["Resort"], icon: Waves },
            { id: "luxury", label: "Private Villa", tags: ["Luxury"], icon: Gem },
        ]
    },
    {
        id: "destination",
        question: "What's your dream destination type?",
        description: "Where does your heart take you?",
        options: [
            { id: "beach", label: "Ocean & Beaches", tags: ["Beach"], icon: Palmtree },
            { id: "mountain", label: "Peaks & Valleys", tags: ["Mountain"], icon: Mountain },
            { id: "city", label: "Urban Exploration", tags: ["City"], icon: Building2 },
            { id: "rural", label: "Nature & Peace", tags: ["Nature"], icon: Leaf },
        ]
    }
];

const PreferenceQuiz = ({ onComplete }: { onComplete: () => void }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user, refreshProfile } = useAuth();
    const { toast } = useToast();

    const currentQuestion = QUIZ_QUESTIONS[currentStep];
    const progress = ((currentStep + 1) / QUIZ_QUESTIONS.length) * 100;

    const handleSelect = (optionId: string) => {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionId }));

        // Auto-advance after a short delay for better UX
        if (currentStep < QUIZ_QUESTIONS.length - 1) {
            setTimeout(() => {
                setCurrentStep(prev => prev + 1);
            }, 300);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (!user) return;
        setIsSubmitting(true);

        try {
            // Collect all tags from the selected answers
            const selectedTags = QUIZ_QUESTIONS.flatMap(q => {
                const selectedOptionId = answers[q.id];
                const option = q.options.find(o => o.id === selectedOptionId);
                return option ? option.tags : [];
            });

            // Remove duplicates
            const uniqueTags = Array.from(new Set(selectedTags));

            const { error } = await (supabase
                .from('profiles') as any)
                .update({
                    travel_preferences: uniqueTags,
                    // Optionally store the raw answers if needed
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            await refreshProfile();

            toast({
                title: "Preferences Saved!",
                description: "We've tailored your dashboard to your unique travel style.",
            });

            onComplete();
        } catch (error: any) {
            console.error("Error saving preferences:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to save preferences.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLastStep = currentStep === QUIZ_QUESTIONS.length - 1;
    const allQuestionsAnswered = Object.keys(answers).length === QUIZ_QUESTIONS.length;

    return (
        <Card className="max-w-2xl mx-auto overflow-hidden border-primary/20 shadow-xl bg-background/50 backdrop-blur-md animate-scale-in">
            {/* Progress Bar */}
            <Progress value={progress} className="h-1 rounded-none bg-primary/10" />

            <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBack}
                            disabled={currentStep === 0}
                            className="text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                            Question {currentStep + 1} of {QUIZ_QUESTIONS.length}
                        </span>
                    </div>

                    <h2 className="text-2xl font-bold mb-2 transition-all duration-300">
                        {currentQuestion.question}
                    </h2>
                    <p className="text-muted-foreground">
                        {currentQuestion.description}
                    </p>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                    {currentQuestion.options.map((option) => {
                        const Icon = option.icon;
                        const isSelected = answers[currentQuestion.id] === option.id;

                        return (
                            <button
                                key={option.id}
                                onClick={() => handleSelect(option.id)}
                                className={`
                                    relative flex items-center p-5 rounded-2xl border-2 transition-all duration-300 group
                                    ${isSelected
                                        ? "border-primary bg-primary/5 shadow-md shadow-primary/10 scale-[1.02]"
                                        : "border-muted-foreground/10 bg-background hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.01]"
                                    }
                                `}
                            >
                                <div className={`
                                    p-3 rounded-xl mr-4 transition-colors duration-300
                                    ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"}
                                `}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div className="text-left">
                                    <span className={`font-bold block transition-colors duration-300 ${isSelected ? "text-primary" : "text-foreground"}`}>
                                        {option.label}
                                    </span>
                                </div>
                                {isSelected && (
                                    <div className="ml-auto">
                                        <div className="bg-primary rounded-full p-1 anim-bounce-subtle">
                                            <Check className="h-3 w-3 text-primary-foreground" />
                                        </div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center pt-6 border-t border-primary/10">
                    <div className="flex items-center gap-2">
                        {Array.from({ length: QUIZ_QUESTIONS.length }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${i === currentStep ? "w-4 bg-primary" : "bg-muted-foreground/30"
                                    }`}
                            />
                        ))}
                    </div>

                    {isLastStep ? (
                        <Button
                            onClick={handleSubmit}
                            disabled={!allQuestionsAnswered || isSubmitting}
                            className="px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                            size="lg"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Personalizing...
                                </>
                            ) : (
                                <>
                                    Finish Quiz
                                    <Check className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setCurrentStep(prev => prev + 1)}
                            disabled={!answers[currentQuestion.id]}
                            variant="ghost"
                            className="group"
                        >
                            Next
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default PreferenceQuiz;
