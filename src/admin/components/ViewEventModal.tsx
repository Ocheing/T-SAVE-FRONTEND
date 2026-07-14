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
    Clock,
    Users,
} from "lucide-react";
import type { AppEvent } from "@/types/database.types";

interface ViewEventModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: AppEvent | null;
    onEdit?: () => void;
}

export default function ViewEventModal({
    open,
    onOpenChange,
    event,
    onEdit,
}: ViewEventModalProps) {
    if (!event) return null;

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
        });
    };

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatTime = (timeString: string | null) => {
        if (!timeString) return '';
        // Assuming HH:MM or HH:MM:SS format
        try {
            const [hours, minutes] = timeString.split(':');
            const date = new Date();
            date.setHours(parseInt(hours, 10));
            date.setMinutes(parseInt(minutes, 10));
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } catch {
            return timeString;
        }
    };

    const displayStartDate = event.start_date || event.event_date;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Eye className="h-5 w-5 text-primary" />
                        Event Details
                    </DialogTitle>
                    <DialogDescription>
                        Complete information about this event
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Image Section */}
                    <div className="relative w-full h-56 rounded-lg overflow-hidden bg-muted">
                        {event.image_url ? (
                            <img
                                src={event.image_url}
                                alt={event.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <ImageIcon className="w-12 h-12" />
                            </div>
                        )}
                        <div className="absolute top-3 left-3 flex gap-2">
                            {getStatusBadge(event.status)}
                            {event.is_featured && (
                                <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 gap-1">
                                    <Star className="w-3 h-3 fill-yellow-500" /> Featured
                                </Badge>
                            )}
                            {event.is_trending && (
                                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
                                    <TrendingUp className="w-3 h-3" /> Trending
                                </Badge>
                            )}
                            {event.is_seasonal && (
                                <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1">
                                    <Calendar className="w-3 h-3" /> Seasonal
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div>
                        <h2 className="text-2xl font-bold mb-2">{event.name}</h2>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location || 'Location not specified'}</span>
                        </div>
                    </div>

                    {/* Description */}
                    {event.description && (
                        <Card className="p-4 bg-muted/30">
                            <h3 className="font-semibold mb-2">Description</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                                {event.description}
                            </p>
                        </Card>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="p-4 text-center">
                            <DollarSign className="h-5 w-5 mx-auto mb-2 text-primary" />
                            <div className="text-lg font-bold text-primary">
                                {event.price ? `KES ${Number(event.price).toLocaleString()}` : 'Free'}
                            </div>
                            <div className="text-xs text-muted-foreground">Price</div>
                        </Card>
                        <Card className="p-4 text-center">
                            <Calendar className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                            <div className="text-sm font-bold">
                                {formatDate(displayStartDate)}
                            </div>
                            <div className="text-xs text-muted-foreground">Start Date</div>
                        </Card>
                        <Card className="p-4 text-center">
                            <Clock className="h-5 w-5 mx-auto mb-2 text-orange-500" />
                            <div className="text-sm font-bold">
                                {event.start_time ? formatTime(event.start_time) : 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground">Start Time</div>
                        </Card>
                        <Card className="p-4 text-center">
                            <Users className="h-5 w-5 mx-auto mb-2 text-green-500" />
                            <div className="text-lg font-bold">
                                {event.max_participants || 'Uncapped'}
                            </div>
                            <div className="text-xs text-muted-foreground">Capacity</div>
                        </Card>
                    </div>

                    {/* Dates & Times extended */}
                    <Card className="p-4 bg-muted/30">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4" /> Schedule Details
                        </h3>
                        <div className="grid grid-cols-2 gap-y-3 text-sm">
                            <div>
                                <span className="text-muted-foreground block text-xs">Start Date</span>
                                <span className="font-medium">{formatDate(displayStartDate)}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-xs">End Date</span>
                                <span className="font-medium">{formatDate(event.end_date)}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-xs">Start Time</span>
                                <span className="font-medium">{event.start_time ? formatTime(event.start_time) : 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-xs">End Time</span>
                                <span className="font-medium">{event.end_time ? formatTime(event.end_time) : 'N/A'}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Categories */}
                    {event.categories && event.categories.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <Tag className="h-4 w-4" /> Categories
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {event.categories.map((cat, idx) => (
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
                                    {formatDateTime(event.created_at)}
                                </div>
                            </div>
                            <div>
                                <div className="text-muted-foreground flex items-center gap-1 mb-1">
                                    <Calendar className="h-3 w-3" /> Last Updated
                                </div>
                                <div className="font-medium">
                                    {formatDateTime(event.updated_at)}
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
                                Edit Event
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
