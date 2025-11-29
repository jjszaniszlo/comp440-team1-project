import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserSearch } from "../hooks";
import { UserList } from "./UserList";
import { Loader2, Search } from "lucide-react";

export function NeverPosted() {
  const [isSearching, setIsSearching] = useState(false);

  const { data: users = [], isLoading, refetch } = useUserSearch(
    {
      never_posted_blog: true,
    },
    isSearching
  );

  const handleSearch = () => {
    setIsSearching(true);
    refetch();
  };

  const handleReset = () => {
    setIsSearching(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users Who Never Posted a Blog</CardTitle>
        <CardDescription>
          Display all users who have never posted a blog
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={handleSearch} 
            disabled={isLoading}
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
          {isSearching && (
            <Button variant="outline" onClick={handleReset}>
              Clear Results
            </Button>
          )}
        </div>

        {isSearching && (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Results</h3>
              <span className="text-sm text-muted-foreground">
                {users.length} user{users.length !== 1 ? 's' : ''} found
              </span>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <UserList 
                users={users} 
                emptyMessage="No users found who have never posted a blog"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
