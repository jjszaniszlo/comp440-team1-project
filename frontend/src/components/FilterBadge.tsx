import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export type BadgeType = "tag" | "author";

interface FilterBadgeProps {
  value: string;
  type?: BadgeType;
  onRemove?: () => void;
}

export function FilterBadge({ value, type = "tag", onRemove }: FilterBadgeProps) {
  const prefix = type === "tag" ? "#" : "@";
  const variant = type === "tag" ? "secondary" : "outline";

  return (
    <Badge
      variant={variant}
      className="flex items-center gap-1 text-xs"
    >
      {prefix}{value}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:bg-secondary/80 rounded-sm"
          aria-label="Remove tag"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}
