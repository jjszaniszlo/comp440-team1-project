import { TagBadge, AuthorBadge } from "@/components/badges";
import type { ReactNode } from "react";

const TAG_REGEX = /#([a-zA-Z0-9][a-zA-Z0-9_-]*)/g;
const AUTHOR_REGEX = /@([a-zA-Z0-9][a-zA-Z0-9_-]*)/g;

interface TextWithBadgesProps {
  text: string;
  className?: string;
}

export function TextWithBadges({ text, className }: TextWithBadgesProps) {
  const parts: ReactNode[] = [];
  const matches: Array<{ index: number; length: number; type: 'tag' | 'author'; value: string }> = [];

  let match;
  const tagRegex = new RegExp(TAG_REGEX);
  while ((match = tagRegex.exec(text)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'tag',
      value: match[1],
    });
  }

  const authorRegex = new RegExp(AUTHOR_REGEX);
  while ((match = authorRegex.exec(text)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'author',
      value: match[1],
    });
  }

  if (matches.length === 0) {
    return <span className={className}>{text}</span>;
  }

  matches.sort((a, b) => a.index - b.index);

  let lastIndex = 0;

  matches.forEach((match, idx) => {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    if (match.type === 'tag') {
      parts.push(
        <span key={`tag-${idx}-${match.value}`} className="inline-flex items-center mx-1">
          <TagBadge value={match.value} />
        </span>
      );
    } else {
      parts.push(
        <span key={`author-${idx}-${match.value}`} className="inline-flex items-center mx-1">
          <AuthorBadge value={match.value} />
        </span>
      );
    }

    lastIndex = match.index + match.length;
  });

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <span className={className}>{parts}</span>;
}
