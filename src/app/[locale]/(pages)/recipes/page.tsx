import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queryClient";
import { recipesQueryOptions } from "@/app/hooks/useRecipes";
import RecipesPageClient from "@/components/recipes/RecipesPageClient";

export default async function RecipesPage() {
   const queryClient = getQueryClient();
   await queryClient.prefetchQuery(recipesQueryOptions());

   return (
      <HydrationBoundary state={dehydrate(queryClient)}>
         <RecipesPageClient />
      </HydrationBoundary>
   );
}

