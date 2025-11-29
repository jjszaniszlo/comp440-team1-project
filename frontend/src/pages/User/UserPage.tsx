import { SameDayTags } from "./components/SameDayTags";
import { MostBlogsDate } from "./components/MostBlogsDate";
import { FollowedBy } from "./components/FollowedBy";
import { NeverPosted } from "./components/NeverPosted";
import { AllNegativeComments } from "./components/AllNegativeComments";
import { NoNegativeCommentsOnBlogs } from "./components/NoNegativeCommentsOnBlogs";
import { Separator } from "@/components/ui/separator";

export function UserPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Search</h1>
        <p className="text-muted-foreground">
          Search and filter users based on various criteria
        </p>
      </div>

      <div className="space-y-8">
        {/* Users who posted 2 blogs same day with different tags */}
        <SameDayTags />
        
        <Separator />

        {/* Users with most blogs on specific date */}
        <MostBlogsDate />
  
        <Separator />

        {/* Users followed by both X and Y */}
        <FollowedBy />
        
        <Separator />

        {/* Users who never posted a blog */}
        <NeverPosted />

        <Separator />
        
        {/* Users with all negative comments */}
        <AllNegativeComments />
        
        <Separator />

        {/* Users whose blogs never received negative comments */}
        <NoNegativeCommentsOnBlogs />
      </div>
    </div>
  );
}
