import { useState } from "react";
import { useListOrders, useUpdateOrderStatus, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Filter, Eye } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/lib/language-context";
import { formatPrice } from "@/lib/format-price";

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useT();
  const a = t.admin.ordersPage;

  const [search, setSearch] = useState("");
  const { data: orders, isLoading } = useListOrders();
  const updateStatus = useUpdateOrderStatus();

  const handleStatusChange = (id: number, status: string) => {
    updateStatus.mutate(
      { id, data: { status: status as any } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          toast({ title: a.orderUpdated, description: a.statusChangedTo(status) });
        },
      }
    );
  };

  // Status → translated label
  const statusLabel = (s: string) => {
    switch (s) {
      case "pending":    return a.statusPending;
      case "processing": return a.statusProcessing;
      case "shipped":    return a.statusShipped;
      case "delivered":  return a.statusDelivered;
      case "cancelled":  return a.statusCancelled;
      default:           return s;
    }
  };

  const filtered = search.trim()
    ? (orders ?? []).filter(o =>
        o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        o.orderNumber?.toLowerCase().includes(search.toLowerCase())
      )
    : (orders ?? []);

  return (
    <div className="space-y-6">
      {/* ── Toolbar ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 relative max-w-md w-full">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={a.searchPlaceholder}
            className="ps-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="w-full sm:w-auto gap-2">
          <Filter className="h-4 w-4" />
          {a.filter}
        </Button>
      </div>

      {/* ── Table ────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-display uppercase tracking-wider text-xs">{a.colOrderNum}</TableHead>
              <TableHead className="font-display uppercase tracking-wider text-xs">{a.colDate}</TableHead>
              <TableHead className="font-display uppercase tracking-wider text-xs">{a.colCustomer}</TableHead>
              <TableHead className="font-display uppercase tracking-wider text-xs">{a.colTotal}</TableHead>
              <TableHead className="font-display uppercase tracking-wider text-xs">{a.colStatus}</TableHead>
              <TableHead className="font-display uppercase tracking-wider text-xs text-end">{a.colActions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-40 mt-1" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ms-auto" /></TableCell>
                  </TableRow>
                ))
              : filtered.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(order.createdAt), "MMM d, yyyy")}
                      <span className="block text-xs text-muted-foreground">
                        {format(new Date(order.createdAt), "h:mm a")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                    </TableCell>
                    <TableCell className="font-mono font-medium">{formatPrice(order.total)}</TableCell>
                    <TableCell>
                      <Select
                        defaultValue={order.status}
                        onValueChange={(val) => handleStatusChange(order.id, val)}
                      >
                        <SelectTrigger className={`w-[140px] h-8 text-xs font-display uppercase tracking-wider font-bold ${
                          order.status === "delivered"  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500" :
                          order.status === "processing" ? "border-primary/50 bg-primary/10 text-primary" :
                          order.status === "shipped"    ? "border-blue-500/50 bg-blue-500/10 text-blue-500" :
                          order.status === "cancelled"  ? "border-destructive/50 bg-destructive/10 text-destructive" :
                          "border-amber-500/50 bg-amber-500/10 text-amber-500"
                        }`}>
                          <SelectValue>{statusLabel(order.status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{a.statusPending}</SelectItem>
                          <SelectItem value="processing">{a.statusProcessing}</SelectItem>
                          <SelectItem value="shipped">{a.statusShipped}</SelectItem>
                          <SelectItem value="delivered">{a.statusDelivered}</SelectItem>
                          <SelectItem value="cancelled">{a.statusCancelled}</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-end">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
            }
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
