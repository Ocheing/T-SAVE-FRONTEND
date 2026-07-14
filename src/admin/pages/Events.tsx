import { useEffect, useState, useCallback, useMemo, memo, useRef } from "react";
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit,
    Trash,
    Eye,
    CalendarDays,
    Tag,
    Clock,
    MapPin,
    Image as ImageIcon,
    CheckCircle,
    Archive,
    FileText,
    RefreshCw,
    Star,
    TrendingUp,
    Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { EVENTS_QUERY_KEYS } from "@/hooks/useEvents";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import CreateEventModal from "../components/CreateEventModal";
import EditEventModal from "../components/EditEventModal";
import ViewEventModal from "../components/ViewEventModal";
import type { AppEvent } from "@/types/database.types";

type StatusFilter = 'all' | 'published' | 'draft' | 'archived';
type FeatureFilter = 'all' | 'featured' | 'trending' | 'seasonal';

// Memoized status badge component
const StatusBadge = memo(({ status }: { status: string | null }) => {
    switch (status) {
        case 'published':
            return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 gap-1.5"><CheckCircle className="w-3 h-3" /> Published</Badge>;
        case 'draft':
            return <Badge variant="secondary" className="gap-1.5"><FileText className="w-3 h-3" /> Draft</Badge>;
        case 'archived':
            return <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20 gap-1.5"><Archive className="w-3 h-3" /> Archived</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
});
StatusBadge.displayName = 'StatusBadge';

const EventRow = memo(({
    item,
    onView,
    onEdit,
    onDelete,
    onUpdateStatus,
    onToggleFeatured,
    onToggleTrending,
    onToggleSeasonal,
}: {
    item: AppEvent;
    onView: (e: AppEvent) => void;
    onEdit: (e: AppEvent) => void;
    onDelete: (e: AppEvent) => void;
    onUpdateStatus: (id: string, status: 'draft' | 'published' | 'archived') => void;
    onToggleFeatured: (e: AppEvent) => void;
    onToggleTrending: (e: AppEvent) => void;
    onToggleSeasonal: (e: AppEvent) => void;
}) => {
    const displayDate = item.start_date || item.event_date;
    
    return (
        <TableRow className="hover:bg-muted/20 group">
            <TableCell>
                <div className="flex items-center gap-4">
                    <div className="h-12 w-16 rounded-md overflow-hidden bg-slate-100 flex-shrink-0 relative">
                        {item.image_url ? (
                            <img
                                src={item.image_url}
                                alt={item.name}
                                className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                loading="lazy"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-300">
                                <ImageIcon className="w-5 h-5" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm truncate">{item.name}</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{item.location || 'No location'}</span>
                        </div>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <StatusBadge status={item.status} />
            </TableCell>
            <TableCell className="font-mono text-sm">
                {item.price ? `KES ${Number(item.price).toLocaleString()}` : 'Free'}
            </TableCell>
            <TableCell>
                <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CalendarDays className="w-3 h-3" />
                        {displayDate ? new Date(displayDate).toLocaleDateString() : 'N/A'}
                    </div>
                    {item.start_time && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {item.start_time}
                        </div>
                    )}
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-1 text-xs">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    {item.max_participants || 'Uncapped'}
                </div>
            </TableCell>
            <TableCell>
                <div className="flex gap-1">
                    {item.is_featured && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-500/30 h-5 text-[10px]">
                            <Star className="w-2.5 h-2.5 mr-0.5 fill-yellow-500" />
                        </Badge>
                    )}
                    {item.is_trending && (
                        <Badge variant="outline" className="text-green-600 border-green-500/30 h-5 text-[10px]">
                            <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                        </Badge>
                    )}
                    {item.is_seasonal && (
                        <Badge variant="outline" className="text-blue-600 border-blue-500/30 h-5 text-[10px]">
                            <CalendarDays className="w-2.5 h-2.5 mr-0.5" />
                        </Badge>
                    )}
                    {!item.is_featured && !item.is_trending && !item.is_seasonal && (
                        <span className="text-xs text-muted-foreground">—</span>
                    )}
                </div>
            </TableCell>
            <TableCell className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem className="gap-2" onClick={() => onView(item)}>
                            <Eye className="h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={() => onEdit(item)}>
                            <Edit className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="gap-2"
                            onClick={() => onUpdateStatus(item.id, item.status === 'published' ? 'draft' : 'published')}
                        >
                            <Tag className="h-4 w-4" />
                            {item.status === 'published' ? 'Set as Draft' : 'Publish'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="gap-2"
                            onClick={() => onToggleFeatured(item)}
                        >
                            <Star className={`h-4 w-4 ${item.is_featured ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                            {item.is_featured ? 'Remove Featured' : 'Mark Featured'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="gap-2"
                            onClick={() => onToggleTrending(item)}
                        >
                            <TrendingUp className={`h-4 w-4 ${item.is_trending ? 'text-green-500' : ''}`} />
                            {item.is_trending ? 'Remove Trending' : 'Mark Trending'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="gap-2"
                            onClick={() => onToggleSeasonal(item)}
                        >
                            <CalendarDays className={`h-4 w-4 ${item.is_seasonal ? 'text-blue-500' : ''}`} />
                            {item.is_seasonal ? 'Remove Seasonal' : 'Mark Seasonal'}
                        </DropdownMenuItem>
                        {item.status !== 'archived' && (
                            <DropdownMenuItem className="gap-2" onClick={() => onUpdateStatus(item.id, 'archived')}>
                                <Archive className="h-4 w-4" /> Archive
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                            onClick={() => onDelete(item)}
                        >
                            <Trash className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
});
EventRow.displayName = 'EventRow';

export default function EventsManagement() {
    const queryClient = useQueryClient();
    const [events, setEvents] = useState<AppEvent[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [featureFilter, setFeatureFilter] = useState<FeatureFilter>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const invalidateQueryCache = useCallback(() => {
        return Promise.all([
            queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.all }),
            queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.published }),
            queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.recommended }),
            queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.dashboard }),
        ]);
    }, [queryClient]);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<AppEvent | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const isMountedRef = useRef(true);
    const channelIdRef = useRef(`admin-events-${Date.now()}`);

    const fetchEvents = useCallback(async (showRefreshToast = false) => {
        if (showRefreshToast) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('created_at', { ascending: false });

            if (!isMountedRef.current) return;

            if (error) {
                toast.error("Failed to load events: " + error.message);
            } else {
                setEvents(data || []);
                if (showRefreshToast) {
                    toast.success("Events refreshed");
                }
            }
        } catch (err) {
            if (!isMountedRef.current) return;
            console.error("Fetch error:", err);
            toast.error("Failed to load events");
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        }
    }, []);

    useEffect(() => {
        fetchEvents();
        return () => {
            isMountedRef.current = false;
        };
    }, [fetchEvents]);

    useEffect(() => {
        const channelName = channelIdRef.current;
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'events',
                },
                (payload) => {
                    if (!isMountedRef.current) return;
                    console.log('[Admin Realtime] Event change:', payload.eventType);

                    if (payload.eventType === 'INSERT' && payload.new) {
                        setEvents(prev => [payload.new as AppEvent, ...prev]);
                    } else if (payload.eventType === 'UPDATE' && payload.new) {
                        setEvents(prev =>
                            prev.map(e => e.id === (payload.new as AppEvent).id ? payload.new as AppEvent : e)
                        );
                    } else if (payload.eventType === 'DELETE' && payload.old) {
                        setEvents(prev =>
                            prev.filter(e => e.id !== (payload.old as AppEvent).id)
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const optimisticUpdate = useCallback((id: string, updates: Partial<AppEvent>) => {
        setEvents(prev =>
            prev.map(e => e.id === id ? { ...e, ...updates } : e)
        );
    }, []);

    const handleUpdateStatus = useCallback(async (id: string, newStatus: 'draft' | 'published' | 'archived') => {
        const prevEvent = events.find(e => e.id === id);
        optimisticUpdate(id, { status: newStatus });

        const { error } = await supabase
            .from('events')
            .update({ status: newStatus } as never)
            .eq('id', id);

        if (error) {
            toast.error("Update failed: " + error.message);
            if (prevEvent) optimisticUpdate(id, { status: prevEvent.status });
        } else {
            toast.success(`Event ${newStatus} successfully`);
            invalidateQueryCache();
        }
    }, [events, optimisticUpdate, invalidateQueryCache]);

    const handleToggleFeatured = useCallback(async (event: AppEvent) => {
        const newValue = !event.is_featured;
        optimisticUpdate(event.id, { is_featured: newValue });

        const { error } = await supabase
            .from('events')
            .update({ is_featured: newValue } as never)
            .eq('id', event.id);

        if (error) {
            toast.error("Update failed: " + error.message);
            optimisticUpdate(event.id, { is_featured: event.is_featured });
        } else {
            toast.success(newValue ? "Marked as featured" : "Removed from featured");
            invalidateQueryCache();
        }
    }, [optimisticUpdate, invalidateQueryCache]);

    const handleToggleTrending = useCallback(async (event: AppEvent) => {
        const newValue = !event.is_trending;
        optimisticUpdate(event.id, { is_trending: newValue });

        const { error } = await supabase
            .from('events')
            .update({ is_trending: newValue } as never)
            .eq('id', event.id);

        if (error) {
            toast.error("Update failed: " + error.message);
            optimisticUpdate(event.id, { is_trending: event.is_trending });
        } else {
            toast.success(newValue ? "Marked as trending" : "Removed from trending");
            invalidateQueryCache();
        }
    }, [optimisticUpdate, invalidateQueryCache]);

    const handleToggleSeasonal = useCallback(async (event: AppEvent) => {
        const newValue = !event.is_seasonal;
        optimisticUpdate(event.id, { is_seasonal: newValue });

        const { error } = await supabase
            .from('events')
            .update({ is_seasonal: newValue } as never)
            .eq('id', event.id);

        if (error) {
            toast.error("Update failed: " + error.message);
            optimisticUpdate(event.id, { is_seasonal: event.is_seasonal });
        } else {
            toast.success(newValue ? "Marked as seasonal" : "Removed from seasonal");
            invalidateQueryCache();
        }
    }, [optimisticUpdate, invalidateQueryCache]);

    const handleViewClick = useCallback((event: AppEvent) => {
        setSelectedEvent(event);
        setIsViewModalOpen(true);
    }, []);

    const handleEditClick = useCallback((event: AppEvent) => {
        setSelectedEvent(event);
        setIsEditModalOpen(true);
    }, []);

    const handleDeleteClick = useCallback((event: AppEvent) => {
        setEventToDelete(event);
        setDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!eventToDelete) return;

        setIsDeleting(true);

        const deletedEvent = eventToDelete;
        setEvents(prev => prev.filter(e => e.id !== deletedEvent.id));

        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', deletedEvent.id);

        if (error) {
            toast.error("Delete failed: " + error.message);
            setEvents(prev => [deletedEvent, ...prev]);
        } else {
            toast.success("Event deleted successfully");
            invalidateQueryCache();
        }

        setIsDeleting(false);
        setDeleteDialogOpen(false);
        setEventToDelete(null);
    }, [eventToDelete, invalidateQueryCache]);

    const handleEditFromView = useCallback(() => {
        setIsViewModalOpen(false);
        if (selectedEvent) {
            setIsEditModalOpen(true);
        }
    }, [selectedEvent]);

    const handleCreateSuccess = useCallback(() => {
        invalidateQueryCache();
    }, [invalidateQueryCache]);

    const handleEditSuccess = useCallback(() => {
        invalidateQueryCache();
    }, [invalidateQueryCache]);

    const filtered = useMemo(() => {
        return events.filter(e => {
            const matchesSearch =
                e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.location?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus =
                statusFilter === 'all' || e.status === statusFilter;

            const matchesFeature =
                featureFilter === 'all' ||
                (featureFilter === 'featured' && e.is_featured) ||
                (featureFilter === 'trending' && e.is_trending) ||
                (featureFilter === 'seasonal' && e.is_seasonal);

            return matchesSearch && matchesStatus && matchesFeature;
        });
    }, [events, searchTerm, statusFilter, featureFilter]);

    const stats = useMemo(() => ({
        total: events.length,
        published: events.filter(e => e.status === 'published').length,
        featured: events.filter(e => e.is_featured).length,
        trending: events.filter(e => e.is_trending).length,
    }), [events]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Events Management</h2>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        Manage events, capacity, and scheduling. {stats.total} total events.
                    </p>
                </div>
                <Button
                    className="gap-2 shadow-lg shadow-primary/20 bg-primary/90 hover:bg-primary"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <Plus className="h-4 w-4" />
                    Create Event
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <CalendarDays className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <div className="text-xs text-muted-foreground">Total Events</div>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{stats.published}</div>
                        <div className="text-xs text-muted-foreground">Published</div>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/10">
                        <Star className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{stats.featured}</div>
                        <div className="text-xs text-muted-foreground">Featured</div>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{stats.trending}</div>
                        <div className="text-xs text-muted-foreground">Trending</div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search events..."
                        className="pl-10 ring-1 ring-border"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                    <Select value={statusFilter} onValueChange={(v: StatusFilter) => setStatusFilter(v)}>
                        <SelectTrigger className="w-[130px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={featureFilter} onValueChange={(v: FeatureFilter) => setFeatureFilter(v)}>
                        <SelectTrigger className="w-[130px]">
                            <Star className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Features" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Features</SelectItem>
                            <SelectItem value="featured">Featured Only</SelectItem>
                            <SelectItem value="trending">Trending Only</SelectItem>
                            <SelectItem value="seasonal">Seasonal Only</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => fetchEvents(true)}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Table */}
            <Card className="border-none shadow-md overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="w-[300px]">Event</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Price (KES)</TableHead>
                            <TableHead>Date / Time</TableHead>
                            <TableHead>Capacity</TableHead>
                            <TableHead>Features</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={7}><div className="h-12 bg-muted/50 animate-pulse rounded-lg m-1"></div></TableCell>
                                </TableRow>
                            ))
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-64 text-center text-muted-foreground">
                                    {events.length === 0 ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <CalendarDays className="h-12 w-12 text-muted-foreground/50" />
                                            <p>No events yet.</p>
                                            <Button
                                                variant="outline"
                                                onClick={() => setIsCreateModalOpen(true)}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Create your first event
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <p>No events match your filters.</p>
                                            <Button
                                                variant="link"
                                                onClick={() => {
                                                    setSearchTerm('');
                                                    setStatusFilter('all');
                                                    setFeatureFilter('all');
                                                }}
                                            >
                                                Clear filters
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((item) => (
                                <EventRow
                                    key={item.id}
                                    item={item}
                                    onView={handleViewClick}
                                    onEdit={handleEditClick}
                                    onDelete={handleDeleteClick}
                                    onUpdateStatus={handleUpdateStatus}
                                    onToggleFeatured={handleToggleFeatured}
                                    onToggleTrending={handleToggleTrending}
                                    onToggleSeasonal={handleToggleSeasonal}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Pagination info */}
            {filtered.length > 0 && (
                <div className="text-sm text-muted-foreground text-center">
                    Showing {filtered.length} of {events.length} events
                </div>
            )}

            {/* Create Event Modal */}
            <CreateEventModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                onSuccess={handleCreateSuccess}
            />

            {/* Edit Event Modal */}
            <EditEventModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                onSuccess={handleEditSuccess}
                event={selectedEvent}
            />

            {/* View Event Modal */}
            <ViewEventModal
                open={isViewModalOpen}
                onOpenChange={setIsViewModalOpen}
                event={selectedEvent}
                onEdit={handleEditFromView}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Event</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{eventToDelete?.name}"?
                            This action cannot be undone and will permanently remove the event from the catalog.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
