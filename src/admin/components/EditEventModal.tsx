import { useState, useCallback, useRef, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/imageCompression";
import { toast } from "sonner";
import {
    Loader2,
    Upload,
    X,
    Image as ImageIcon,
    DollarSign,
    Calendar,
    Tag,
    Star,
    TrendingUp,
    CheckCircle,
    Users,
    Edit,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useDestinations } from "@/hooks/useDestinations";
import type { AppEvent } from "@/types/database.types";

interface EditEventModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    event: AppEvent | null;
}

interface EventFormData {
    name: string;
    location: string;
    description: string;
    categories: string[];
    price: string;
    image_url: string;
    is_featured: boolean;
    is_trending: boolean;
    is_seasonal: boolean;
    status: "draft" | "published" | "archived";
    destination_id: string;
    start_date: string;
    end_date: string;
    start_time: string;
    end_time: string;
    max_participants: string;
}

const CATEGORY_OPTIONS = [
    "music",
    "cultural",
    "sports",
    "food",
    "festival",
    "art",
    "nightlife",
    "family",
    "business",
    "other",
];

const initialFormData: EventFormData = {
    name: "",
    location: "",
    description: "",
    categories: [],
    price: "",
    image_url: "",
    is_featured: false,
    is_trending: false,
    is_seasonal: false,
    status: "draft",
    destination_id: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    max_participants: "",
};

export default function EditEventModal({
    open,
    onOpenChange,
    onSuccess,
    event,
}: EditEventModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [categoryInput, setCategoryInput] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [formData, setFormData] = useState<EventFormData>(initialFormData);

    const { data: destinations } = useDestinations();

    // Prevent duplicate submissions
    const isSubmittingRef = useRef(false);
    // Debounce timer for URL preview
    const urlDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (urlDebounceRef.current) clearTimeout(urlDebounceRef.current);
    }, []);

    // Populate form when event changes
    useEffect(() => {
        if (event) {
            setFormData({
                name: event.name || "",
                location: event.location || "",
                description: event.description || "",
                categories: event.categories || [],
                price: event.price?.toString() || "",
                image_url: event.image_url || "",
                is_featured: event.is_featured || false,
                is_trending: event.is_trending || false,
                is_seasonal: event.is_seasonal || false,
                status: event.status || "draft",
                destination_id: event.destination_id || "",
                start_date: event.start_date || event.event_date || "",
                end_date: event.end_date || "",
                start_time: event.start_time || "",
                end_time: event.end_time || "",
                max_participants: event.max_participants?.toString() || "",
            });
            setImagePreview(event.image_url || null);
            setSubmitSuccess(false);
        }
    }, [event]);

    const handleClose = useCallback(() => {
        if (isSubmitting || isUploading) return; 
        setSubmitSuccess(false);
        onOpenChange(false);
    }, [isSubmitting, isUploading, onOpenChange]);

    const handleImageUpload = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            if (!file.type.startsWith("image/")) {
                toast.error("Please select an image file");
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                toast.error("Image must be less than 10MB");
                return;
            }

            setIsUploading(true);
            setUploadProgress(10);

            try {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreview(reader.result as string);
                };
                reader.readAsDataURL(file);

                setUploadProgress(25);

                const compressedFile = await compressImage(file, {
                    maxWidth: 1920,
                    maxHeight: 1080,
                    quality: 0.85,
                });

                setUploadProgress(50);

                const fileExt = "jpg";
                const fileName = `event_${Date.now()}.${fileExt}`;
                const filePath = `events/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("images")
                    .upload(filePath, compressedFile, {
                        cacheControl: "3600",
                        upsert: false,
                    });

                setUploadProgress(85);

                if (uploadError) {
                    console.error("Upload error:", uploadError);
                    toast.info(
                        "Using local preview - configure storage bucket for permanent uploads"
                    );
                    setIsUploading(false);
                    setUploadProgress(100);
                    return;
                }

                const {
                    data: { publicUrl },
                } = supabase.storage.from("images").getPublicUrl(filePath);

                setFormData((prev) => ({ ...prev, image_url: publicUrl }));
                setImagePreview(publicUrl);
                setUploadProgress(100);
                toast.success("Image uploaded successfully");
            } catch (error) {
                console.error("Upload error:", error);
                toast.info("Using local preview for image");
            } finally {
                setTimeout(() => {
                    setIsUploading(false);
                    setUploadProgress(0);
                }, 500);
            }
        },
        []
    );

    const handleImageUrlInput = useCallback((url: string) => {
        setFormData((prev) => ({ ...prev, image_url: url }));
        if (urlDebounceRef.current) clearTimeout(urlDebounceRef.current);
        if (url.trim()) {
            setImageLoading(true);
            setImagePreview(null);
            urlDebounceRef.current = setTimeout(() => {
                setImagePreview(url.trim());
            }, 350);
        } else {
            setImagePreview(null);
            setImageLoading(false);
        }
    }, []);

    const removeImage = useCallback(() => {
        if (urlDebounceRef.current) clearTimeout(urlDebounceRef.current);
        setFormData((prev) => ({ ...prev, image_url: "" }));
        setImagePreview(null);
        setImageLoading(false);
    }, []);

    const addCategory = useCallback((category: string) => {
        const trimmed = category.trim().toLowerCase();
        setFormData((prev) => {
            if (trimmed && !prev.categories.includes(trimmed)) {
                return { ...prev, categories: [...prev.categories, trimmed] };
            }
            return prev;
        });
        setCategoryInput("");
    }, []);

    const removeCategory = useCallback((category: string) => {
        setFormData((prev) => ({
            ...prev,
            categories: prev.categories.filter((c) => c !== category),
        }));
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!event) return;

        if (isSubmittingRef.current) {
            return;
        }

        if (!formData.name.trim()) {
            toast.error("Event name is required");
            return;
        }
        if (!formData.price || parseFloat(formData.price) < 0) {
            toast.error("Please enter a valid price");
            return;
        }
        if (!formData.start_date) {
            toast.error("Start date is required");
            return;
        }

        isSubmittingRef.current = true;
        setIsSubmitting(true);

        try {
            const { error } = await supabase.from("events").update({
                name: formData.name.trim(),
                location: formData.location.trim() || "",
                description: formData.description.trim() || null,
                categories: formData.categories.length > 0 ? formData.categories : null,
                price: parseFloat(formData.price),
                image_url: formData.image_url || null,
                is_featured: formData.is_featured,
                is_trending: formData.is_trending,
                is_seasonal: formData.is_seasonal,
                status: formData.status,
                event_date: formData.start_date, // fallback for legacy column
                start_date: formData.start_date || null,
                end_date: formData.end_date || null,
                start_time: formData.start_time || null,
                end_time: formData.end_time || null,
                max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
                destination_id: formData.destination_id === "none" || !formData.destination_id ? null : formData.destination_id,
            } as never).eq("id", event.id);

            if (error) {
                console.error("Update error:", error);
                toast.error("Failed to update event: " + error.message);
                isSubmittingRef.current = false;
                setIsSubmitting(false);
                return;
            }

            toast.success("Event updated successfully!");
            setSubmitSuccess(false);
            onOpenChange(false);
            onSuccess();
        } catch (error) {
            console.error("Submit error:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
            isSubmittingRef.current = false;
        }
    }, [event, formData, onSuccess, onOpenChange]);

    const updateField = useCallback(<K extends keyof EventFormData>(
        field: K,
        value: EventFormData[K]
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    if (!event) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        {submitSuccess ? (
                            <>
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                Saved Successfully!
                            </>
                        ) : (
                            <>
                                <Edit className="h-5 w-5 text-primary" />
                                Edit Event
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {submitSuccess
                            ? "Your changes have been saved."
                            : "Update event details. Changes will be reflected immediately."}
                    </DialogDescription>
                </DialogHeader>

                {submitSuccess ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="flex flex-col items-center gap-3">
                            <CheckCircle className="h-16 w-16 text-green-500 animate-pulse" />
                            <p className="text-lg font-medium">Changes Saved!</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Image Upload Section */}
                        <div className="space-y-3">
                            <Label className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                Event Image
                            </Label>
                            <div className="flex flex-col gap-3">
                                {imageLoading && !imagePreview ? (
                                    <div className="w-full h-48 rounded-lg border bg-muted flex items-center justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        <span className="ml-2 text-sm text-muted-foreground">Loading preview...</span>
                                    </div>
                                ) : imagePreview ? (
                                    <div className="relative w-full h-48 rounded-lg overflow-hidden border bg-muted">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            crossOrigin="anonymous"
                                            onLoad={() => setImageLoading(false)}
                                            onError={() => {
                                                setImagePreview(null);
                                                setImageLoading(false);
                                                toast.error("Could not load image from this URL.");
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8"
                                            onClick={removeImage}
                                            disabled={isUploading}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {isUploading ? (
                                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                            ) : (
                                                <>
                                                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                                    <p className="text-sm text-muted-foreground">Click to upload image</p>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={isUploading}
                                        />
                                    </label>
                                )}
                                <Input
                                    placeholder="Enter image URL directly..."
                                    value={formData.image_url}
                                    onChange={(e) => handleImageUrlInput(e.target.value)}
                                    disabled={isUploading}
                                />
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Event Name <span className="text-destructive">*</span></Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Summer Music Festival"
                                    value={formData.name}
                                    onChange={(e) => updateField("name", e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    placeholder="e.g., Uhuru Gardens, Nairobi"
                                    value={formData.location}
                                    onChange={(e) => updateField("location", e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="destination">Linked Destination</Label>
                                <Select
                                    value={formData.destination_id}
                                    onValueChange={(val) => updateField("destination_id", val)}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="None" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {destinations?.map((d) => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Price (KES) <span className="text-destructive">*</span></Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    step="100"
                                    placeholder="e.g., 2000"
                                    value={formData.price}
                                    onChange={(e) => updateField("price", e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe this event..."
                                rows={3}
                                value={formData.description}
                                onChange={(e) => updateField("description", e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Dates and Times */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start_date">Start Date <span className="text-destructive">*</span></Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => updateField("start_date", e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">End Date</Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => updateField("end_date", e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="start_time">Start Time</Label>
                                <Input
                                    id="start_time"
                                    type="time"
                                    value={formData.start_time}
                                    onChange={(e) => updateField("start_time", e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_time">End Time</Label>
                                <Input
                                    id="end_time"
                                    type="time"
                                    value={formData.end_time}
                                    onChange={(e) => updateField("end_time", e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="max_participants" className="flex items-center gap-2">
                                <Users className="h-3 w-3" /> Max Participants
                            </Label>
                            <Input
                                id="max_participants"
                                type="number"
                                min="1"
                                placeholder="e.g., 500"
                                value={formData.max_participants}
                                onChange={(e) => updateField("max_participants", e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Categories */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Tag className="h-3 w-3" /> Categories
                            </Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {formData.categories.map((cat) => (
                                    <Badge
                                        key={cat}
                                        variant="secondary"
                                        className="cursor-pointer hover:bg-destructive/20"
                                        onClick={() => removeCategory(cat)}
                                    >
                                        {cat} <X className="h-3 w-3 ml-1" />
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Select
                                    value={categoryInput}
                                    onValueChange={(val) => addCategory(val)}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Add category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORY_OPTIONS.filter(
                                            (c) => !formData.categories.includes(c)
                                        ).map((cat) => (
                                            <SelectItem key={cat} value={cat}>
                                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value: "draft" | "published" | "archived") =>
                                        updateField("status", value)
                                    }
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Feature Toggles */}
                        <div className="flex flex-wrap gap-6">
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="featured"
                                    checked={formData.is_featured}
                                    onCheckedChange={(checked) => updateField("is_featured", checked)}
                                    disabled={isSubmitting}
                                />
                                <Label htmlFor="featured" className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-yellow-500" /> Featured
                                </Label>
                            </div>

                            <div className="flex items-center gap-2">
                                <Switch
                                    id="trending"
                                    checked={formData.is_trending}
                                    onCheckedChange={(checked) => updateField("is_trending", checked)}
                                    disabled={isSubmitting}
                                />
                                <Label htmlFor="trending" className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3 text-green-500" /> Trending
                                </Label>
                            </div>

                            <div className="flex items-center gap-2">
                                <Switch
                                    id="seasonal"
                                    checked={formData.is_seasonal}
                                    onCheckedChange={(checked) => updateField("is_seasonal", checked)}
                                    disabled={isSubmitting}
                                />
                                <Label htmlFor="seasonal" className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-blue-500" /> Seasonal
                                </Label>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isSubmitting || isUploading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || isUploading}
                                className="min-w-[140px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
