import { useLocation, useSearch } from "wouter";
import { useEffect, useState, useCallback } from "react";
import {
  useListProducts,
  useListBrands,
  useGetCategoryTree,
  useGetVehicleMakes,
  useGetVehicleModels,
  useGetVehicleYears,
  getGetVehicleModelsQueryKey,
  getGetVehicleYearsQueryKey,
  ListProductsSortBy,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ProductCard } from "@/components/product-card";
import { CategoryNav, type CategoryNode } from "@/components/category-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Filter,
  Search,
  X,
  ChevronRight,
  SlidersHorizontal,
  LayoutGrid,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/use-debounce";
import { useT } from "@/lib/language-context";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format-price";

// ─── Breadcrumb helper ───────────────────────────────────────────────────────

function findCategoryPath(tree: CategoryNode[], slug: string): CategoryNode[] {
  for (const node of tree) {
    if (node.slug === slug) return [node];
    const path = findCategoryPath(node.children, slug);
    if (path.length) return [node, ...path];
  }
  return [];
}

// ─── Filter sidebar content ───────────────────────────────────────────────────

interface FilterPanelProps {
  t: ReturnType<typeof useT>;
  tree: CategoryNode[];
  activeCategorySlug: string;
  onCategorySelect: (slug: string) => void;
  brands: { id: number; name: string }[] | undefined;
  selectedBrand: string;
  onBrandChange: (v: string) => void;
  oemFilter: string;
  onOemChange: (v: string) => void;
  vehicleMake: string;
  onMakeChange: (v: string) => void;
  vehicleModel: string;
  onModelChange: (v: string) => void;
  vehicleYear: string;
  onYearChange: (v: string) => void;
  engine: string;
  onEngineChange: (v: string) => void;
  priceRange: [number, number];
  onPriceChange: (v: number[]) => void;
  inStockOnly: boolean;
  onInStockChange: (v: boolean) => void;
  withWarranty: boolean;
  onWarrantyChange: (v: boolean) => void;
  onClearAll: () => void;
  searchTerm: string;
  onSearchChange: (v: string) => void;
}

const ENGINE_OPTIONS = [
  "2.3L I4", "2.7L V6", "3.5L V6", "3.5L EcoBoost", "3.6L V6",
  "3.8L V6", "4.0L V6", "5.0L V8", "5.3L V8", "5.7L V8",
  "6.2L V8", "6.4L V8", "6.7L Diesel", "3.0L Diesel",
];

function FilterPanel({
  t, tree, activeCategorySlug, onCategorySelect,
  brands, selectedBrand, onBrandChange,
  oemFilter, onOemChange,
  vehicleMake, onMakeChange, vehicleModel, onModelChange, vehicleYear, onYearChange,
  engine, onEngineChange,
  priceRange, onPriceChange,
  inStockOnly, onInStockChange, withWarranty, onWarrantyChange,
  onClearAll, searchTerm, onSearchChange,
}: FilterPanelProps) {
  const { data: makes } = useGetVehicleMakes();
  const { data: models } = useGetVehicleModels(
    { make: vehicleMake },
    { query: { enabled: !!vehicleMake, queryKey: getGetVehicleModelsQueryKey({ make: vehicleMake }) } }
  );
  const { data: years } = useGetVehicleYears(
    { make: vehicleMake, model: vehicleModel },
    { query: { enabled: !!vehicleMake && !!vehicleModel, queryKey: getGetVehicleYearsQueryKey({ make: vehicleMake, model: vehicleModel }) } }
  );

  // Count active filters
  const activeCount = [
    selectedBrand !== "all",
    oemFilter !== "all",
    !!vehicleMake,
    priceRange[0] > 0 || priceRange[1] < 5000,
    inStockOnly,
    withWarranty,
    !!activeCategorySlug,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Search */}
      <div className="p-4 border-b border-border/40">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.catalog.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="ps-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Category tree */}
      <div className="border-b border-border/40">
        <div className="px-4 pt-4 pb-1">
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-primary mb-3">
            {t.catalog.categories}
          </p>
          <CategoryNav
            tree={tree}
            activeCategorySlug={activeCategorySlug}
            onSelect={onCategorySelect}
          />
        </div>
      </div>

      {/* Filters section */}
      <div className="p-4 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-primary">
            {t.catalog.filters}
          </p>
          {activeCount > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              {t.catalog.clearAll}
            </button>
          )}
        </div>

        {/* Brand */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
            {t.catalog.brand}
          </Label>
          <Select value={selectedBrand} onValueChange={onBrandChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder={t.catalog.anyBrand} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.catalog.anyBrand}</SelectItem>
              {brands?.map((b) => (
                <SelectItem key={b.id} value={b.id.toString()}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* OEM / Aftermarket */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
            {t.catalog.oemLabel}
          </Label>
          <div className="flex rounded-sm border border-border overflow-hidden text-xs">
            {(["all", "oem", "aftermarket"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => onOemChange(opt)}
                className={cn(
                  "flex-1 py-1.5 text-center transition-colors text-[11px] font-medium",
                  oemFilter === opt
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                {opt === "all" ? t.catalog.oemAll : opt === "oem" ? "OEM" : t.catalog.aftermarketOnly.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle Fitment */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
            {t.catalog.vehicleFilters}
          </Label>
          <div className="space-y-1.5">
            <Select value={vehicleMake || "all"} onValueChange={(v) => { onMakeChange(v === "all" ? "" : v); onModelChange(""); onYearChange(""); }}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={t.catalog.anyMake} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.catalog.anyMake}</SelectItem>
                {makes?.map((m) => (
                  <SelectItem key={m.make} value={m.make}>{m.make}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={vehicleModel || "all"}
              onValueChange={(v) => { onModelChange(v === "all" ? "" : v); onYearChange(""); }}
              disabled={!vehicleMake}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={vehicleMake ? t.catalog.anyModel : t.catalog.anyMake} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.catalog.anyModel}</SelectItem>
                {models?.map((m) => (
                  <SelectItem key={m.model} value={m.model}>{m.model}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={vehicleYear || "all"}
              onValueChange={(v) => onYearChange(v === "all" ? "" : v)}
              disabled={!vehicleModel}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={t.catalog.anyYear} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.catalog.anyYear}</SelectItem>
                {years?.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={engine || "all"} onValueChange={(v) => onEngineChange(v === "all" ? "" : v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={t.catalog.anyEngine} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.catalog.anyEngine}</SelectItem>
                {ENGINE_OPTIONS.map((eng) => (
                  <SelectItem key={eng} value={eng}>{eng}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Price range */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
              {t.catalog.priceRange}
            </Label>
            <span className="text-[11px] font-mono text-muted-foreground">
              {formatPrice(priceRange[0])} – {priceRange[1] >= 5000 ? "5000+" : formatPrice(priceRange[1])}
            </span>
          </div>
          <Slider
            min={0}
            max={5000}
            step={50}
            value={priceRange}
            onValueChange={(v) => onPriceChange(v)}
          />
        </div>

        {/* Checkboxes */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Checkbox
              id="inStock"
              checked={inStockOnly}
              onCheckedChange={(c) => onInStockChange(c as boolean)}
            />
            <Label htmlFor="inStock" className="text-xs normal-case font-normal tracking-normal cursor-pointer">
              {t.catalog.inStockOnly}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="warranty"
              checked={withWarranty}
              onCheckedChange={(c) => onWarrantyChange(c as boolean)}
            />
            <Label htmlFor="warranty" className="text-xs normal-case font-normal tracking-normal cursor-pointer">
              {t.catalog.withWarranty}
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main catalog page ────────────────────────────────────────────────────────

export default function CatalogPage() {
  const t = useT();
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const queryClient = useQueryClient();

  const getParam = (key: string) => new URLSearchParams(searchString).get(key) ?? "";

  const [searchTerm, setSearchTerm] = useState(getParam("search"));
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [selectedBrand, setSelectedBrand] = useState(getParam("brand") || "all");
  const [activeCategorySlug, setActiveCategorySlug] = useState(getParam("cat"));
  const [oemFilter, setOemFilter] = useState(getParam("oem") || "all");
  const [vehicleMake, setVehicleMake] = useState(getParam("make"));
  const [vehicleModel, setVehicleModel] = useState(getParam("model"));
  const [vehicleYear, setVehicleYear] = useState(getParam("year"));
  const [engine, setEngine] = useState(getParam("engine"));
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(getParam("minPrice")) || 0,
    Number(getParam("maxPrice")) || 5000,
  ]);
  const debouncedPrice = useDebounce(priceRange, 500);
  const [inStockOnly, setInStockOnly] = useState(getParam("inStock") === "true");
  const [withWarranty, setWithWarranty] = useState(getParam("warranty") === "true");
  const [sortBy, setSortBy] = useState<ListProductsSortBy>(
    (getParam("sortBy") as ListProductsSortBy) || ListProductsSortBy.newest
  );
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: brands } = useListBrands();
  const { data: rawTree } = useGetCategoryTree();
  const tree = (rawTree as unknown as CategoryNode[]) ?? [];

  const queryParams = {
    page,
    limit: 12,
    search: debouncedSearch || undefined,
    brandId: selectedBrand !== "all" ? Number(selectedBrand) : undefined,
    categorySlug: activeCategorySlug || undefined,
    isOem: oemFilter === "oem" ? true : oemFilter === "aftermarket" ? false : undefined,
    vehicleMake: vehicleMake || undefined,
    vehicleModel: vehicleModel || undefined,
    vehicleYear: vehicleYear ? Number(vehicleYear) : undefined,
    engine: engine || undefined,
    minPrice: debouncedPrice[0] > 0 ? debouncedPrice[0] : undefined,
    maxPrice: debouncedPrice[1] < 5000 ? debouncedPrice[1] : undefined,
    inStock: inStockOnly ? true : undefined,
    hasWarranty: withWarranty ? true : undefined,
    sortBy,
  };

  const { data: response, isLoading } = useListProducts(queryParams, {
    query: { queryKey: getListProductsQueryKey(queryParams) },
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
  }, [response]);

  // Sync URL with filter state
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (selectedBrand !== "all") params.set("brand", selectedBrand);
    if (activeCategorySlug) params.set("cat", activeCategorySlug);
    if (oemFilter !== "all") params.set("oem", oemFilter);
    if (vehicleMake) params.set("make", vehicleMake);
    if (vehicleModel) params.set("model", vehicleModel);
    if (vehicleYear) params.set("year", vehicleYear);
    if (engine) params.set("engine", engine);
    if (debouncedPrice[0] > 0) params.set("minPrice", String(debouncedPrice[0]));
    if (debouncedPrice[1] < 5000) params.set("maxPrice", String(debouncedPrice[1]));
    if (inStockOnly) params.set("inStock", "true");
    if (withWarranty) params.set("warranty", "true");
    if (sortBy !== ListProductsSortBy.newest) params.set("sortBy", sortBy);
    const newSearch = params.toString();
    if (newSearch !== searchString) {
      setLocation(`/catalog${newSearch ? `?${newSearch}` : ""}`);
    }
  }, [debouncedSearch, selectedBrand, activeCategorySlug, oemFilter, vehicleMake, vehicleModel, vehicleYear, engine, debouncedPrice, inStockOnly, withWarranty, sortBy]);

  const handleCategorySelect = useCallback((slug: string) => {
    setActiveCategorySlug(slug);
    setPage(1);
    setSheetOpen(false);
  }, []);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedBrand("all");
    setActiveCategorySlug("");
    setOemFilter("all");
    setVehicleMake("");
    setVehicleModel("");
    setVehicleYear("");
    setEngine("");
    setPriceRange([0, 5000]);
    setInStockOnly(false);
    setWithWarranty(false);
    setSortBy(ListProductsSortBy.newest);
    setPage(1);
  };

  // Breadcrumb
  const breadcrumb = activeCategorySlug ? findCategoryPath(tree, activeCategorySlug) : [];

  // Active filter count for badge
  const activeFilterCount = [
    selectedBrand !== "all",
    oemFilter !== "all",
    !!vehicleMake,
    priceRange[0] > 0 || priceRange[1] < 5000,
    inStockOnly,
    withWarranty,
  ].filter(Boolean).length;

  const filterPanelProps: FilterPanelProps = {
    t,
    tree,
    activeCategorySlug,
    onCategorySelect: handleCategorySelect,
    brands,
    selectedBrand,
    onBrandChange: (v) => { setSelectedBrand(v); setPage(1); },
    oemFilter,
    onOemChange: (v) => { setOemFilter(v); setPage(1); },
    vehicleMake,
    onMakeChange: (v) => { setVehicleMake(v); setPage(1); },
    vehicleModel,
    onModelChange: (v) => { setVehicleModel(v); setPage(1); },
    vehicleYear,
    onYearChange: (v) => { setVehicleYear(v); setPage(1); },
    engine,
    onEngineChange: (v) => { setEngine(v); setPage(1); },
    priceRange,
    onPriceChange: (v) => { setPriceRange(v as [number, number]); setPage(1); },
    inStockOnly,
    onInStockChange: (v) => { setInStockOnly(v); setPage(1); },
    withWarranty,
    onWarrantyChange: (v) => { setWithWarranty(v); setPage(1); },
    onClearAll: clearFilters,
    searchTerm,
    onSearchChange: (v) => { setSearchTerm(v); setPage(1); },
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)]">
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 border-e border-border/40 sticky top-16 h-[calc(100vh-4rem)] overflow-hidden">
        <FilterPanel {...filterPanelProps} />
      </aside>

      {/* ── Main content ────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-border/40 px-4 py-2 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.catalog.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="ps-9 h-9 text-sm"
            />
          </div>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 gap-2 h-9">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="text-xs">{t.catalog.mobileFilters}</span>
                {(activeFilterCount > 0 || !!activeCategorySlug) && (
                  <Badge variant="default" className="h-5 w-5 p-0 text-[10px] flex items-center justify-center">
                    {activeFilterCount + (activeCategorySlug ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 flex flex-col">
              <SheetHeader className="px-4 pt-4 pb-2 border-b border-border/40 shrink-0">
                <SheetTitle className="text-sm font-display font-bold uppercase tracking-wider">
                  {t.catalog.mobileFilters}
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-hidden">
                <FilterPanel {...filterPanelProps} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="px-4 md:px-6 py-6 max-w-screen-2xl">
          {/* Breadcrumb */}
          {breadcrumb.length > 0 && (
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 flex-wrap">
              <button onClick={() => handleCategorySelect("")} className="hover:text-primary transition-colors">
                {t.catalog.allParts}
              </button>
              {breadcrumb.map((crumb, i) => (
                <span key={crumb.id} className="flex items-center gap-1.5">
                  <ChevronRight className="h-3 w-3 opacity-50" />
                  <button
                    onClick={() => handleCategorySelect(crumb.slug)}
                    className={cn(
                      "transition-colors",
                      i === breadcrumb.length - 1
                        ? "text-foreground font-medium"
                        : "hover:text-primary"
                    )}
                  >
                    {crumb.name}
                  </button>
                </span>
              ))}
            </nav>
          )}

          {/* Page header + sort */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-wider">
                {activeCategorySlug && breadcrumb.length > 0
                  ? breadcrumb[breadcrumb.length - 1].name
                  : <>{t.catalog.titlePart1} <span className="text-primary">{t.catalog.titlePart2}</span></>
                }
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isLoading
                  ? t.catalog.loadingProducts
                  : t.catalog.showing(response?.products.length ?? 0, response?.total ?? 0)}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Label className="whitespace-nowrap text-xs text-muted-foreground">{t.catalog.sortBy}</Label>
              <Select value={sortBy} onValueChange={(v) => { setSortBy(v as ListProductsSortBy); setPage(1); }}>
                <SelectTrigger className="w-[170px] h-8 text-xs">
                  <SelectValue placeholder={t.catalog.sortBy} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ListProductsSortBy.newest}>{t.catalog.sortNewest}</SelectItem>
                  <SelectItem value={ListProductsSortBy.price_asc}>{t.catalog.sortPriceLow}</SelectItem>
                  <SelectItem value={ListProductsSortBy.price_desc}>{t.catalog.sortPriceHigh}</SelectItem>
                  <SelectItem value={ListProductsSortBy.rating}>{t.catalog.sortRating}</SelectItem>
                  <SelectItem value={ListProductsSortBy.name}>{t.catalog.sortName}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filter chips */}
          {(activeFilterCount > 0 || activeCategorySlug) && (
            <div className="flex flex-wrap gap-2 mb-5">
              {activeCategorySlug && breadcrumb.length > 0 && (
                <Badge variant="secondary" className="gap-1.5 text-xs cursor-pointer hover:bg-destructive/20" onClick={() => handleCategorySelect("")}>
                  {breadcrumb[breadcrumb.length - 1].name}
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {selectedBrand !== "all" && brands?.find(b => b.id.toString() === selectedBrand) && (
                <Badge variant="secondary" className="gap-1.5 text-xs cursor-pointer hover:bg-destructive/20" onClick={() => setSelectedBrand("all")}>
                  {brands.find(b => b.id.toString() === selectedBrand)!.name}
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {oemFilter !== "all" && (
                <Badge variant="secondary" className="gap-1.5 text-xs cursor-pointer hover:bg-destructive/20" onClick={() => setOemFilter("all")}>
                  {oemFilter === "oem" ? t.catalog.oemOnly : t.catalog.aftermarketOnly}
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {vehicleMake && (
                <Badge variant="secondary" className="gap-1.5 text-xs cursor-pointer hover:bg-destructive/20" onClick={() => { setVehicleMake(""); setVehicleModel(""); setVehicleYear(""); }}>
                  {[vehicleMake, vehicleModel, vehicleYear].filter(Boolean).join(" ")}
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {inStockOnly && (
                <Badge variant="secondary" className="gap-1.5 text-xs cursor-pointer hover:bg-destructive/20" onClick={() => setInStockOnly(false)}>
                  {t.catalog.inStockOnly}<X className="h-3 w-3" />
                </Badge>
              )}
              {withWarranty && (
                <Badge variant="secondary" className="gap-1.5 text-xs cursor-pointer hover:bg-destructive/20" onClick={() => setWithWarranty(false)}>
                  {t.catalog.withWarranty}<X className="h-3 w-3" />
                </Badge>
              )}
              <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-primary underline">
                {t.catalog.clearAll}
              </button>
            </div>
          )}

          {/* Product grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            {isLoading
              ? Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="flex flex-col space-y-3">
                    <Skeleton className="h-[220px] w-full rounded-sm" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))
              : response?.products.length === 0
              ? (
                <div className="col-span-full py-16 text-center bg-muted/20 border border-dashed border-border rounded-sm">
                  <LayoutGrid className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-xl font-display font-semibold uppercase tracking-wider mb-2">
                    {t.catalog.noPartsTitle}
                  </h3>
                  <p className="text-muted-foreground mb-6">{t.catalog.noPartsDesc}</p>
                  <Button onClick={clearFilters} variant="outline">{t.catalog.clearAllFilters}</Button>
                </div>
              )
              : response?.products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.04, 0.3) }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))
            }
          </div>

          {/* Pagination */}
          {response && response.totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {t.catalog.previous}
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, response.totalPages) }).map((_, i) => {
                  let pageNum = i + 1;
                  if (response.totalPages > 5) {
                    if (page > 3) pageNum = page - 2 + i;
                    if (page > response.totalPages - 2) pageNum = response.totalPages - 4 + i;
                  }
                  if (pageNum > response.totalPages) return null;
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? "default" : "ghost"}
                      size="icon"
                      className="w-8 h-8 text-xs"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(response.totalPages, p + 1))}
                disabled={page === response.totalPages}
              >
                {t.catalog.next}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
