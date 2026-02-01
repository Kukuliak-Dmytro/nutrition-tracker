import CookingHistoryContentClient from "@/components/cooking-history/CookingHistoryContentClient";
import { getQueryClient } from "@/lib/queryClient";
import { cookingHistoryQueryOptions } from "@/app/hooks/useCookingHistory";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

export default async function CookingHistoryPage() {
   const queryClient = getQueryClient();
   await queryClient.prefetchInfiniteQuery(cookingHistoryQueryOptions());

   return (
      <HydrationBoundary state={dehydrate(queryClient)}>
         <CookingHistoryContentClient />
      </HydrationBoundary>
   );
}

