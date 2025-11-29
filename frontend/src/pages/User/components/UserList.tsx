import type { UserLite } from "../hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface UserListProps {
  users: UserLite[];
  emptyMessage?: string;
}

export function UserList({ users, emptyMessage = "No users found" }: UserListProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {users.map((user) => (
        <Card key={user.username} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.username}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
