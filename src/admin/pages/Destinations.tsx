import { useEffect, useState, useCallback, useMemo, memo, useRef } from "react";
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit,
    Trash,
    Eye,
    Globe,
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
} from "lucide-react";
import { supabase } from "@/lib/supabase";
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
import CreateDestinationModal from "../components/CreateDestinationModal";
import EditDestinationModal from "../components/EditDestinationModal";
import ViewDestinationModal from "../components/ViewDestinationModal";
import type { Destination } from "@/types/database.types";

type StatusFilter = 'all' | 'published' | 'draft' | 'archived';
type FeatureFilter = 'all' | 'featured' | 'popular';

// Memoized status badge component to prevent re-renders
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

// Memoized table row to prevent unnecessary re-renders
const DestinationRow = memo(({
    item,
    onView,
    onEdit,
    onDelete,
    onUpdateStatus,
    onToggleFeatured,
    onTogglePopular,
}: {
    item: Destination;
    onView: (d: Destination) => void;
    onEdit: (d: Destination) => void;
    onDelete: (d: Destination) => void;
    onUpdateStatus: (id: string, status: 'draft' | 'published' | 'archived') => void;
    onToggleFeatured: (d: Destination) => void;
    onTogglePopular: (d: Destination) => void;
}) => {
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
                KES {Number(item.estimated_cost).toLocaleString()}
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-1.5 text-xs">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    {item.duration || 'N/A'}
                </div>
            </TableCell>
            <TableCell>
                <div className="flex flex-wrap gap-1 max-w-[150px]">
                    {item.categories?.slice(0, 2).map((cat, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 h-4 font-normal lowercase">
                            {cat}
                        </Badge>
                    ))}
                    {item.categories && item.categories.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">+{item.categories.length - 2}</span>
                    )}
                </div>
            </TableCell>
            <TableCell>
                <div className="flex gap-1">
                    {item.is_featured && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-500/30 h-5 text-[10px]">
                            <Star className="w-2.5 h-2.5 mr-0.5 fill-yellow-500" />
                        </Badge>
                    )}
                    {item.is_popular && (
                        <Badge variant="outline" className="text-green-600 border-green-500/30 h-5 text-[10px]">
                            <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                        </Badge>
                    )}
                    {!item.is_featured && !item.is_popular && (
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
                            onClick={() => onTogglePopular(item)}
                        >
                            <TrendingUp className={`h-4 w-4 ${item.is_popular ? 'text-green-500' : ''}`} />
                            {item.is_popular ? 'Remove Popular' : 'Mark Popular'}
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
DestinationRow.displayName = 'DestinationRow';

export default function DestinationsManagement() {
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [featureFilter, setFeatureFilter] = useState<FeatureFilter>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [destinationToDelete, setDestinationToDelete] = useState<Destination | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Track if component is mounted to prevent state updates after unmount
    const isMountedRef = useRef(true);

    const fetchDestinations = useCallback(async (showRefreshToast = false) => {
        if (showRefreshToast) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        try {
            const { data, error } = await supabase
                .from('destinations')
                .select('*')
                .order('created_at', { ascending: false });

            if (!isMountedRef.current) return;

            if (error) {
                toast.error("Failed to load destinations: " + error.message);
            } else {
                setDestinations(data || []);
                if (showRefreshToast) {
                    toast.success("Destinations refreshed");
                }
            }
        } catch (err) {
            if (!isMountedRef.current) return;
            console.error("Fetch error:", err);
            toast.error("Failed to load destinations");
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        }
    }, []);

    // Initial load only
    useEffect(() => {
        fetchDestinations();

        return () => {
            isMountedRef.current = false;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Single real-time subscription for the entire page
    useEffect(() => {
        const channel = supabase
            .channel('admin-destinations-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'destinations',
                },
                (payload) => {
                    console.log('[Admin Realtime] Destination change:', payload.eventType);

                    // Update local state optimistically based on event type
                    if (payload.eventType === 'INSERT' && payload.new) {
                        setDestinations(prev => [payload.new as Destination, ...prev]);
                    } else if (payload.eventType === 'UPDATE' && payload.new) {
                        setDestinations(prev =>
                            prev.map(d => d.id === (payload.new as Destination).id ? payload.new as Destination : d)
                        );
                    } else if (payload.eventType === 'DELETE' && payload.old) {
                        setDestinations(prev =>
                            prev.filter(d => d.id !== (payload.old as Destination).id)
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Optimistic update helper
    const optimisticUpdate = useCallback((id: string, updates: Partial<Destination>) => {
        setDestinations(prev =>
            prev.map(d => d.id === id ? { ...d, ...updates } : d)
        );
    }, []);

    const handleUpdateStatus = useCallback(async (id: string, newStatus: 'draft' | 'published' | 'archived') => {
        // Save previous state for rollback
        const prevDestination = destinations.find(d => d.id === id);
        // Optimistic update
        optimisticUpdate(id, { status: newStatus });

        const { error } = await supabase
            .from('destinations')
            .update({ status: newStatus } as never)
            .eq('id', id);

        if (error) {
            toast.error("Update failed: " + error.message);
            // Revert to previous state instead of full refetch
            if (prevDestination) optimisticUpdate(id, { status: prevDestination.status });
        } else {
            toast.success(`Destination ${newStatus} successfully`);
        }
    }, [destinations, optimisticUpdate]);

    const handleToggleFeatured = useCallback(async (destination: Destination) => {
        const newValue = !destination.is_featured;
        optimisticUpdate(destination.id, { is_featured: newValue });

        const { error } = await supabase
            .from('destinations')
            .update({ is_featured: newValue } as never)
            .eq('id', destination.id);

        if (error) {
            toast.error("Update failed: " + error.message);
            optimisticUpdate(destination.id, { is_featured: destination.is_featured });
        } else {
            toast.success(newValue ? "Marked as featured" : "Removed from featured");
        }
    }, [optimisticUpdate]);

    const handleTogglePopular = useCallback(async (destination: Destination) => {
        const newValue = !destination.is_popular;
        optimisticUpdate(destination.id, { is_popular: newValue });

        const { error } = await supabase
            .from('destinations')
            .update({ is_popular: newValue } as never)
            .eq('id', destination.id);

        if (error) {
            toast.error("Update failed: " + error.message);
            optimisticUpdate(destination.id, { is_popular: destination.is_popular });
        } else {
            toast.success(newValue ? "Marked as popular" : "Removed from popular");
        }
    }, [optimisticUpdate]);

    const handleViewClick = useCallback((destination: Destination) => {
        setSelectedDestination(destination);
        setIsViewModalOpen(true);
    }, []);

    const handleEditClick = useCallback((destination: Destination) => {
        setSelectedDestination(destination);
        setIsEditModalOpen(true);
    }, []);

    const handleDeleteClick = useCallback((destination: Destination) => {
        setDestinationToDelete(destination);
        setDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!destinationToDelete) return;

        setIsDeleting(true);

        // Optimistic delete
        const deletedDestination = destinationToDelete;
        setDestinations(prev => prev.filter(d => d.id !== deletedDestination.id));

        const { error } = await supabase
            .from('destinations')
            .delete()
            .eq('id', deletedDestination.id);

        if (error) {
            toast.error("Delete failed: " + error.message);
            // Revert on error
            setDestinations(prev => [deletedDestination, ...prev]);
        } else {
            toast.success("Destination deleted successfully");
        }

        setIsDeleting(false);
        setDeleteDialogOpen(false);
        setDestinationToDelete(null);
    }, [destinationToDelete]);

    const handleEditFromView = useCallback(() => {
        setIsViewModalOpen(false);
        if (selectedDestination) {
            setIsEditModalOpen(true);
        }
    }, [selectedDestination]);

    // Memoized success handlers that don't refetch (realtime handles it)
    const handleCreateSuccess = useCallback(() => {
        // Don't refetch - realtime subscription handles the update
        console.log('[Create] Success - realtime will update the list');
    }, []);

    const handleEditSuccess = useCallback(() => {
        // Don't refetch - realtime subscription handles the update
        console.log('[Edit] Success - realtime will update the list');
    }, []);

    // Memoized filtered destinations
    const filtered = useMemo(() => {
        return destinations.filter(d => {
            const matchesSearch =
                d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.location?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus =
                statusFilter === 'all' || d.status === statusFilter;

            const matchesFeature =
                featureFilter === 'all' ||
                (featureFilter === 'featured' && d.is_featured) ||
                (featureFilter === 'popular' && d.is_popular);

            return matchesSearch && matchesStatus && matchesFeature;
        });
    }, [destinations, searchTerm, statusFilter, featureFilter]);

    // Memoized stats
    const stats = useMemo(() => ({
        total: destinations.length,
        published: destinations.filter(d => d.status === 'published').length,
        featured: destinations.filter(d => d.is_featured).length,
        popular: destinations.filter(d => d.is_popular).length,
    }), [destinations]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Destinations Catalog</h2>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        Manage public trips, pricing, and availability. {stats.total} total destinations.
                    </p>
                </div>
                <Button
                    className="gap-2 shadow-lg shadow-primary/20 bg-primary/90 hover:bg-primary"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <Plus className="h-4 w-4" />
                    Create Destination
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
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
                        <div className="text-2xl font-bold">{stats.popular}</div>
                        <div className="text-xs text-muted-foreground">Popular</div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search destinations..."
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
                            <SelectItem value="popular">Popular Only</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => fetchDestinations(true)}
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
                            <TableHead className="w-[300px]">Destination</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Cost (KES)</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Categories</TableHead>
                            <TableHead>Visibility</TableHead>
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
                                    {destinations.length === 0 ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <MapPin className="h-12 w-12 text-muted-foreground/50" />
                                            <p>No destinations yet.</p>
                                            <Button
                                                variant="outline"
                                                onClick={() => setIsCreateModalOpen(true)}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Create your first destination
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <p>No destinations match your filters.</p>
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
                                <DestinationRow
                                    key={item.id}
                                    item={item}
                                    onView={handleViewClick}
                                    onEdit={handleEditClick}
                                    onDelete={handleDeleteClick}
                                    onUpdateStatus={handleUpdateStatus}
                                    onToggleFeatured={handleToggleFeatured}
                                    onTogglePopular={handleTogglePopular}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Pagination info */}
            {filtered.length > 0 && (
                <div className="text-sm text-muted-foreground text-center">
                    Showing {filtered.length} of {destinations.length} destinations
                </div>
            )}

            {/* Create Destination Modal */}
            <CreateDestinationModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                onSuccess={handleCreateSuccess}
            />

            {/* Edit Destination Modal */}
            <EditDestinationModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                onSuccess={handleEditSuccess}
                destination={selectedDestination}
            />

            {/* View Destination Modal */}
            <ViewDestinationModal
                open={isViewModalOpen}
                onOpenChange={setIsViewModalOpen}
                destination={selectedDestination}
                onEdit={handleEditFromView}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Destination</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{destinationToDelete?.name}"?
                            This action cannot be undone and will permanently remove the destination from the catalog.
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
