import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { useMemo } from "react";
import { BadgeEditor, TagBadge, AuthorBadge } from "@/components/badges";
import { Search, Tag, User } from "lucide-react";

interface BlogSearchInputProps {
  tags: string[];
  authors: string[];
  currentInput: string;
  onInputChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onTagsChange: (tags: string[]) => void;
  onAuthorsChange: (authors: string[]) => void;
  placeholder?: string;
}

export function BlogSearchInput({
  tags,
  authors,
  currentInput,
  onInputChange,
  onKeyDown,
  onTagsChange,
  onAuthorsChange,
  placeholder = "Search blogs by subject..."
}: BlogSearchInputProps) {
  const tagConfig = useMemo(() => ({
    type: 'tag' as const,
    placeholder: 'Add tag...',
    invalidMessage: 'Invalid tag format. Tags can only contain letters, numbers, underscores, and hyphens.',
    duplicateMessage: 'Tag already added',
    BadgeComponent: TagBadge,
  }), []);

  const authorConfig = useMemo(() => ({
    type: 'author' as const,
    placeholder: 'Add author...',
    invalidMessage: 'Invalid author format. Authors can only contain letters, numbers, underscores, and hyphens.',
    duplicateMessage: 'Author already added',
    BadgeComponent: AuthorBadge,
  }), []);

  return (
    <InputGroup className="!flex-row flex-wrap">
      <InputGroupAddon align="inline-start">
        <Search className="h-4 w-4" />
      </InputGroupAddon>
      <InputGroupInput
        type="text"
        placeholder={placeholder}
        value={currentInput}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="!pt-1.5"
      />
      <InputGroupAddon align="block-end" className="!w-full !order-[100] !flex-col !items-start gap-2">
        <div className="flex items-center gap-2">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          <BadgeEditor
            config={tagConfig}
            values={tags}
            onChange={onTagsChange}
          />
        </div>
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <BadgeEditor
            config={authorConfig}
            values={authors}
            onChange={onAuthorsChange}
          />
        </div>
      </InputGroupAddon>
    </InputGroup>
  );
}

