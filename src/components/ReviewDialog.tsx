import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

/**
 * Returns a user-scoped localStorage key for storing the review flag.
 * Falls back to a generic key if userId is unavailable.
 */
function getReviewKey(userId: string | undefined): string {
    return userId ? `has_reviewed_${userId}` : "has_reviewed";
}

/**
 * Check if user has already submitted a review.
 * First checks localStorage (fast), then falls back to DB (authoritative).
 */
async function hasAlreadyReviewed(userId: string): Promise<boolean> {
    // 1. Fast local check
    if (localStorage.getItem(getReviewKey(userId)) === "true") return true;

    // 2. Authoritative DB check (handles cross-device logins)
    try {
        const { data, error } = await supabase
            .from("app_reviews")
            .select("id")
            .eq("user_id", userId)
            .limit(1)
            .maybeSingle();

        if (!error && data) {
            // Sync to localStorage so future checks are instant
            localStorage.setItem(getReviewKey(userId), "true");
            return true;
        }
    } catch {
        // Ignore DB errors — default to not reviewed
    }
    return false;
}

interface ReviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Called after user submits OR dismisses the review so logout can proceed */
    onDone: () => void;
}

const ReviewDialog = ({ open, onOpenChange, onDone }: ReviewDialogProps) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (rating === 0) return;
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from("app_reviews")
                .insert({
                    user_id: user?.id,
                    rating,
                    comment,
                    is_public: true,
                });

            if (error) throw error;

            // Mark as reviewed in localStorage (user-scoped)
            localStorage.setItem(getReviewKey(user?.id), "true");

            toast({
                title: "Thank you for your feedback! 🎉",
                description: "We appreciate your review.",
            });
        } catch {
            toast({
                title: "Error",
                description: "Failed to submit review. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
            onOpenChange(false);
            onDone();
        }
    };

    const handleSkip = () => {
        onOpenChange(false);
        onDone();
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleSkip(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Before you go — how was TembeaSave? ✈️</DialogTitle>
                    <DialogDescription>
                        Your feedback helps us improve your travel savings experience.
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
                    <Button variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
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

export { ReviewDialog, hasAlreadyReviewed, getReviewKey };
export default ReviewDialog;
