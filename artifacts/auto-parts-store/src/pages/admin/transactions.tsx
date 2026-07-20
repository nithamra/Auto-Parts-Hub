import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format-price";

// ─── Types ────────────────────────────────────────────────────────────────────

type TransactionStatus = "pending" | "completed" | "failed" | "refunded";

interface TransactionItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

interface Transaction {
  id: number;
  paypalOrderId: string;
  paypalTransactionId: string | null;
  orderId: number | null;
  userId: number | null;
  customerName: string | null;
  customerEmail: string | null;
  items: TransactionItem[];
  amount: number;
  currency: string;
  status: TransactionStatus;
  webhookVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

function statusConfig(status: TransactionStatus) {
  switch (status) {
    case "completed": return { label: "Completed", icon: CheckCircle2, cls: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
    case "pending":   return { label: "Pending",   icon: Clock,         cls: "text-amber-400 bg-amber-400/10 border-amber-400/20" };
    case "failed":    return { label: "Failed",    icon: XCircle,       cls: "text-destructive bg-destructive/10 border-destructive/20" };
    case "refunded":  return { label: "Refunded",  icon: RotateCcw,     cls: "text-blue-400 bg-blue-400/10 border-blue-400/20" };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminTransactions() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<TransactionsResponse>({
    queryKey: ["admin", "transactions", page],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/api/admin/transactions?page=${page}&limit=20`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const transactions = data?.transactions ?? [];

  // Client-side search filter
  const filtered = search.trim()
    ? transactions.filter((t) =>
        t.customerEmail?.toLowerCase().includes(search.toLowerCase()) ||
        t.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        t.paypalTransactionId?.toLowerCase().includes(search.toLowerCase()) ||
        t.paypalOrderId.toLowerCase().includes(search.toLowerCase())
      )
    : transactions;

  // Aggregate stats
  const completed = transactions.filter((t) => t.status === "completed");
  const totalRevenue = completed.reduce((s, t) => s + t.amount, 0);
  const pendingCount = transactions.filter((t) => t.status === "pending").length;
  const verifiedCount = transactions.filter((t) => t.webhookVerified).length;

  return (
    <div className="space-y-6">
      {/* ── Stat Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-display uppercase tracking-wider text-muted-foreground">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-28" /> : (
              <div className="text-2xl font-bold font-mono">{formatPrice(totalRevenue)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">{completed.length} completed payment{completed.length !== 1 ? "s" : ""}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-display uppercase tracking-wider text-muted-foreground">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : (
              <div className="text-2xl font-bold font-mono">{pendingCount}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Awaiting capture</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-display uppercase tracking-wider text-muted-foreground">Webhook Verified</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : (
              <div className="text-2xl font-bold font-mono">{verifiedCount}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">IPN confirmed</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-display uppercase tracking-wider text-muted-foreground">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : (
              <div className="text-2xl font-bold font-mono">{data?.total ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="font-display uppercase tracking-wider">PayPal Transactions</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or TX ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9 h-9 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b-2 border-border/60">
                  <TableHead className="font-display uppercase tracking-wider text-xs ps-6">Customer</TableHead>
                  <TableHead className="font-display uppercase tracking-wider text-xs">Products</TableHead>
                  <TableHead className="font-display uppercase tracking-wider text-xs">Amount</TableHead>
                  <TableHead className="font-display uppercase tracking-wider text-xs">Status</TableHead>
                  <TableHead className="font-display uppercase tracking-wider text-xs">PayPal TX ID</TableHead>
                  <TableHead className="font-display uppercase tracking-wider text-xs">Date</TableHead>
                  <TableHead className="font-display uppercase tracking-wider text-xs">IPN</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="ps-6"><Skeleton className="h-4 w-36" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      </TableRow>
                    ))
                  : filtered.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        {search ? "No transactions match your search." : "No transactions yet. Payments will appear here after checkout."}
                      </TableCell>
                    </TableRow>
                  )
                  : filtered.map((tx) => {
                      const status = statusConfig(tx.status);
                      const StatusIcon = status.icon;
                      const productNames = tx.items.map((i) => i.name).join(", ");
                      const shortProductNames = productNames.length > 40
                        ? productNames.slice(0, 40) + "…"
                        : productNames;

                      return (
                        <TableRow key={tx.id} className="group">
                          {/* Customer */}
                          <TableCell className="ps-6">
                            <div className="font-medium text-sm">
                              {tx.customerName || <span className="text-muted-foreground italic">Guest</span>}
                            </div>
                            {tx.customerEmail && (
                              <div className="text-xs text-muted-foreground">{tx.customerEmail}</div>
                            )}
                          </TableCell>

                          {/* Products */}
                          <TableCell>
                            {tx.items.length === 0 ? (
                              <span className="text-muted-foreground text-xs italic">—</span>
                            ) : (
                              <div>
                                <div className="text-sm" title={productNames}>{shortProductNames}</div>
                                {tx.items.length > 1 && (
                                  <div className="text-xs text-muted-foreground">{tx.items.length} items</div>
                                )}
                              </div>
                            )}
                          </TableCell>

                          {/* Amount */}
                          <TableCell>
                            <span className="font-mono font-semibold">{formatPrice(tx.amount)}</span>
                            {tx.currency !== "SAR" && (
                              <span className="text-xs text-muted-foreground ms-1">{tx.currency}</span>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <div className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium",
                              status.cls
                            )}>
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </div>
                          </TableCell>

                          {/* PayPal TX ID */}
                          <TableCell>
                            {tx.paypalTransactionId ? (
                              <span className="font-mono text-xs text-muted-foreground" title={tx.paypalTransactionId}>
                                {tx.paypalTransactionId.slice(0, 16)}…
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground/50 italic">pending</span>
                            )}
                          </TableCell>

                          {/* Date */}
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {format(new Date(tx.createdAt), "dd MMM yyyy, HH:mm")}
                          </TableCell>

                          {/* Webhook verified */}
                          <TableCell>
                            {tx.webhookVerified ? (
                              <ShieldCheck className="h-4 w-4 text-emerald-500" title="Webhook verified" />
                            ) : (
                              <span className="text-muted-foreground/40 text-xs">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                }
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-border/40">
              <p className="text-sm text-muted-foreground">
                Showing page {data.page} of {data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
