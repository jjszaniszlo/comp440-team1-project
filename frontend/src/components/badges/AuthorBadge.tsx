import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface AuthorBadgeProps {
  value: string;
  onRemove?: () => void;
}

export function AuthorBadge({ value, onRemove }: AuthorBadgeProps) {
  return (
    <Badge
      variant="outline"
      className="inline-flex items-center gap-1 text-xs align-middle"
    >
      @{value}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:bg-secondary/80 rounded-sm"
          aria-label="Remove author"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}
