import { useState } from "react";
import { useGetVehicleMakes, useGetVehicleModels, useGetVehicleYears, useListProducts, getGetVehicleModelsQueryKey, getGetVehicleYearsQueryKey, getListProductsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Wrench, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/lib/language-context";

export default function VehicleFinderPage() {
  const t = useT();
  const [selectedMake, setSelectedMake] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [hasSearched, setHasSearched] = useState(false);

  const { data: makes, isLoading: loadingMakes } = useGetVehicleMakes();
  
  const { data: modelsData, isLoading: loadingModels } = useGetVehicleModels(
    { make: selectedMake },
    { query: { queryKey: getGetVehicleModelsQueryKey({ make: selectedMake }), enabled: !!selectedMake } }
  );
  
  const { data: yearsData, isLoading: loadingYears } = useGetVehicleYears(
    { make: selectedMake, model: selectedModel },
    { query: { queryKey: getGetVehicleYearsQueryKey({ make: selectedMake, model: selectedModel }), enabled: !!selectedMake && !!selectedModel } }
  );

  const searchParams = { vehicleMake: selectedMake, vehicleModel: selectedModel, vehicleYear: selectedYear ? parseInt(selectedYear) : undefined, limit: 24 };
  const { data: searchResults, isLoading: loadingResults } = useListProducts(
    searchParams,
    { query: { queryKey: getListProductsQueryKey(searchParams), enabled: hasSearched } }
  );

  const handleMakeChange = (val: string) => {
    setSelectedMake(val);
    setSelectedModel("");
    setSelectedYear("");
    setHasSearched(false);
  };

  const handleModelChange = (val: string) => {
    setSelectedModel(val);
    setSelectedYear("");
    setHasSearched(false);
  };

  const handleSearch = () => {
    if (selectedMake && selectedModel && selectedYear) setHasSearched(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-zinc-900 border-b-4 border-primary py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2000&auto=format&fit=crop" 
            alt="Garage" 
            className="w-full h-full object-cover opacity-20 mix-blend-luminosity grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
        </div>
        
        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Wrench className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-4xl md:text-6xl font-display font-extrabold uppercase tracking-tighter text-white">
              {t.vehicleFinder.titlePart1} <span className="text-primary">{t.vehicleFinder.titlePart2}</span>
            </h1>
            <p className="text-lg text-zinc-400 font-sans">
              {t.vehicleFinder.subtitle}
            </p>
          </div>

          {/* Finder Box */}
          <div className="mt-12 bg-card p-6 md:p-8 rounded-sm shadow-xl border border-border/50 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground ms-1">{t.vehicleFinder.make}</label>
                <Select value={selectedMake} onValueChange={handleMakeChange}>
                  <SelectTrigger className="h-12 bg-background">
                    <SelectValue placeholder={loadingMakes ? t.vehicleFinder.loading : t.vehicleFinder.selectMake} />
                  </SelectTrigger>
                  <SelectContent>
                    {makes?.map(m => (
                      <SelectItem key={m.make} value={m.make}>{m.make}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground ms-1">{t.vehicleFinder.model}</label>
                <Select value={selectedModel} onValueChange={handleModelChange} disabled={!selectedMake}>
                  <SelectTrigger className="h-12 bg-background">
                    <SelectValue placeholder={!selectedMake ? t.vehicleFinder.selectMakeFirst : loadingModels ? t.vehicleFinder.loading : t.vehicleFinder.selectModel} />
                  </SelectTrigger>
                  <SelectContent>
                    {modelsData?.map(m => (
                      <SelectItem key={m.model} value={m.model}>{m.model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground ms-1">{t.vehicleFinder.year}</label>
                <Select value={selectedYear} onValueChange={(v) => { setSelectedYear(v); setHasSearched(false); }} disabled={!selectedModel}>
                  <SelectTrigger className="h-12 bg-background">
                    <SelectValue placeholder={!selectedModel ? t.vehicleFinder.selectModelFirst : loadingYears ? t.vehicleFinder.loading : t.vehicleFinder.selectYear} />
                  </SelectTrigger>
                  <SelectContent>
                    {yearsData?.map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex flex-col justify-end">
                <Button 
                  size="lg" 
                  className="h-12 w-full text-lg border-2 border-primary"
                  onClick={handleSearch}
                  disabled={!selectedMake || !selectedModel || !selectedYear}
                >
                  <Search className="me-2 h-5 w-5" /> {t.vehicleFinder.search}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="flex-1 bg-background py-16">
        <div className="container mx-auto px-4">
          {!hasSearched ? (
            <div className="text-center py-20 opacity-50 flex flex-col items-center">
              <Wrench className="w-16 h-16 text-muted mb-4" />
              <h2 className="text-2xl font-display font-bold uppercase tracking-wider text-muted-foreground">{t.vehicleFinder.awaitingTitle}</h2>
              <p className="max-w-md mx-auto mt-2">{t.vehicleFinder.awaitingDesc}</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-wider">
                      {t.vehicleFinder.partsFor} <span className="text-primary">{selectedYear} {selectedMake} {selectedModel}</span>
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {loadingResults ? t.vehicleFinder.searchingCatalog : t.vehicleFinder.foundParts(searchResults?.total || 0)}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setHasSearched(false)}>
                    {t.vehicleFinder.changeVehicle}
                  </Button>
                </div>

                {loadingResults ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex flex-col space-y-3">
                        <Skeleton className="h-[250px] w-full rounded-sm" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : searchResults?.products && searchResults.products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {searchResults.products.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-muted/20 rounded-sm border border-dashed border-border">
                    <h3 className="text-xl font-display font-semibold uppercase tracking-wider mb-2">{t.vehicleFinder.noPartsTitle}</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      {t.vehicleFinder.noPartsDesc(selectedYear, selectedMake, selectedModel)}
                    </p>
                    <Link href="/catalog">
                      <Button variant="outline">{t.vehicleFinder.browseFullCatalog}</Button>
                    </Link>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>
    </div>
  );
}
