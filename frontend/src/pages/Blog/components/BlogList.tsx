import type { BlogSearchResponse } from "@/types";
import { BlogCard, BlogCardSkeleton } from "./BlogCard";

interface BlogListProps {
  blogs: BlogSearchResponse[];
  isLoading: boolean;
}

function BlogListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <BlogCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function BlogList({ blogs, isLoading }: BlogListProps) {
  if (isLoading) {
    return <BlogListSkeleton />;
  }

  if (blogs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">No blogs found</p>
        <p className="text-muted-foreground text-sm mt-2">
          Try adjusting your search filters
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {blogs.map((blog) => (
        <BlogCard key={blog.id} blog={blog} />
      ))}
    </div>
  );
}
