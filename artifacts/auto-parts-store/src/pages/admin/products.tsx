import { useState } from "react";
import { useListProducts, useCreateProduct, useDeleteProduct, getListProductsQueryKey, useListBrands, useListCategories } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format-price";

const EMPTY_FORM = {
  name: "",
  sku: "",
  description: "",
  price: "",
  compareAtPrice: "",
  stock: "",
  brandId: "",
  categoryId: "",
  imageUrl: "",
};

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Queries
  const { data: productsData, isLoading } = useListProducts({ page, limit: 10, search: debouncedSearch });
  const { data: brands } = useListBrands();
  const { data: categories } = useListCategories();

  // Mutations
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();

  const handleField = (key: keyof typeof EMPTY_FORM, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const price = parseFloat(form.price);
    const stock = parseInt(form.stock, 10);
    const brandId = parseInt(form.brandId, 10);
    const categoryId = parseInt(form.categoryId, 10);

    if (!form.name || isNaN(price) || isNaN(stock) || !brandId || !categoryId) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      sku: form.sku.trim() || undefined,
      description: form.description.trim() || undefined,
      price,
      stock,
      brandId,
      categoryId,
      imageUrl: form.imageUrl.trim() || undefined,
    };
    if (form.compareAtPrice) {
      const cap = parseFloat(form.compareAtPrice);
      if (!isNaN(cap)) payload.compareAtPrice = cap;
    }

    createProduct.mutate(
      { data: payload as any },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: "Product created", description: `${form.name} has been added.` });
          setForm(EMPTY_FORM);
          setDialogOpen(false);
        },
        onError: (err: any) => {
          toast({
            title: "Failed to create product",
            description: err?.message ?? "Something went wrong.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteProduct.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
            toast({ title: "Product deleted", description: `${name} has been removed.` });
          },
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Toolbar ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name or SKU…"
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="flex-1 sm:flex-none" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Product
        </Button>
      </div>

      {/* ── Table ────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-10 rounded-sm" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48 mb-1" /><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              : productsData?.products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="w-10 h-10 bg-white border border-border rounded-sm p-0.5">
                        <img src={product.imageUrl} alt="" className="w-full h-full object-contain" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                      <p className="font-mono text-xs text-muted-foreground mt-0.5">{product.sku}</p>
                    </TableCell>
                    <TableCell className="text-sm">{product.brandName}</TableCell>
                    <TableCell className="font-mono text-sm">{formatPrice(product.price)}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-sm text-xs font-mono font-medium ${
                        product.stock > 10
                          ? "bg-emerald-500/10 text-emerald-500"
                          : product.stock > 0
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={deleteProduct.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>

        {productsData && productsData.totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Page {page} of {productsData.totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(productsData.totalPages, p + 1))} disabled={page === productsData.totalPages}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Product Dialog ───────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setForm(EMPTY_FORM); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wider text-xl">Add New Product</DialogTitle>
          </DialogHeader>

          <form id="add-product-form" onSubmit={handleSubmit} className="space-y-5 py-2">
            {/* Name + SKU */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-name">Name <span className="text-destructive">*</span></Label>
                <Input id="p-name" required value={form.name} onChange={(e) => handleField("name", e.target.value)} placeholder="Ford 5.0L Intake Manifold" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-sku">SKU</Label>
                <Input id="p-sku" value={form.sku} onChange={(e) => handleField("sku", e.target.value)} placeholder="FRD-IM-50" />
              </div>
            </div>

            {/* Brand + Category */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Brand <span className="text-destructive">*</span></Label>
                <Select value={form.brandId} onValueChange={(v) => handleField("brandId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select brand…" /></SelectTrigger>
                  <SelectContent>
                    {brands?.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category <span className="text-destructive">*</span></Label>
                <Select value={form.categoryId} onValueChange={(v) => handleField("categoryId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select category…" /></SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price + Compare + Stock */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-price">Price (SAR) <span className="text-destructive">*</span></Label>
                <Input id="p-price" type="number" step="0.01" min="0" required value={form.price} onChange={(e) => handleField("price", e.target.value)} placeholder="249.99" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-compare">Compare-at Price</Label>
                <Input id="p-compare" type="number" step="0.01" min="0" value={form.compareAtPrice} onChange={(e) => handleField("compareAtPrice", e.target.value)} placeholder="299.99" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-stock">Stock <span className="text-destructive">*</span></Label>
                <Input id="p-stock" type="number" min="0" required value={form.stock} onChange={(e) => handleField("stock", e.target.value)} placeholder="50" />
              </div>
            </div>

            {/* Image URL */}
            <div className="space-y-1.5">
              <Label htmlFor="p-image">Image URL</Label>
              <Input id="p-image" type="url" value={form.imageUrl} onChange={(e) => handleField("imageUrl", e.target.value)} placeholder="https://…" />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="p-desc">Description</Label>
              <Textarea id="p-desc" rows={4} value={form.description} onChange={(e) => handleField("description", e.target.value)} placeholder="Product description…" />
            </div>
          </form>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button form="add-product-form" type="submit" disabled={createProduct.isPending}>
              {createProduct.isPending ? "Saving…" : "Save Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
