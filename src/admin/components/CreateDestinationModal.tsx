import { useState, useCallback, useRef } from "react";
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
    MapPin,
    DollarSign,
    Clock,
    Tag,
    Star,
    TrendingUp,
    CheckCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CreateDestinationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

interface DestinationFormData {
    name: string;
    location: string;
    description: string;
    categories: string[];
    estimated_cost: string;
    duration: string;
    image_url: string;
    is_featured: boolean;
    is_popular: boolean;
    popularity_badge: string;
    status: "draft" | "published";
}

const CATEGORY_OPTIONS = [
    "beach",
    "mountain",
    "city",
    "adventure",
    "cultural",
    "wildlife",
    "romantic",
    "family",
    "luxury",
    "budget",
];

const DURATION_OPTIONS = [
    "1 Day",
    "2 Days",
    "3 Days",
    "4-5 Days",
    "1 Week",
    "2 Weeks",
    "3+ Weeks",
];

const BADGE_OPTIONS = ["", "Trending", "Hot", "New", "Best Value", "Popular"];

const initialFormData: DestinationFormData = {
    name: "",
    location: "",
    description: "",
    categories: [],
    estimated_cost: "",
    duration: "",
    image_url: "",
    is_featured: false,
    is_popular: false,
    popularity_badge: "",
    status: "draft",
};

export default function CreateDestinationModal({
    open,
    onOpenChange,
    onSuccess,
}: CreateDestinationModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [categoryInput, setCategoryInput] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [formData, setFormData] = useState<DestinationFormData>(initialFormData);

    // Prevent duplicate submissions
    const isSubmittingRef = useRef(false);

    const resetForm = useCallback(() => {
        setFormData(initialFormData);
        setImagePreview(null);
        setCategoryInput("");
        setUploadProgress(0);
        setSubmitSuccess(false);
    }, []);

    const handleClose = useCallback(() => {
        if (isSubmitting || isUploading) return; // Prevent closing during operations
        resetForm();
        onOpenChange(false);
    }, [isSubmitting, isUploading, resetForm, onOpenChange]);

    const handleImageUpload = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;

            // Validate file type
            if (!file.type.startsWith("image/")) {
                toast.error("Please select an image file");
                return;
            }

            // Validate file size (max 10MB before compression)
            if (file.size > 10 * 1024 * 1024) {
                toast.error("Image must be less than 10MB");
                return;
            }

            setIsUploading(true);
            setUploadProgress(10);

            try {
                // Show immediate preview while compressing
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreview(reader.result as string);
                };
                reader.readAsDataURL(file);

                setUploadProgress(25);

                // Compress the image
                const compressedFile = await compressImage(file, {
                    maxWidth: 1920,
                    maxHeight: 1080,
                    quality: 0.85,
                });

                setUploadProgress(50);

                // Create a unique file name
                const fileExt = "jpg"; // We always convert to jpg after compression
                const fileName = `destination_${Date.now()}.${fileExt}`;
                const filePath = `destinations/${fileName}`;

                // Upload to Supabase Storage
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

                // Get public URL
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
                // Delay hiding progress for better UX
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
        if (url) {
            setImagePreview(url);
        } else {
            setImagePreview(null);
        }
    }, []);

    const removeImage = useCallback(() => {
        setFormData((prev) => ({ ...prev, image_url: "" }));
        setImagePreview(null);
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

        // Prevent duplicate submissions
        if (isSubmittingRef.current) {
            console.log("[Submit] Already submitting, ignoring duplicate");
            return;
        }

        // Validation
        if (!formData.name.trim()) {
            toast.error("Destination name is required");
            return;
        }
        if (!formData.estimated_cost || parseFloat(formData.estimated_cost) <= 0) {
            toast.error("Please enter a valid price");
            return;
        }

        isSubmittingRef.current = true;
        setIsSubmitting(true);

        try {
            const { error } = await supabase.from("destinations").insert({
                name: formData.name.trim(),
                location: formData.location.trim() || null,
                description: formData.description.trim() || null,
                categories: formData.categories.length > 0 ? formData.categories : null,
                estimated_cost: parseFloat(formData.estimated_cost),
                duration: formData.duration || null,
                image_url: formData.image_url || null,
                is_featured: formData.is_featured,
                is_popular: formData.is_popular,
                popularity_badge: formData.popularity_badge || null,
                status: formData.status,
            } as never);

            if (error) {
                console.error("Insert error:", error);
                toast.error("Failed to create destination: " + error.message);
                isSubmittingRef.current = false;
                setIsSubmitting(false);
                return;
            }

            toast.success("Destination created successfully!");
            resetForm();
            onOpenChange(false);
            onSuccess();
        } catch (error) {
            console.error("Submit error:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
            isSubmittingRef.current = false;
        }
    }, [formData, resetForm, onSuccess, onOpenChange]);

    // Memoized update handlers to prevent re-renders
    const updateField = useCallback(<K extends keyof DestinationFormData>(
        field: K,
        value: DestinationFormData[K]
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        {submitSuccess ? (
                            <>
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                Created Successfully!
                            </>
                        ) : (
                            <>
                                <MapPin className="h-5 w-5 text-primary" />
                                Create New Destination
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {submitSuccess
                            ? "Your destination has been added to the catalog."
                            : "Add a new destination to the catalog. Fill in all required fields marked with *."}
                    </DialogDescription>
                </DialogHeader>

                {submitSuccess ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="flex flex-col items-center gap-3">
                            <CheckCircle className="h-16 w-16 text-green-500 animate-pulse" />
                            <p className="text-lg font-medium">Destination Added!</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Image Upload Section */}
                        <div className="space-y-3">
                            <Label className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                Destination Image
                            </Label>
                            <div className="flex flex-col gap-3">
                                {imagePreview ? (
                                    <div className="relative w-full h-48 rounded-lg overflow-hidden border bg-muted">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            onError={() => {
                                                setImagePreview(null);
                                                toast.error("Failed to load image preview");
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
                                        {isUploading && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <div className="w-3/4 space-y-2">
                                                    <Progress value={uploadProgress} className="h-2" />
                                                    <p className="text-white text-sm text-center">
                                                        Uploading... {uploadProgress}%
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {isUploading ? (
                                                <>
                                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                                    <p className="text-sm text-muted-foreground mt-2">
                                                        Compressing & uploading...
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                                    <p className="text-sm text-muted-foreground">
                                                        Click to upload or drag and drop
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        PNG, JPG up to 10MB (auto-compressed)
                                                    </p>
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
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">OR</span>
                                </div>
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
                                <Label htmlFor="name" className="flex items-center gap-1">
                                    Destination Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Maasai Mara Safari"
                                    value={formData.name}
                                    onChange={(e) => updateField("name", e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location" className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" /> Location
                                </Label>
                                <Input
                                    id="location"
                                    placeholder="e.g., Narok County, Kenya"
                                    value={formData.location}
                                    onChange={(e) => updateField("location", e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe this destination, what makes it special..."
                                rows={3}
                                value={formData.description}
                                onChange={(e) => updateField("description", e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Price and Duration */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price" className="flex items-center gap-2">
                                    <DollarSign className="h-3 w-3" /> Price (KES){" "}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    step="100"
                                    placeholder="e.g., 45000"
                                    value={formData.estimated_cost}
                                    onChange={(e) => updateField("estimated_cost", e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Clock className="h-3 w-3" /> Duration
                                </Label>
                                <Select
                                    value={formData.duration}
                                    onValueChange={(value) => updateField("duration", value)}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select duration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DURATION_OPTIONS.map((d) => (
                                            <SelectItem key={d} value={d}>
                                                {d}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
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

                        {/* Status and Visibility */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value: "draft" | "published") =>
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
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <TrendingUp className="h-3 w-3" /> Popularity Badge
                                </Label>
                                <Select
                                    value={formData.popularity_badge}
                                    onValueChange={(value) => updateField("popularity_badge", value)}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="None" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BADGE_OPTIONS.map((badge) => (
                                            <SelectItem key={badge || "none"} value={badge || "none"}>
                                                {badge || "None"}
                                            </SelectItem>
                                        ))}
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
                                    id="popular"
                                    checked={formData.is_popular}
                                    onCheckedChange={(checked) => updateField("is_popular", checked)}
                                    disabled={isSubmitting}
                                />
                                <Label htmlFor="popular" className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3 text-green-500" /> Popular
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
                                        Creating...
                                    </>
                                ) : (
                                    "Create Destination"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
