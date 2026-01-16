import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const ReviewDialog = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        // Check if already reviewed
        const hasReviewed = localStorage.getItem("has_reviewed");
        if (hasReviewed) return;

        // Timer to trigger popup after 30 seconds
        const timer = setTimeout(() => {
            // Only show if user is logged in
            if (user) {
                setIsOpen(true);
            }
        }, 30000); // 30 seconds

        return () => clearTimeout(timer);
    }, [user]);

    const handleSubmit = async () => {
        if (rating === 0) return;
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('app_reviews')
                .insert({
                    user_id: user?.id,
                    rating,
                    comment,
                    is_public: true
                });

            if (error) throw error;

            localStorage.setItem("has_reviewed", "true");
            setIsOpen(false);

            toast({
                title: "Thank you for your feedback!",
                description: "We appreciate your review.",
            });
        } catch (error) {
            console.error("Error submitting review:", error);
            toast({
                title: "Error",
                description: "Failed to submit review. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        // If closed without reviewing, maybe ask again later? 
        // For now, let's strictly follow "let it not pop up again" ONLY "after reviewing".
        // So if they close it, it might pop up next session. 
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>How are you enjoying TembeaSave?</DialogTitle>
                    <DialogDescription>
                        Your feedback helps us improve your travel savings planning experience.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-4 py-4">
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className="transition-transform hover:scale-110 focus:outline-none"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                            >
                                <Star
                                    className={`h-8 w-8 ${star <= (hoverRating || rating)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "fill-muted text-muted-foreground"
                                        }`}
                                />
                            </button>
                        ))}
                    </div>

                    <Textarea
                        placeholder="Tell us what you think (optional)..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full"
                    />
                </div>

                <DialogFooter className="flex-col sm:justify-between gap-2">
                    <Button variant="ghost" onClick={handleClose}>
                        Maybe Later
                    </Button>
                    <Button onClick={handleSubmit} disabled={rating === 0 || isSubmitting}>
                        {isSubmitting ? "Submitting..." : "Submit Review"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ReviewDialog;
