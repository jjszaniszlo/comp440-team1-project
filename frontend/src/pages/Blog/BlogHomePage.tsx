import type { SearchQuery } from "@/types";
import { useState } from "react";
import { BadgeSearchInput } from "./components/BadgeSearchInput";

export function BlogHomePage() {
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({
    tags: [],
    authors: [],
    text: "",
  });

  function handleSearchChange(query: SearchQuery) {
    setSearchQuery(query);
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
