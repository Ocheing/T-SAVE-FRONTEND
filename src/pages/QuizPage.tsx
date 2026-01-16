import { useNavigate } from "react-router-dom";
import PreferenceQuiz from "@/components/PreferenceQuiz";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const QuizPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen py-10 px-4 flex flex-col items-center justify-center bg-muted/20 animate-fade-in">
            <div className="w-full max-w-4xl">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/dashboard")}
                    className="mb-6 hover:bg-transparent hover:text-primary pl-0"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Personalize Your Journey</h1>
                    <p className="text-muted-foreground">Let's find the perfect destinations for you</p>
                </div>

                <PreferenceQuiz onComplete={() => navigate("/dashboard")} />
            </div>
        </div>
    );
};

export default QuizPage;
