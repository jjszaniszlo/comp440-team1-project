import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface TagBadgeProps {
  value: string;
  onRemove?: () => void;
}

export function TagBadge({ value, onRemove }: TagBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className="inline-flex items-center gap-1 text-xs align-middle"
    >
      #{value}
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
