import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUserSearch } from "../hooks";
import { UserList } from "./UserList";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface ActivityDatesResponse {
  dates: string[];
}

async function fetchActivityDates(startDate: string, endDate: string): Promise<string[]> {
  const response = await api.get<ActivityDatesResponse>(
    `/blog/activity-dates?start_date=${startDate}&end_date=${endDate}`,
    false
  );
  return response.dates;
}

export function MostBlogsDate() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [month, setMonth] = useState<Date>(new Date());

  const formattedDate = date ? format(date, "yyyy-MM-dd") : "";

  // Fetch activity dates for the currently displayed month
  const { data: activityDates = [] } = useQuery({
    queryKey: ['blog-activity-dates', format(month, "yyyy-MM")],
    queryFn: () => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      return fetchActivityDates(format(start, "yyyy-MM-dd"), format(end, "yyyy-MM-dd"));
    },
    staleTime: 60000, // Cache for 1 minute
  });

  // Convert activity dates strings to Date objects for comparison
  const activityDateSet = useMemo(() => {
    return new Set(activityDates.map(d => d));
  }, [activityDates]);

  // Disable dates that don't have any blog activity
  const disabledDays = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd");
    return !activityDateSet.has(dayStr);
  };

  // Search automatically when date is selected
  const { data: users = [], isLoading } = useUserSearch(
    {
      date: formattedDate,
    },
    !!date
  );

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
                {date ? format(date, "PPP") : "Pick a date with activity"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                month={month}
                onMonthChange={setMonth}
                disabled={disabledDays}
                toMonth={new Date()}
                className="rounded-md border shadow-sm"
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-muted-foreground">
            Only dates with blog activity are selectable
          </p>
        </div>

        {date && (
          <div className="mt-2">
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
              emptyMessage={`No users found who posted blogs on ${format(date, "PPP")}`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
