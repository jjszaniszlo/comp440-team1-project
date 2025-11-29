import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useUserSearch } from "../hooks";
import { UserList } from "./UserList";
import { Loader2, Search } from "lucide-react";

export function FollowedBy() {
  const [usernameX, setUsernameX] = useState("");
  const [usernameY, setUsernameY] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const { data: users = [], isLoading, refetch } = useUserSearch(
    {
      followed_by: [usernameX, usernameY],
    },
    isSearching && !!usernameX && !!usernameY
  );

  const handleSearch = () => {
    if (usernameX.trim() && usernameY.trim()) {
      setIsSearching(true);
      refetch();
    }
  };

  const handleReset = () => {
    setUsernameX("");
    setUsernameY("");
    setIsSearching(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users Followed by Both X and Y</CardTitle>
        <CardDescription>
          Find users who are followed by both username X and username Y
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="usernameX">Username X</Label>
            <Input
              id="usernameX"
              placeholder="Enter first username"
              value={usernameX}
              onChange={(e) => setUsernameX(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="usernameY">Username Y</Label>
            <Input
              id="usernameY"
              placeholder="Enter second username"
              value={usernameY}
              onChange={(e) => setUsernameY(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleSearch} 
            disabled={!usernameX.trim() || !usernameY.trim() || isLoading}
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
                emptyMessage={`No users found who are followed by both "${usernameX}" and "${usernameY}"`}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
