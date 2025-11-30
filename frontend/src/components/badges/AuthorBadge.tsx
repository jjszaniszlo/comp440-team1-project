import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface AuthorBadgeProps {
  value: string;
  onRemove?: () => void;
}

export function AuthorBadge({ value, onRemove }: AuthorBadgeProps) {
  const badge = (
    <Badge
      variant="outline"
      className="inline-flex items-center gap-1 text-xs align-middle hover:bg-secondary/50 transition-colors"
    >
      @{value}
      {onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="hover:bg-secondary/80 rounded-sm"
          aria-label="Remove author"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );

  if (onRemove) {
    return badge;
  }

  return (
    <Link
      to={`/profile/${value}`}
      className="no-underline"
      onClick={(e) => e.stopPropagation()}
    >
      {badge}
    </Link>
  );
}
