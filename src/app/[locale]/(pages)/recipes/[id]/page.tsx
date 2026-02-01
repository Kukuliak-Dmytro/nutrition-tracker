import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queryClient";
import { recipeQueryOptions } from "@/app/hooks/useRecipes";
import RecipePageClient from "@/components/recipes/RecipePageClient";
import { notFound } from "next/navigation";

export default async function RecipePage({
   params,
}: {
   params: Promise<{ id: string; locale: string }>;
}) {
   const { id } = await params;
   const queryClient = getQueryClient();
   
   try {
      await queryClient.prefetchQuery(recipeQueryOptions(id));
   } catch {
      notFound();
   }

   return (
      <HydrationBoundary state={dehydrate(queryClient)}>
         <RecipePageClient recipeId={id} />
      </HydrationBoundary>
   );
}

