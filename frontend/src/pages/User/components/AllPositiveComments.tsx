import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface BlogSearchResponse {
  id: number;
  author_username: string;
  subject: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse {
  items: BlogSearchResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

async function searchBlogsAllPositive(username: string): Promise<BlogSearchResponse[]> {
  const queryParams = new URLSearchParams();
  queryParams.append('authors', username);
  queryParams.append('all_positive_comments', 'true');
  queryParams.append('page', '1');
  queryParams.append('size', '100');

  const endpoint = `/blog/search?${queryParams.toString()}`;
  const response = await api.get<PaginatedResponse>(endpoint, false);
  return response.items;
}

export function AllPositiveComments() {
  const [username, setUsername] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const { data: blogs = [], isLoading, refetch } = useQuery({
    queryKey: ['blogs', 'all-positive', username],
    queryFn: () => searchBlogsAllPositive(username),
    enabled: isSearching && !!username,
    staleTime: 30000,
  });

  const handleSearch = () => {
    if (username.trim()) {
      setIsSearching(true);
      refetch();
    }
  };

  const handleReset = () => {
    setUsername("");
    setIsSearching(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blogs with All Positive Comments</CardTitle>
        <CardDescription>
          List all blogs of a user where ALL comments are positive (blogs must have at least one comment, and no negative comments)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-w-md">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleSearch} 
            disabled={!username.trim() || isLoading}
            className="flex-1 md:flex-initial"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
        </div>

        {isSearching && (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Results</h3>
              <span className="text-sm text-muted-foreground">
                {blogs.length} blog{blogs.length !== 1 ? 's' : ''} found
              </span>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No blogs found for "{username}" with all positive comments
              </div>
            ) : (
              <div className="space-y-3">
                {blogs.map((blog) => (
                  <Card key={blog.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-lg">{blog.subject}</h4>
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 whitespace-nowrap">
                            ✓ All Positive
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>by {blog.author_username}</span>
                          <span>•</span>
                          <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                        </div>
                        {blog.tags && blog.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {blog.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
