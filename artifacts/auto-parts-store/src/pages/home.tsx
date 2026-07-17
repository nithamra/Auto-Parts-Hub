import { useGetFeaturedProducts, useListBrands } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowRight, ChevronRight, ShieldCheck, Truck, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function HomePage() {
  const { data: featuredProducts, isLoading: loadingProducts } = useGetFeaturedProducts();
  const { data: brands, isLoading: loadingBrands } = useListBrands();

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-zinc-900 border-b-4 border-primary">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1532884928231-ef40895eb654?q=80&w=2000&auto=format&fit=crop" 
            alt="Rugged truck engine bay" 
            className="w-full h-full object-cover opacity-30 mix-blend-luminosity grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        </div>
        
        <div className="container relative z-10 mx-auto px-4 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-display tracking-widest uppercase font-bold">OEM & Aftermarket Excellence</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold uppercase tracking-tighter text-white drop-shadow-lg">
              American <br/>
              <span className="text-primary">Muscle.</span> <br/>
              Built Right.
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-300 font-sans max-w-2xl mx-auto drop-shadow-md">
              The premier source for Ford, Chevrolet, GMC, and Jeep parts. When the job needs to get done, you need parts you can trust.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 pt-4">
              <Link href="/catalog">
                <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 border-2 border-primary">
                  Shop Catalog <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/vehicle-finder">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg h-14 px-8">
                  Find Your Vehicle <Wrench className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-card border-b border-border py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="flex items-center justify-center gap-4 py-4 md:py-0">
              <div className="h-12 w-12 rounded-sm bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-display font-bold uppercase tracking-wider">Quality Guaranteed</h4>
                <p className="text-sm text-muted-foreground">OEM & Premium Aftermarket</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 py-4 md:py-0">
              <div className="h-12 w-12 rounded-sm bg-primary/10 flex items-center justify-center text-primary">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-display font-bold uppercase tracking-wider">Fast Shipping</h4>
                <p className="text-sm text-muted-foreground">Free on orders over $150</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 py-4 md:py-0">
              <div className="h-12 w-12 rounded-sm bg-primary/10 flex items-center justify-center text-primary">
                <Wrench className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-display font-bold uppercase tracking-wider">Expert Support</h4>
                <p className="text-sm text-muted-foreground">Talk to real gearheads</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Brands */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider">Shop By <span className="text-primary">Brand</span></h2>
              <div className="h-1 w-20 bg-primary mt-4"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {loadingBrands ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-sm" />
              ))
            ) : brands?.map((brand) => (
              <Link key={brand.id} href={`/catalog?brand=${brand.id}`}>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-card border border-border p-6 rounded-sm aspect-square flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary transition-colors relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                  
                  <div className="relative z-20 flex flex-col items-center">
                    <h3 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-widest text-foreground group-hover:text-white transition-colors mt-4">
                      {brand.name}
                    </h3>
                    <p className="text-sm text-muted-foreground group-hover:text-zinc-300 mt-2 flex items-center">
                      Shop Parts <ChevronRight className="w-4 h-4" />
                    </p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24 bg-zinc-50 dark:bg-zinc-900/50 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider">Top <span className="text-primary">Sellers</span></h2>
              <div className="h-1 w-20 bg-primary mt-4"></div>
            </div>
            <Link href="/catalog">
              <Button variant="outline" className="hidden md:flex">
                View All Products <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loadingProducts ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                  <Skeleton className="h-[250px] w-full rounded-sm" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))
            ) : featuredProducts?.slice(0, 4).map((product, index) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
          
          <div className="mt-8 md:hidden">
            <Link href="/catalog">
              <Button className="w-full">
                View All Products <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Category Promo */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative h-[400px] rounded-sm overflow-hidden group">
              <div className="absolute inset-0 bg-black/60 z-10 group-hover:bg-black/40 transition-colors duration-500" />
              <img 
                src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop" 
                alt="Suspension Parts" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 z-20 flex flex-col justify-end p-8">
                <h3 className="text-3xl font-display font-bold uppercase tracking-wider text-white mb-2">Heavy Duty Suspension</h3>
                <p className="text-zinc-300 mb-6 max-w-sm">Upgrade your ride quality and towing capacity with our premium suspension kits.</p>
                <Link href="/catalog?category=suspension">
                  <Button variant="secondary" className="w-fit">Shop Suspension</Button>
                </Link>
              </div>
            </div>
            
            <div className="relative h-[400px] rounded-sm overflow-hidden group">
              <div className="absolute inset-0 bg-black/60 z-10 group-hover:bg-black/40 transition-colors duration-500" />
              <img 
                src="https://images.unsplash.com/photo-1620050853755-d14fb96a32d1?q=80&w=1000&auto=format&fit=crop" 
                alt="Engine Components" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 z-20 flex flex-col justify-end p-8">
                <h3 className="text-3xl font-display font-bold uppercase tracking-wider text-white mb-2">Performance Engine</h3>
                <p className="text-zinc-300 mb-6 max-w-sm">Unlock true American muscle with intakes, exhausts, and tuner components.</p>
                <Link href="/catalog?category=engine">
                  <Button className="w-fit">Shop Performance</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
