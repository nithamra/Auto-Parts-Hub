import { useGetAdminStats, useGetSalesByCategory, useGetLowStockProducts, useGetRecentOrders } from "@workspace/api-client-react";
import { Link } from "wouter";
import { TrendingUp, ShoppingCart, Package, Users, AlertTriangle, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/format-price";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { format } from "date-fns";

const COLORS = ['hsl(3, 70%, 50%)', 'hsl(210, 50%, 30%)', 'hsl(220, 15%, 30%)', 'hsl(45, 93%, 47%)', 'hsl(160, 84%, 39%)'];

export default function AdminDashboard() {
  const { data: stats, isLoading: loadingStats } = useGetAdminStats();
  const { data: salesData, isLoading: loadingSales } = useGetSalesByCategory();
  const { data: lowStock, isLoading: loadingStock } = useGetLowStockProducts();
  const { data: recentOrders, isLoading: loadingOrders } = useGetRecentOrders();

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-display uppercase tracking-wider font-bold text-muted-foreground">Total Revenue</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold font-mono">{formatPrice(stats?.totalRevenue ?? 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">+{formatPrice(stats?.revenueThisMonth ?? 0)} this month</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-card border-l-4 border-l-secondary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-display uppercase tracking-wider font-bold text-muted-foreground">Orders</CardTitle>
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold font-mono">{stats?.totalOrders}</div>
                <p className="text-xs text-muted-foreground mt-1">+{stats?.ordersThisMonth} this month</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-card border-l-4 border-l-muted-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-display uppercase tracking-wider font-bold text-muted-foreground">Products</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold font-mono">{stats?.totalProducts}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-card border-l-4 border-l-accent-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-display uppercase tracking-wider font-bold text-muted-foreground">Customers</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold font-mono">{stats?.totalCustomers}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sales by Category Chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {loadingSales ? <Skeleton className="h-[250px] w-full rounded-full" /> : 
             salesData && salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="totalSales"
                    nameKey="categoryName"
                  >
                    {salesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatPrice(value)}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0.25rem' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground text-center">No sales data available</div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Low Stock Alerts
            </CardTitle>
            <Link href="/admin/products" className="text-sm text-primary flex items-center hover:underline">
              Manage Inventory <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {loadingStock ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : lowStock && lowStock.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.map(product => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">{product.sku}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={product.stock === 0 ? "destructive" : "outline"} className={product.stock > 0 ? "text-amber-500 border-amber-500/50" : ""}>
                          {product.stock} left
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground border border-dashed border-border rounded-sm">
                All products have sufficient stock levels.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link href="/admin/orders" className="text-sm text-primary flex items-center hover:underline">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </CardHeader>
        <CardContent>
          {loadingOrders ? (
             <div className="space-y-4">
               {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
             </div>
          ) : recentOrders && recentOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.slice(0, 5).map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono">{order.orderNumber}</TableCell>
                    <TableCell>{format(new Date(order.createdAt), "MMM d, yyyy")}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        order.status === 'delivered' ? 'border-emerald-500 text-emerald-500' :
                        order.status === 'processing' ? 'border-primary text-primary' :
                        order.status === 'cancelled' ? 'border-destructive text-destructive' : ''
                      }>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatPrice(order.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground border border-dashed border-border rounded-sm">
              No recent orders found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
