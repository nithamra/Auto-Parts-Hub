import { useGetWishlist } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product-card";
import { Link } from "wouter";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function WishlistPage() {
  const { data: wishlist, isLoading } = useGetWishlist();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 border-b border-border pb-4 flex items-center gap-3">
        <Heart className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-wider">Saved Parts</h1>
          <p className="text-muted-foreground mt-1">Items you're keeping an eye on.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[250px] w-full rounded-sm" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : !wishlist || wishlist.length === 0 ? (
        <div className="text-center py-24 bg-muted/20 border border-dashed border-border rounded-sm max-w-2xl mx-auto">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold uppercase tracking-wider mb-2">No Saved Parts</h2>
          <p className="text-muted-foreground mb-6">You haven't saved any items to your wishlist yet.</p>
          <Link href="/catalog">
            <Button>Browse Catalog</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
