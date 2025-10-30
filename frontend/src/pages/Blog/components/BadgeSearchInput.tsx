import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import type { SearchQuery } from "@/types";
import { useState, useRef } from "react";
import { FilterBadge } from "@/components/FilterBadge";

type BadgeItem = {
  type: "tag" | "author";
  value: string;
};

interface BadgeSearchInputProps {
  onSearchChange: (query: SearchQuery) => void;
  placeholder?: string;
}

export function BadgeSearchInput({ onSearchChange, placeholder = "Search by #tags, @authors, or text..." }: BadgeSearchInputProps) {
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [parsedQuery, setParsedQuery] = useState<SearchQuery>({
    tags: [],
    authors: [],
    text: "",
  });
  const [currentInput, setCurrentInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const badgeRegex = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

  function updateParsedQueryFromBadges(newBadges: BadgeItem[], text: string = parsedQuery.text) {
    const tags = newBadges.filter(b => b.type === "tag").map(b => b.value);
    const authors = newBadges.filter(b => b.type === "author").map(b => b.value);
    const newQuery = { tags, authors, text };
    setParsedQuery(newQuery);
    onSearchChange(newQuery);
  }

  function createBadgeFromToken(token: string, allTokens: string[]): boolean {
    const prefix = token[0];
    const badgeType: "tag" | "author" = prefix === "#" ? "tag" : "author";
    const badgeValue = token.substring(1);

    if (badgeRegex.test(badgeValue) && !badges.some(b => b.type === badgeType && b.value === badgeValue)) {
      const newBadges = [...badges, { type: badgeType, value: badgeValue }];
      setBadges(newBadges);

      const remainingTokens = allTokens.slice(0, -1);
      const newInput = remainingTokens.join(" ");
      setCurrentInput(newInput);

      const textOnly = remainingTokens.filter(t => !t.startsWith("#") && !t.startsWith("@")).join(" ");
      updateParsedQueryFromBadges(newBadges, textOnly);
      return true;
    }
    return false;
  }

  function handleInputChange(value: string) {
    const lastChar = value.slice(-1);
    const isDelimiter = lastChar === " " || lastChar === ",";

    if (isDelimiter && value.trim().length > 0) {
      const allTokens = value.split(/[\s,]+/).filter(t => t.length > 0);

      if (allTokens.length > 0) {
        const lastToken = allTokens[allTokens.length - 1];

        if ((lastToken.startsWith("#") || lastToken.startsWith("@")) && lastToken.length > 1) {
          if (createBadgeFromToken(lastToken, allTokens)) {
            return;
          }
        }
      }
    }

    setCurrentInput(value);

    const tokens = value.split(/[\s,]+/).filter(t => t.length > 0);
    const textTokens = tokens.filter(t => !t.startsWith("#") && !t.startsWith("@"));
    updateParsedQueryFromBadges(badges, textTokens.join(" "));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && currentInput === "" && badges.length > 0) {
      e.preventDefault();
      const newBadges = badges.slice(0, -1);
      setBadges(newBadges);
      updateParsedQueryFromBadges(newBadges);
    }
  }

  function removeBadge(index: number) {
    const newBadges = badges.filter((_, i) => i !== index);
    setBadges(newBadges);
    updateParsedQueryFromBadges(newBadges);
    inputRef.current?.focus();
  }

  return (
    <InputGroup className="h-auto min-h-[42px] flex-wrap gap-2 py-2">
      {badges.length > 0 && (
        <InputGroupAddon align="inline-start" className="flex-wrap gap-2">
          {badges.map((badge, index) => (
            <FilterBadge
              key={`${badge.type}-${badge.value}-${index}`}
              value={badge.value}
              type={badge.type}
              onRemove={() => removeBadge(index)}
            />
          ))}
        </InputGroupAddon>
      )}
      <InputGroupInput
        ref={inputRef}
        type="text"
        placeholder={badges.length === 0 ? placeholder : ""}
        value={currentInput}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-w-[120px]"
      />
    </InputGroup>
  );
}
