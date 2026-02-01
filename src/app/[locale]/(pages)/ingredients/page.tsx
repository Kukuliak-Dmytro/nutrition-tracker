import { getQueryClient } from "@/lib/queryClient";
import { ingredientsQueryOptions } from "@/app/hooks/useIngredients";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import IngredientsPageClient from "@/components/ingredients/IngredientsPageClient";

export default async function IngredientsPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery(ingredientsQueryOptions())

  return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <IngredientsPageClient />
      </HydrationBoundary>
  );
}

