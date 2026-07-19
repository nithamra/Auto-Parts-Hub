import { Product } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Star, ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { motion } from "framer-motion";
import { useAddToCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/lib/language-context";

export function ProductCard({ product }: { product: Product }) {
  const t = useT();
  const addToCart = useAddToCart();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart.mutate({
      data: { productId: product.id, quantity: 1 }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({
          title: t.productCard.addedToCart,
          description: t.productCard.addedDesc(product.name),
        });
      }
    });
  };

  return (
    <Link href={`/products/${product.id}`}>
      <motion.div 
        whileHover={{ y: -4 }}
        className="group flex flex-col h-full bg-card border border-border rounded-sm overflow-hidden hover:border-primary transition-colors cursor-pointer"
      >
        <div className="relative aspect-square bg-muted overflow-hidden flex items-center justify-center p-4">
          {product.stock <= 0 && (
            <div className="absolute top-2 start-2 z-10">
              <Badge variant="destructive">{t.productCard.outOfStock}</Badge>
            </div>
          )}
          {product.isFeatured && product.stock > 0 && (
            <div className="absolute top-2 start-2 z-10">
              <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary">{t.productCard.featured}</Badge>
            </div>
          )}
          <img 
            src={product.imageUrl || `https://placehold.co/400x400/1a1f2c/ef4444?text=${encodeURIComponent(product.name)}`} 
            alt={product.name}
            className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal drop-shadow-md group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-display tracking-widest text-muted-foreground uppercase">{product.brandName}</p>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-primary text-primary" />
              <span className="text-xs font-bold">{product.rating.toFixed(1)}</span>
            </div>
          </div>
          
          <h3 className="font-display font-semibold text-lg leading-tight mb-2 flex-1 group-hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>
          
          <div className="flex items-end justify-between mt-auto pt-4">
            <div>
              <p className="font-mono text-xl font-bold text-foreground">
                ${product.price.toFixed(2)}
              </p>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <p className="font-mono text-sm text-muted-foreground line-through">
                  ${product.compareAtPrice.toFixed(2)}
                </p>
              )}
            </div>
            
            <Button 
              size="icon" 
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || addToCart.isPending}
              className="h-10 w-10 shrink-0 rounded-sm"
              variant={product.stock > 0 ? "default" : "outline"}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">{t.productCard.addToCart}</span>
            </Button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
