import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    MapPin,
    Clock,
    Star,
    TrendingUp,
    Calendar,
    DollarSign,
    Tag,
    CheckCircle,
    FileText,
    Archive,
    Eye,
    Image as ImageIcon,
} from "lucide-react";
import type { Destination } from "@/types/database.types";

interface ViewDestinationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    destination: Destination | null;
    onEdit?: () => void;
}

export default function ViewDestinationModal({
    open,
    onOpenChange,
    destination,
    onEdit,
}: ViewDestinationModalProps) {
    if (!destination) return null;

    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case 'published':
                return (
                    <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 gap-1.5">
                        <CheckCircle className="w-3 h-3" /> Published
                    </Badge>
                );
            case 'draft':
                return (
                    <Badge variant="secondary" className="gap-1.5">
                        <FileText className="w-3 h-3" /> Draft
                    </Badge>
                );
            case 'archived':
                return (
                    <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20 gap-1.5">
                        <Archive className="w-3 h-3" /> Archived
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Eye className="h-5 w-5 text-primary" />
                        Destination Details
                    </DialogTitle>
                    <DialogDescription>
                        Complete information about this destination
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Image Section */}
                    <div className="relative w-full h-56 rounded-lg overflow-hidden bg-muted">
                        {destination.image_url ? (
                            <img
                                src={destination.image_url}
                                alt={destination.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <ImageIcon className="w-12 h-12" />
                            </div>
                        )}
                        <div className="absolute top-3 left-3 flex gap-2">
                            {getStatusBadge(destination.status)}
                            {destination.is_featured && (
                                <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 gap-1">
                                    <Star className="w-3 h-3 fill-yellow-500" /> Featured
                                </Badge>
                            )}
                            {destination.is_popular && (
                                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
                                    <TrendingUp className="w-3 h-3" /> Popular
                                </Badge>
                            )}
                        </div>
                        {destination.popularity_badge && (
                            <div className="absolute top-3 right-3">
                                <Badge className="bg-primary/90 text-primary-foreground">
                                    {destination.popularity_badge}
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* Basic Info */}
                    <div>
                        <h2 className="text-2xl font-bold mb-2">{destination.name}</h2>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{destination.location || 'Location not specified'}</span>
                        </div>
                    </div>

                    {/* Description */}
                    {destination.description && (
                        <Card className="p-4 bg-muted/30">
                            <h3 className="font-semibold mb-2">Description</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {destination.description}
                            </p>
                        </Card>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="p-4 text-center">
                            <DollarSign className="h-5 w-5 mx-auto mb-2 text-primary" />
                            <div className="text-lg font-bold text-primary">
                                KES {Number(destination.estimated_cost).toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">Estimated Cost</div>
                        </Card>
                        <Card className="p-4 text-center">
                            <Clock className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                            <div className="text-lg font-bold">
                                {destination.duration || 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground">Duration</div>
                        </Card>
                        <Card className="p-4 text-center">
                            <Star className="h-5 w-5 mx-auto mb-2 text-yellow-500" />
                            <div className="text-lg font-bold">
                                {destination.rating || '0.0'}
                            </div>
                            <div className="text-xs text-muted-foreground">Rating</div>
                        </Card>
                        <Card className="p-4 text-center">
                            <Eye className="h-5 w-5 mx-auto mb-2 text-green-500" />
                            <div className="text-lg font-bold">
                                {destination.reviews_count || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">Reviews</div>
                        </Card>
                    </div>

                    {/* Categories */}
                    {destination.categories && destination.categories.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <Tag className="h-4 w-4" /> Categories
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {destination.categories.map((cat, idx) => (
                                    <Badge key={idx} variant="secondary" className="capitalize">
                                        {cat}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Timestamps */}
                    <Card className="p-4 bg-muted/30">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="text-muted-foreground flex items-center gap-1 mb-1">
                                    <Calendar className="h-3 w-3" /> Created
                                </div>
                                <div className="font-medium">
                                    {formatDate(destination.created_at)}
                                </div>
                            </div>
                            <div>
                                <div className="text-muted-foreground flex items-center gap-1 mb-1">
                                    <Calendar className="h-3 w-3" /> Last Updated
                                </div>
                                <div className="font-medium">
                                    {formatDate(destination.updated_at)}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                        {onEdit && (
                            <Button onClick={onEdit}>
                                Edit Destination
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
