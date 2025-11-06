import { useState, useEffect } from "react";
import type { BlogSearchParams } from "@/types";

export function useBlogSearch() {
  const [tags, setTags] = useState<string[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState<BlogSearchParams["sort_by"]>("relevance");
  const [sortOrder, setSortOrder] = useState<BlogSearchParams["sort_order"]>("desc");
  const [tagsMatchAll, setTagsMatchAll] = useState(false);
  const [debouncedParams, setDebouncedParams] = useState<BlogSearchParams>({});

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const hasContent =
        tags.length > 0 ||
        authors.length > 0 ||
        searchText.length >= 3;

      if (!hasContent) {
        setDebouncedParams({});
        return;
      }

      const params: BlogSearchParams = {
        search: searchText.length >= 3 ? searchText : undefined,
        tags: tags.length > 0 ? tags : undefined,
        authors: authors.length > 0 ? authors : undefined,
        tags_match_all: tags.length > 1 ? tagsMatchAll : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      setDebouncedParams(params);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [tags, authors, searchText, tagsMatchAll, sortBy, sortOrder]);

  const badgeRegex = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

  function createBadgeFromToken(token: string, allTokens: string[]): boolean {
    const prefix = token[0];
    const isTag = prefix === "#";
    const badgeValue = token.substring(1);

    const alreadyExists = isTag
      ? tags.includes(badgeValue)
      : authors.includes(badgeValue);

    if (badgeRegex.test(badgeValue) && !alreadyExists) {
      if (isTag) {
        setTags([...tags, badgeValue]);
      } else {
        setAuthors([...authors, badgeValue]);
      }

      const remainingTokens = allTokens.slice(0, -1);
      const newInput = remainingTokens.join(" ");
      setCurrentInput(newInput);

      const textOnly = remainingTokens.filter(t => !t.startsWith("#") && !t.startsWith("@")).join(" ");
      setSearchText(textOnly);
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
    setSearchText(textTokens.join(" "));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && currentInput === "") {
      e.preventDefault();
      if (authors.length > 0) {
        setAuthors(authors.slice(0, -1));
      } else if (tags.length > 0) {
        setTags(tags.slice(0, -1));
      }
    }
  }

  const searchParams = Object.keys(debouncedParams).length > 0 ? debouncedParams : undefined;

  const inputProps = {
    tags,
    authors,
    currentInput,
    onInputChange: handleInputChange,
    onKeyDown: handleKeyDown,
    onTagsChange: setTags,
    onAuthorsChange: setAuthors,
  };

  return {
    inputProps,
    searchParams,
    sortBy,
    sortOrder,
    tagsMatchAll,
    setSortBy,
    setSortOrder,
    setTagsMatchAll,
  };
}
