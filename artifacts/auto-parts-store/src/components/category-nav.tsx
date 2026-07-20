import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { ChevronDown, ChevronRight, Settings2, Droplets, Car, CircleDot, Wrench, Gauge, Zap, Sun, Thermometer, GitFork, Wind, Shield, PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/language-context";

export type CategoryNode = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  sortOrder: number;
  productCount: number;
  children: CategoryNode[];
};

const TOP_LEVEL_ICONS: Record<string, React.ReactNode> = {
  "auto-parts": <Settings2 className="h-4 w-4 shrink-0" />,
  "oils-fluids": <Droplets className="h-4 w-4 shrink-0" />,
  "car-accessories": <Car className="h-4 w-4 shrink-0" />,
  "tires-wheels": <CircleDot className="h-4 w-4 shrink-0" />,
  "tools-garage": <Wrench className="h-4 w-4 shrink-0" />,
  "performance-parts": <Gauge className="h-4 w-4 shrink-0" />,
};

// Subcategory icons for visual richness
const SUB_ICONS: Record<string, React.ReactNode> = {
  "engine-parts": <Settings2 className="h-3.5 w-3.5 shrink-0 opacity-70" />,
  "brakes": <CircleDot className="h-3.5 w-3.5 shrink-0 opacity-70" />,
  "suspension-steering": <GitFork className="h-3.5 w-3.5 shrink-0 opacity-70" />,
  "electrical": <Zap className="h-3.5 w-3.5 shrink-0 opacity-70" />,
  "lighting": <Sun className="h-3.5 w-3.5 shrink-0 opacity-70" />,
  "cooling-system": <Thermometer className="h-3.5 w-3.5 shrink-0 opacity-70" />,
  "transmission-drivetrain": <GitFork className="h-3.5 w-3.5 shrink-0 opacity-70" />,
  "exhaust-system": <Wind className="h-3.5 w-3.5 shrink-0 opacity-70" />,
  "body-parts": <Car className="h-3.5 w-3.5 shrink-0 opacity-70" />,
  "interior-accessories": <PackageOpen className="h-3.5 w-3.5 shrink-0 opacity-70" />,
  "exterior-electronics": <Shield className="h-3.5 w-3.5 shrink-0 opacity-70" />,
};

interface CategoryNavProps {
  tree: CategoryNode[];
  activeCategorySlug: string;
  onSelect: (slug: string) => void;
}

function SubCategoryItem({
  cat,
  depth,
  activeCategorySlug,
  onSelect,
  defaultOpen,
}: {
  cat: CategoryNode;
  depth: number;
  activeCategorySlug: string;
  onSelect: (slug: string) => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isActive = activeCategorySlug === cat.slug;
  const hasChildren = cat.children.length > 0;

  // Auto-open if any child is active
  useEffect(() => {
    if (cat.children.some(c => c.slug === activeCategorySlug || c.children?.some(gc => gc.slug === activeCategorySlug))) {
      setOpen(true);
    }
  }, [activeCategorySlug]);

  const indent = depth === 1 ? "ps-4" : "ps-7";

  return (
    <div>
      <button
        onClick={() => {
          onSelect(cat.slug);
          if (hasChildren) setOpen(!open);
        }}
        className={cn(
          "w-full flex items-center justify-between gap-2 text-start py-1.5 pr-2 text-sm transition-colors rounded-sm group",
          indent,
          isActive
            ? "text-primary font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span className="flex items-center gap-2 min-w-0">
          {depth === 1 && SUB_ICONS[cat.slug]}
          <span className="truncate">{cat.name}</span>
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          {cat.productCount > 0 && (
            <span className={cn(
              "text-[10px] font-mono tabular-nums",
              isActive ? "text-primary" : "text-muted-foreground/60"
            )}>
              {cat.productCount}
            </span>
          )}
          {hasChildren && (
            open
              ? <ChevronDown className="h-3 w-3 opacity-50" />
              : <ChevronRight className="h-3 w-3 opacity-50" />
          )}
        </span>
      </button>

      {hasChildren && open && (
        <div className="border-s border-border/30 ms-4">
          {cat.children.map(child => (
            <SubCategoryItem
              key={child.id}
              cat={child}
              depth={depth + 1}
              activeCategorySlug={activeCategorySlug}
              onSelect={onSelect}
              defaultOpen={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryNav({ tree, activeCategorySlug, onSelect }: CategoryNavProps) {
  const t = useT();
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    // Auto-open the section that contains the active category
    const initial = new Set<string>();
    for (const top of tree) {
      if (top.slug === activeCategorySlug) {
        initial.add(top.slug);
      }
      for (const sub of top.children) {
        if (sub.slug === activeCategorySlug || sub.children?.some(l => l.slug === activeCategorySlug)) {
          initial.add(top.slug);
        }
      }
    }
    return initial;
  });

  const toggleSection = (slug: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  return (
    <div className="space-y-0.5">
      {/* All Products */}
      <button
        onClick={() => onSelect("")}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-sm transition-colors",
          !activeCategorySlug
            ? "text-primary bg-primary/10"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
        )}
      >
        <span>{t.catalog.allCategories}</span>
      </button>

      {/* Main category sections */}
      {tree.map((top) => {
        const isTopActive = activeCategorySlug === top.slug;
        const isOpen = openSections.has(top.slug);

        return (
          <div key={top.id}>
            {/* Top-level section header */}
            <div
              className={cn(
                "flex items-center gap-2 rounded-sm transition-colors",
                isTopActive ? "bg-primary/10" : ""
              )}
            >
              <button
                onClick={() => onSelect(top.slug)}
                className={cn(
                  "flex-1 flex items-center gap-2 px-3 py-2 text-sm font-display font-bold uppercase tracking-wider text-start transition-colors rounded-s-sm",
                  isTopActive ? "text-primary" : "text-foreground/80 hover:text-primary"
                )}
              >
                {TOP_LEVEL_ICONS[top.slug]}
                <span className="truncate">{top.name}</span>
                {top.productCount > 0 && (
                  <span className={cn(
                    "text-[10px] font-mono font-normal normal-case tracking-normal ms-auto",
                    isTopActive ? "text-primary" : "text-muted-foreground/50"
                  )}>
                    {top.productCount}
                  </span>
                )}
              </button>
              {top.children.length > 0 && (
                <button
                  onClick={() => toggleSection(top.slug)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-e-sm"
                  aria-label={isOpen ? "Collapse" : "Expand"}
                >
                  {isOpen
                    ? <ChevronDown className="h-3.5 w-3.5" />
                    : <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>

            {/* Children */}
            {isOpen && top.children.length > 0 && (
              <div className="mb-1 border-s border-border/40 ms-5 ps-0">
                {top.children.map(child => (
                  <SubCategoryItem
                    key={child.id}
                    cat={child}
                    depth={1}
                    activeCategorySlug={activeCategorySlug}
                    onSelect={onSelect}
                    defaultOpen={
                      child.slug === activeCategorySlug ||
                      child.children?.some(l => l.slug === activeCategorySlug)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
