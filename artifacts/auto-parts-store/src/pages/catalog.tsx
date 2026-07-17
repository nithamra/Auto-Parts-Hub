import { useLocation, useSearch } from "wouter";
import { useEffect, useState } from "react";
import { useListProducts, useListBrands, useListCategories, ListProductsSortBy, getListProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/use-debounce";

export default function CatalogPage() {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const queryClient = useQueryClient();

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Form state
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const [selectedBrand, setSelectedBrand] = useState<string>(searchParams.get("brand") || "all");
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "all");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const debouncedPrice = useDebounce(priceRange, 500);
  const [inStockOnly, setInStockOnly] = useState(searchParams.get("inStock") === "true");
  const [sortBy, setSortBy] = useState<ListProductsSortBy>((searchParams.get("sortBy") as ListProductsSortBy) || ListProductsSortBy.newest);

  // API Queries
  const { data: brands } = useListBrands();
  const { data: categories } = useListCategories();

  const queryParams = {
    page,
    limit: 12,
    search: debouncedSearch || undefined,
    brandId: selectedBrand !== "all" ? Number(selectedBrand) : undefined,
    categoryId: selectedCategory !== "all" ? Number(selectedCategory) : undefined,
    minPrice: debouncedPrice[0] > 0 ? debouncedPrice[0] : undefined,
    maxPrice: debouncedPrice[1] < 1000 ? debouncedPrice[1] : undefined,
    inStock: inStockOnly ? true : undefined,
    sortBy,
  };

  const { data: response, isLoading } = useListProducts(queryParams, {
    query: { queryKey: getListProductsQueryKey(queryParams) }
  });

  // Prefetch next page
  useEffect(() => {
    if (response?.page && response?.totalPages && response.page < response.totalPages) {
      const nextParams = { ...queryParams, page: response.page + 1 };
      queryClient.prefetchQuery({
        queryKey: getListProductsQueryKey(nextParams),
        queryFn: () => queryClient.fetchQuery({ queryKey: getListProductsQueryKey(nextParams) }),
      });
    }
  }, [response, queryParams, queryClient]);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (selectedBrand !== "all") params.set("brand", selectedBrand);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (inStockOnly) params.set("inStock", "true");
    if (sortBy !== ListProductsSortBy.newest) params.set("sortBy", sortBy);
    
    const newSearch = params.toString();
    if (newSearch !== searchString) {
      setLocation(`${location}${newSearch ? `?${newSearch}` : ""}`);
    }
  }, [debouncedSearch, selectedBrand, selectedCategory, inStockOnly, sortBy, location, setLocation]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedBrand("all");
    setSelectedCategory("all");
    setPriceRange([0, 1000]);
    setInStockOnly(false);
    setSortBy(ListProductsSortBy.newest);
    setPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      {/* Mobile Filter Toggle */}
      <div className="md:hidden flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search parts..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Sidebar Filters */}
      <AnimatePresence>
        {(isFiltersOpen || typeof window !== 'undefined' && window.innerWidth >= 768) && (
          <motion.aside 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full md:w-64 shrink-0 space-y-6 md:block overflow-hidden md:overflow-visible"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold uppercase tracking-wider text-xl">Filters</h2>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                Clear All
              </Button>
            </div>

            <div className="hidden md:block relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search parts..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-primary">Brand</Label>
              <Select value={selectedBrand} onValueChange={(v) => { setSelectedBrand(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Any Brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Brand</SelectItem>
                  {brands?.map(b => (
                    <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-primary">Category</Label>
              <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Any Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Category</SelectItem>
                  {categories?.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-primary">Price Range</Label>
                <span className="text-xs font-mono">${priceRange[0]} - {priceRange[1] >= 1000 ? '$1000+' : `$${priceRange[1]}`}</span>
              </div>
              <Slider 
                min={0} 
                max={1000} 
                step={10} 
                value={priceRange} 
                onValueChange={(v) => { setPriceRange(v); setPage(1); }} 
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="inStock" 
                checked={inStockOnly} 
                onCheckedChange={(c) => { setInStockOnly(c as boolean); setPage(1); }}
              />
              <Label htmlFor="inStock" className="text-foreground normal-case font-sans tracking-normal">Show only in-stock items</Label>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold uppercase tracking-wider">
              Parts <span className="text-primary">Catalog</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isLoading ? "Loading products..." : `Showing ${response?.products.length || 0} of ${response?.total || 0} products`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap mr-2 text-xs">Sort By</Label>
            <Select value={sortBy} onValueChange={(v) => { setSortBy(v as ListProductsSortBy); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ListProductsSortBy.newest}>Newest Arrivals</SelectItem>
                <SelectItem value={ListProductsSortBy.price_asc}>Price: Low to High</SelectItem>
                <SelectItem value={ListProductsSortBy.price_desc}>Price: High to Low</SelectItem>
                <SelectItem value={ListProductsSortBy.rating}>Highest Rated</SelectItem>
                <SelectItem value={ListProductsSortBy.name}>Name: A to Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-[250px] w-full rounded-sm" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : response?.products.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-muted/20 border border-dashed border-border rounded-sm">
              <h3 className="text-xl font-display font-semibold uppercase tracking-wider mb-2">No Parts Found</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your filters or search term.</p>
              <Button onClick={clearFilters} variant="outline">Clear All Filters</Button>
            </div>
          ) : (
            response?.products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {response && response.totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1 mx-4">
              {Array.from({ length: Math.min(5, response.totalPages) }).map((_, i) => {
                // Logic to show pages around current page
                let pageNum = i + 1;
                if (response.totalPages > 5) {
                  if (page > 3) {
                    pageNum = page - 2 + i;
                  }
                  if (page > response.totalPages - 2) {
                    pageNum = response.totalPages - 4 + i;
                  }
                }
                
                if (pageNum > response.totalPages) return null;

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "default" : "ghost"}
                    size="icon"
                    className="w-8 h-8"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button 
              variant="outline" 
              onClick={() => setPage(p => Math.min(response.totalPages, p + 1))}
              disabled={page === response.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
