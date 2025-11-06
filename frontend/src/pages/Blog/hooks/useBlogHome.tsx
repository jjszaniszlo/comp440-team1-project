import { useEffect, useRef } from "react";
import { useBlogSearchInfinite } from "@/hooks/queries";
import type { BlogSearchParams } from "@/types";

export function useBlogHome(searchParams?: BlogSearchParams) {
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
    allBlogs,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    observerTarget,
  };
}
