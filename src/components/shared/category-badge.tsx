import { getCategoryMeta } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function CategoryBadge({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const meta = getCategoryMeta(category);
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-background/70 backdrop-blur-sm border border-border-strong px-3 py-1 text-xs font-medium text-foreground",
        className
      )}
    >
      <Icon className="size-3.5 text-primary" />
      {meta.label}
    </span>
  );
}
