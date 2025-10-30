import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { FilterBadge } from "./FilterBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TagEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function TagEditor({ tags, onChange }: TagEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const tagRegex = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();

    if (!trimmedTag) {
      setIsAdding(false);
      setNewTag("");
      return;
    }

    if (!tagRegex.test(trimmedTag)) {
      toast.error(
        "Invalid tag format. Tags can only contain letters, numbers, underscores, and hyphens, and must start with a letter or number."
      );
      return;
    }

    if (tags.includes(trimmedTag)) {
      toast.error("Tag already exists");
      setNewTag("");
      return;
    }

    onChange([...tags, trimmedTag]);
    setNewTag("");
    setIsAdding(false);
  };

  const handleRemoveTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === "Escape") {
      setNewTag("");
      setIsAdding(false);
    }
  };

  const handleBlur = () => {
    handleAddTag();
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {tags.map((tag, index) => (
        <FilterBadge
          key={`${tag}-${index}`}
          value={tag}
          onRemove={() => handleRemoveTag(index)}
        />
      ))}
      {isAdding ? (
        <Input
          ref={inputRef}
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Enter tag..."
          className="w-32 h-5 text-xs"
        />
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="h-7 px-2"
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
