import { useRoute } from "wouter";
import { useGetProduct, useAddToCart, getGetCartQueryKey, useListProductReviews, useCreateReview, getListProductReviewsQueryKey, getGetProductQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Truck, ShieldCheck, Wrench, Heart, Minus, Plus, ShoppingCart, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/format-price";
import { useT } from "@/lib/language-context";

export default function ProductDetailPage() {
  const [match, params] = useRoute("/products/:id");
  const productId = match && params.id ? parseInt(params.id, 10) : null;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = useT();

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [reviewName, setReviewName] = useState("");

  const { data: product, isLoading } = useGetProduct(productId!, {
    query: { queryKey: getGetProductQueryKey(productId!), enabled: !!productId }
  });

  const { data: reviews, isLoading: loadingReviews } = useListProductReviews(productId!, {
    query: { queryKey: getListProductReviewsQueryKey(productId!), enabled: !!productId }
  });

  const addToCart = useAddToCart();
  const createReview = useCreateReview();

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCart.mutate({
      data: { productId: product.id, quantity }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({
          title: t.product.addedToCart,
          description: `${quantity}x ${product.name} added to your cart.`,
        });
      }
    });
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !reviewTitle || !reviewBody || !reviewName) return;

    createReview.mutate({
      id: productId,
      data: {
        userName: reviewName,
        rating: reviewRating,
        title: reviewTitle,
        body: reviewBody
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductReviewsQueryKey(productId) });
        setReviewTitle("");
        setReviewBody("");
        setReviewRating(5);
        toast({
          title: "Review submitted",
          description: "Thank you for your feedback!",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-sm" />
            <div className="flex gap-4">
              <Skeleton className="h-20 w-20 rounded-sm" />
              <Skeleton className="h-20 w-20 rounded-sm" />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-12 w-1/4" />
            <Skeleton className="h-32 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 flex-1" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="container mx-auto px-4 py-16 text-center">Product not found</div>;
  }

  const images = product.images?.length > 0 ? product.images : [product.imageUrl];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex text-sm text-muted-foreground mb-8">
        <a href="/" className="hover:text-primary transition-colors">Home</a>
        <span className="mx-2">/</span>
        <a href={`/catalog?brand=${product.brandId}`} className="hover:text-primary transition-colors">{product.brandName}</a>
        <span className="mx-2">/</span>
        <a href={`/catalog?category=${product.categoryId}`} className="hover:text-primary transition-colors">{product.categoryName}</a>
        <span className="mx-2">/</span>
        <span className="text-foreground truncate max-w-[200px] sm:max-w-none">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-16 mb-16">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-muted rounded-sm border border-border overflow-hidden relative flex items-center justify-center p-8">
            {product.stock <= 0 && (
              <div className="absolute top-4 left-4 z-10">
                <Badge variant="destructive" className="text-sm px-3 py-1">Out of Stock</Badge>
              </div>
            )}
            <img 
              src={images[activeImage] || `https://placehold.co/800x800/1a1f2c/ef4444?text=${encodeURIComponent(product.name)}`}
              alt={product.name} 
              className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
            />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-4">
              {images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={cn(
                    "aspect-square bg-muted rounded-sm border overflow-hidden p-2 flex items-center justify-center transition-all",
                    activeImage === idx ? "border-primary ring-1 ring-primary" : "border-border hover:border-muted-foreground"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-2">
            <span className="text-sm font-display tracking-widest uppercase text-primary font-bold">{product.brandName}</span>
            <span className="mx-2 text-muted-foreground">•</span>
            <span className="text-sm font-mono text-muted-foreground">SKU: {product.sku}</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold uppercase tracking-tight mb-4 leading-none">
            {product.name}
          </h1>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={cn("w-5 h-5", star <= Math.round(product.rating) ? "fill-primary text-primary" : "text-muted")} 
                />
              ))}
              <span className="ml-2 font-bold">{product.rating.toFixed(1)}</span>
            </div>
            <a href="#reviews" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              ({product.reviewCount} reviews)
            </a>
          </div>
          
          <div className="flex items-end gap-4 mb-8">
            <span className="text-5xl font-mono font-bold tracking-tight">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xl font-mono text-muted-foreground line-through mb-1">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
          
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            {product.description}
          </p>

          <Separator className="mb-8" />

          {/* Action Area */}
          <div className="space-y-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-input rounded-sm bg-background">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-none h-12 w-12 text-muted-foreground hover:text-foreground"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={product.stock <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="w-12 text-center font-mono font-bold text-lg">
                  {quantity}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-none h-12 w-12 text-muted-foreground hover:text-foreground"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={product.stock <= 0 || quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <Button 
                size="lg" 
                className="flex-1 h-12 text-lg border-2 border-primary group"
                onClick={handleAddToCart}
                disabled={product.stock <= 0 || addToCart.isPending}
              >
                <ShoppingCart className="mr-2 h-5 w-5 group-hover:-rotate-12 transition-transform" />
                {product.stock > 0 ? t.product.addToCart : t.product.outOfStock}
              </Button>
              
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-sm shrink-0">
                <Heart className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              {product.stock > 0 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="font-medium text-emerald-500">{t.product.inStock}</span>
                  <span className="text-muted-foreground">— {t.product.shipsWithin24}</span>
                </>
              ) : (
                <span className="font-medium text-destructive">{t.product.outOfStockLong}</span>
              )}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-sm text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display uppercase tracking-wider text-xs font-bold">{t.product.warranty}</div>
                <div className="text-sm text-muted-foreground">{product.warranty || t.product.warrantyDefault}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-sm text-primary">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display uppercase tracking-wider text-xs font-bold">{t.product.shipping}</div>
                <div className="text-sm text-muted-foreground">{t.product.freeShippingThreshold}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 col-span-2">
              <div className="bg-primary/10 p-2 rounded-sm text-primary">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display uppercase tracking-wider text-xs font-bold">{t.product.fitmentGuarantee}</div>
                <div className="text-sm text-muted-foreground">{t.product.fitmentGuaranteeDesc}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="specs" className="w-full">
        <TabsList className="w-full justify-start border-b border-border bg-transparent h-auto p-0 rounded-none overflow-x-auto flex-nowrap">
          <TabsTrigger value="specs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-4 px-6">
            {t.product.tabSpecs}
          </TabsTrigger>
          <TabsTrigger value="fitment" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-4 px-6">
            {t.product.tabFitment}
          </TabsTrigger>
          <TabsTrigger value="reviews" id="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-4 px-6">
            {t.product.tabReviews} ({product.reviewCount})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="specs" className="py-8 animate-in fade-in-50 duration-500">
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-4 max-w-4xl">
            {product.specs ? (
              Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="flex justify-between py-3 border-b border-border">
                  <span className="font-display uppercase tracking-wider text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="font-medium text-right">{value as React.ReactNode}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No specifications available for this product.</p>
            )}
            <div className="flex justify-between py-3 border-b border-border">
              <span className="font-display uppercase tracking-wider text-muted-foreground">Manufacturer</span>
              <span className="font-medium text-right">{product.manufacturer || product.brandName}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-border">
              <span className="font-display uppercase tracking-wider text-muted-foreground">Part Number</span>
              <span className="font-medium text-right font-mono">{product.sku}</span>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="fitment" className="py-8 animate-in fade-in-50 duration-500">
          <div className="max-w-4xl">
            <h3 className="font-display text-xl font-bold uppercase tracking-wider mb-6">{t.product.compatibleVehicles}</h3>
            {product.compatibility && product.compatibility.length > 0 ? (
              <ul className="grid sm:grid-cols-2 gap-3">
                {product.compatibility.map((vehicle, idx) => (
                  <li key={idx} className="flex items-center gap-3 bg-muted/50 p-3 rounded-sm border border-border">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>{vehicle}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">Universal fit or compatibility data not available.</p>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="reviews" className="py-8 animate-in fade-in-50 duration-500">
          <div className="grid md:grid-cols-12 gap-12">
            {/* Reviews List */}
            <div className="md:col-span-7 lg:col-span-8 space-y-8">
              {loadingReviews ? (
                <div className="space-y-6">
                  {[1, 2].map(i => (
                    <div key={i} className="space-y-3">
                      <div className="flex justify-between">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-24" />
                      </div>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ))}
                </div>
              ) : reviews && reviews.length > 0 ? (
                reviews.map(review => (
                  <div key={review.id} className="pb-8 border-b border-border last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center mb-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} className={cn("w-4 h-4", star <= review.rating ? "fill-primary text-primary" : "text-muted")} />
                          ))}
                        </div>
                        <h4 className="font-bold text-lg">{review.title}</h4>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-3">{review.body}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{review.userName}</span>
                      {review.verified && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="flex items-center text-emerald-500 font-medium">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Verified Buyer
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-muted/30 p-8 text-center rounded-sm border border-dashed border-border">
                  <h3 className="font-display font-semibold uppercase tracking-wider text-lg mb-2">No Reviews Yet</h3>
                  <p className="text-muted-foreground">Be the first to review this part.</p>
                </div>
              )}
            </div>

            {/* Write a Review */}
            <div className="md:col-span-5 lg:col-span-4">
              <div className="bg-card border border-border p-6 rounded-sm sticky top-24">
                <h3 className="font-display font-bold text-xl uppercase tracking-wider mb-6">{t.product.writeReview}</h3>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button 
                          key={star} 
                          type="button" 
                          onClick={() => setReviewRating(star)}
                          className="focus:outline-none"
                        >
                          <Star className={cn("w-6 h-6", star <= reviewRating ? "fill-primary text-primary" : "text-muted hover:text-primary/50")} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" required value={reviewName} onChange={e => setReviewName(e.target.value)} placeholder="John D." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Summary</Label>
                    <Input id="title" required value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} placeholder="Perfect fit, easy install" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="review">Review</Label>
                    <textarea 
                      id="review" 
                      required 
                      value={reviewBody}
                      onChange={e => setReviewBody(e.target.value)}
                      className="flex min-h-[100px] w-full rounded-sm border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="What did you like or dislike?"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createReview.isPending}>
                    {createReview.isPending ? "Submitting..." : "Submit Review"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
