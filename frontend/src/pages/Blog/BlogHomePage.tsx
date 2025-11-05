import { BadgeSearchInput } from "./components/BadgeSearchInput";
import { BlogCard, BlogCardSkeleton } from "./components/BlogCard";
import { Loader2 } from "lucide-react";
import { useBlogHome } from "./hooks";

export function BlogHomePage() {
  const {
    setSearchQuery,
    allBlogs,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    observerTarget,
  } = useBlogHome();

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="container mx-auto px-4 w-full max-w-7xl">
        <BadgeSearchInput onSearchChange={setSearchQuery} />
      </div>

      <div className="container mx-auto px-4 max-w-7xl">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <BlogCardSkeleton key={i} />
            ))}
          </div>
        ) : allBlogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No blogs found</p>
            <p className="text-muted-foreground text-sm mt-2">
              Try adjusting your search filters
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {allBlogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>

            <div ref={observerTarget} className="h-20 flex items-center justify-center mt-4">
              {isFetchingNextPage && (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              )}
            </div>

            {!hasNextPage && allBlogs.length > 0 && (
              <p className="text-center text-muted-foreground text-sm mt-4">
                No more blogs to load
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
