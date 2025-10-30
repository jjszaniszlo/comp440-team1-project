import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff } from "lucide-react";
import { BlogStatus } from "@/types";

interface PublishBadgeProps {
  status: string;
}

export function PublishBadge({ status }: PublishBadgeProps) {
  const isPublished = status === BlogStatus.PUBLISHED;

  return (
    <Badge
      variant={isPublished ? "default" : "secondary"}
      className="flex items-center gap-1 text-xs"
    >
      {isPublished ? (
        <>
          <Eye className="h-3 w-3" />
          Published
        </>
      ) : (
        <>
          <EyeOff className="h-3 w-3" />
          Draft
        </>
      )}
    </Badge>
  );
}
