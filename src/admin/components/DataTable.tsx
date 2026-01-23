import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    isLoading?: boolean;
    emptyMessage?: string;
    className?: string;
}

export function DataTable<T>({
    columns,
    data,
    isLoading,
    emptyMessage = "No data available",
    className,
}: DataTableProps<T>) {
    return (
        <div className={cn("rounded-md border border-border overflow-hidden", className)}>
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        {columns.map((column, index) => (
                            <TableHead key={index} className={column.className}>
                                {column.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                {columns.map((_, j) => (
                                    <TableCell key={j}>
                                        <div className="h-4 bg-muted animate-pulse rounded"></div>
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground italic">
                                {emptyMessage}
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item, i) => (
                            <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                                {columns.map((column, j) => (
                                    <TableCell key={j} className={column.className}>
                                        {typeof column.accessor === "function"
                                            ? column.accessor(item)
                                            : (item[column.accessor] as React.ReactNode)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
