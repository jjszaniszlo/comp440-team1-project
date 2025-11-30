import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUserSearch } from "../hooks";
import { UserList } from "./UserList";
import { Loader2, Search, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function MostBlogsDate() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isSearching, setIsSearching] = useState(false);

  const formattedDate = date ? format(date, "yyyy-MM-dd") : "";

  const { data: users = [], isLoading, refetch } = useUserSearch(
    {
      date: formattedDate,
    },
    isSearching && !!date
  );

  const handleSearch = () => {
    if (date) {
      setIsSearching(true);
      refetch();
    }
  };

  const handleReset = () => {
    setDate(new Date());
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
        <div className="space-y-2">
          <Label>Select Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full max-w-[280px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border shadow-sm"
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSearch}
            disabled={!date || isLoading}
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
              emptyMessage={`No users found who posted blogs on ${date ? format(date, "PPP") : "selected date"}`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
