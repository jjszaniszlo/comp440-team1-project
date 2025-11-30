import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useUserSearch } from "../hooks";
import { UserList } from "./UserList";
import { Loader2, Search } from "lucide-react";

export function SameDayTags() {
  const [tagX, setTagX] = useState("");
  const [tagY, setTagY] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const { data: users = [], isLoading, refetch } = useUserSearch(
    {
      tags: [tagX, tagY],
      same_day_tags: true,
    },
    isSearching && !!tagX && !!tagY
  );

  const handleSearch = () => {
    if (tagX.trim() && tagY.trim()) {
      setIsSearching(true);
      refetch();
    }
  };

  const handleReset = () => {
    setTagX("");
    setTagY("");
    setIsSearching(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users with Two Blogs on Same Day</CardTitle>
        <CardDescription>
          Find users who posted at least two blogs on the same day, where one blog has tag X and another has tag Y
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tagX">Tag X</Label>
            <Input
              id="tagX"
              placeholder="Enter first tag"
              value={tagX}
              onChange={(e) => setTagX(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tagY">Tag Y</Label>
            <Input
              id="tagY"
              placeholder="Enter second tag"
              value={tagY}
              onChange={(e) => setTagY(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleSearch} 
            disabled={!tagX.trim() || !tagY.trim() || isLoading}
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
              {!isLoading && (
                <span className="text-sm text-muted-foreground">
                  {users.length} user{users.length !== 1 ? 's' : ''} found
                </span>
              )}
            </div>
            <UserList
              users={users}
              isLoading={isLoading}
              emptyMessage={`No users found who posted blogs with both tags "${tagX}" and "${tagY}" on the same day`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
