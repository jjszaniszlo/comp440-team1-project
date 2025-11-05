import type { SearchQuery } from "@/types";
import { BadgeSearchInput } from "./components/BadgeSearchInput";

export function BlogHomePage() {
  function handleSearchChange(query: SearchQuery) {
    const { tags, authors, text } = query;

    console.log("Search parameters:", { tags, authors, text });
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="container mx-auto px-4 w-full">
        <BadgeSearchInput onSearchChange={handleSearchChange} />
      </div>

      <div className="container mx-auto px-4 mt-4">
        <p className="text-muted-foreground text-center">
          Blog results will appear here
        </p>
      </div>
    </div>
  );
}
