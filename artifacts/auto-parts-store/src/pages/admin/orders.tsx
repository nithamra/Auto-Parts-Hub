import { useState } from "react";
import { useListOrders, useUpdateOrderStatus, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Filter, Eye } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: orders, isLoading } = useListOrders();
  const updateStatus = useUpdateOrderStatus();

  const handleStatusChange = (id: number, status: string) => {
    updateStatus.mutate({ 
      id, 
      data: { status: status as any } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        toast({ title: "Order updated", description: `Order status changed to ${status}` });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search orders by customer or ID..." className="pl-9" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none">
            <Filter className="h-4 w-4 mr-2" /> Filter
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-40 mt-1" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : orders?.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                <TableCell className="text-sm">
                  {format(new Date(order.createdAt), "MMM d, yyyy")}
                  <span className="block text-xs text-muted-foreground">{format(new Date(order.createdAt), "h:mm a")}</span>
                </TableCell>
                <TableCell>
                  <p className="font-medium text-sm">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                </TableCell>
                <TableCell className="font-mono font-medium">${order.total.toFixed(2)}</TableCell>
                <TableCell>
                  <Select 
                    defaultValue={order.status} 
                    onValueChange={(val) => handleStatusChange(order.id, val)}
                  >
                    <SelectTrigger className={`w-[130px] h-8 text-xs font-display uppercase tracking-wider font-bold ${
                      order.status === 'delivered' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500' :
                      order.status === 'processing' ? 'border-primary/50 bg-primary/10 text-primary' :
                      order.status === 'shipped' ? 'border-blue-500/50 bg-blue-500/10 text-blue-500' :
                      order.status === 'cancelled' ? 'border-destructive/50 bg-destructive/10 text-destructive' :
                      'border-amber-500/50 bg-amber-500/10 text-amber-500'
                    }`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
