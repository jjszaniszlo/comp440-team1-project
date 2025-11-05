import { useState, useEffect, useRef } from "react";
import { useBlogSearchInfinite } from "@/hooks/queries";
import type { SearchQuery, BlogSearchParams } from "@/types";

export function useBlogHome() {
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({
    tags: [],
    authors: [],
    text: "",
  });

  const hasContent =
    searchQuery.tags.length > 0 ||
    searchQuery.authors.length > 0 ||
    searchQuery.text.length >= 3;

  const searchParams: BlogSearchParams | undefined = hasContent
    ? {
        search: searchQuery.text.length >= 3 ? searchQuery.text : undefined,
        tags: searchQuery.tags.length > 0 ? searchQuery.tags : undefined,
        authors: searchQuery.authors.length > 0 ? searchQuery.authors : undefined,
      }
    : undefined;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useBlogSearchInfinite(searchParams);

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const allBlogs = data?.pages.flatMap((page) => page.items) ?? [];

  return {
    // State
    searchQuery,
    setSearchQuery,

    // Query state
    allBlogs,
    isLoading,
    hasNextPage,
    isFetchingNextPage,

    // Refs
    observerTarget,
  };
}
