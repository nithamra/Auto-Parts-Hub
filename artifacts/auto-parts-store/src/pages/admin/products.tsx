import { useState } from "react";
import { useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, getListProductsQueryKey, useListBrands, useListCategories } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  // Queries
  const { data: productsData, isLoading } = useListProducts({ page, limit: 10, search: debouncedSearch });
  const { data: brands } = useListBrands();
  const { data: categories } = useListCategories();

  // Mutations
  const deleteProduct = useDeleteProduct();

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteProduct.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: "Product deleted", description: `${name} has been removed.` });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search products by name or SKU..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          <Button className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Product details</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-10 rounded-sm" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48 mb-1" /><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : productsData?.products.map((product) => (
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
                <TableCell className="font-mono text-sm">${product.price.toFixed(2)}</TableCell>
                <TableCell className="text-center">
                  <span className={`px-2 py-1 rounded-sm text-xs font-mono font-medium ${product.stock > 10 ? 'bg-emerald-500/10 text-emerald-500' : product.stock > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-destructive/10 text-destructive'}`}>
                    {product.stock}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(product.id, product.name)}
                      disabled={deleteProduct.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {productsData && productsData.totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing page {page} of {productsData.totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(productsData.totalPages, p + 1))} disabled={page === productsData.totalPages}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
