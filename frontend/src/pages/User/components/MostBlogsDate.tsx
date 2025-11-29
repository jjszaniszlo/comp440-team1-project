import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useUserSearch } from "../hooks";
import { UserList } from "./UserList";
import { Loader2, Search, Calendar } from "lucide-react";

export function MostBlogsDate() {
  const [date, setDate] = useState("2025-10-10"); // Default hardcoded date as per requirements
  const [isSearching, setIsSearching] = useState(false);

  const { data: users = [], isLoading, refetch } = useUserSearch(
    {
      date: date,
    },
    isSearching && !!date
  );

  const handleSearch = () => {
    if (date.trim()) {
      setIsSearching(true);
      refetch();
    }
  };

  const handleReset = () => {
    setDate("2025-10-10");
    setIsSearching(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users with Most Blogs on Specific Date</CardTitle>
        <CardDescription>
          Find users who posted the most number of blogs on a specific date. If there is a tie, all users with the maximum count are shown.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-w-md">
          <Label htmlFor="date">Date (YYYY-MM-DD)</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Default: 10/10/2025 (you can change this to any date)
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleSearch} 
            disabled={!date.trim() || isLoading}
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
                emptyMessage={`No users found who posted blogs on ${date}`}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
