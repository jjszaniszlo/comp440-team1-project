import { useApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export function useBlogSearch(

) {
    const api = useApi();

    return useQuery({
        queryKey: ['blog-search'],
    })
}