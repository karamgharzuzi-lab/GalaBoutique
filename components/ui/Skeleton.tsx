import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-brand-cream-dark rounded-xl",
        className
      )}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <Skeleton className="w-full aspect-[3/4]" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-1 pt-1">
          <Skeleton className="w-5 h-5 rounded-full" />
          <Skeleton className="w-5 h-5 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="w-full aspect-square" />
      <div className="px-4 space-y-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <div className="flex gap-2 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-14 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
