import { useState } from "react";
import { Receipt, Search, Filter, ArrowUpCircle, ArrowDownCircle, Loader2, Calendar, DollarSign, Tag, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTransactions } from "@/hooks/useTransactions";
import { format } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";

const Transactions = () => {
    const { data: transactions, isLoading } = useTransactions();
    const { formatPrice } = useCurrency();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");

    const filteredTransactions = transactions?.filter((t) => {
        const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === "all" || t.type === filterType;
        return matchesSearch && matchesType;
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="mb-8 animate-fade-in">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Receipt className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold">Transaction History</h1>
                    </div>
                    <p className="text-muted-foreground">Monitor all your savings deposits and withdrawals</p>
                </div>

                {/* Filters */}
                <Card className="p-4 mb-6 shadow-sm border-primary/10 animate-scale-in">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search transactions..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-[150px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="deposit">Deposits</SelectItem>
                                    <SelectItem value="withdrawal">Withdrawals</SelectItem>
                                    <SelectItem value="refund">Refunds</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" onClick={() => { setSearchTerm(""); setFilterType("all"); }}>
                                Reset
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Transactions Table/List */}
                <div className="space-y-3">
                    {!filteredTransactions || filteredTransactions.length === 0 ? (
                        <Card className="p-12 text-center animate-fade-in">
                            <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                            <h3 className="text-lg font-semibold mb-1">No transactions found</h3>
                            <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms.</p>
                        </Card>
                    ) : (
                        filteredTransactions.map((t, index) => (
                            <Card
                                key={t.id}
                                className="p-4 hover:shadow-md transition-all duration-200 group animate-fade-in"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full ${t.type === 'deposit' ? 'bg-green-100 text-green-600' :
                                                t.type === 'withdrawal' ? 'bg-orange-100 text-orange-600' :
                                                    'bg-blue-100 text-blue-600'
                                            }`}>
                                            {t.type === 'deposit' ? (
                                                <ArrowUpCircle className="h-5 w-5" />
                                            ) : t.type === 'withdrawal' ? (
                                                <ArrowDownCircle className="h-5 w-5" />
                                            ) : (
                                                <Info className="h-5 w-5" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm md:text-base capitalize">
                                                {t.description || `${t.type} Transaction`}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(t.created_at), 'MMM dd, yyyy HH:mm')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Tag className="h-3 w-3" />
                                                    ID: {t.id.slice(0, 8)}...
                                                </span>
                                                {t.status && (
                                                    <Badge variant="secondary" className="text-[10px] py-0 h-4 capitalize">
                                                        {t.status}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-bold text-lg ${t.type === 'deposit' ? 'text-green-600' : 'text-orange-600'
                                            }`}>
                                            {t.type === 'deposit' ? '+' : '-'}{formatPrice(t.amount)}
                                        </div>
                                        {t.trip_id && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Goal Savings
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Transactions;
