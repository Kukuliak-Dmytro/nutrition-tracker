import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import {
   RecipeQuery,
   UpdateRecipe,
   GenerateRecipe,
} from "../../../utils/schemas/recipe";
import {
   createRecipe,
   getRecipes,
   getRecipe,
   updateRecipe,
   deleteRecipe,
   toggleFavorite,
} from "@/app/services/recipes";
import { generateRecipeContent } from "@/app/services/recipe-ai";
import { toast } from "sonner";

export const recipesQueryOptions = (filters: Partial<RecipeQuery> = {}) => {
   return queryOptions({
      queryKey: ["recipes", filters],
      queryFn: () => getRecipes(filters),
      select: (data) => ({
         recipes: data.data,
         totalRecipes: data.totalRecipes
      }),
   });
};

export const useRecipes = (filters: Partial<RecipeQuery> = {}) => {
   return useQuery(recipesQueryOptions(filters));
}

export const recipeQueryOptions = (id: string) => {
   return queryOptions({
      queryKey: ["recipe", id],
      queryFn: () => getRecipe(id),
   });
};

export const useRecipe = (id: string) => {
   return useQuery(recipeQueryOptions(id));
}

export const useCreateRecipe = () => {
   const queryClient = useQueryClient();
   return useMutation({
      mutationKey: ["createRecipe"],
      mutationFn: createRecipe,
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["recipes"] });
         queryClient.invalidateQueries({ queryKey: ["dashboard"] }); // Invalidate dashboard when recipes change
      },
      onError: (error) => {
         toast.error(error instanceof Error ? error.message : "Failed to create recipe");
      },
   });
};

export const useUpdateRecipe = () => {
   const queryClient = useQueryClient();
   return useMutation({
      mutationKey: ["updateRecipe"],
      mutationFn: ({ id, recipe }: { id: string; recipe: UpdateRecipe }) =>
         updateRecipe(id, recipe),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["recipes"] });
         queryClient.invalidateQueries({ queryKey: ["dashboard"] }); // Invalidate dashboard when recipes change
      },
      onError: (error) => {
         toast.error(error instanceof Error ? error.message : "Failed to update recipe");
      },
   });
};

export const useDeleteRecipe = () => {
   const queryClient = useQueryClient();
   return useMutation({
      mutationKey: ["deleteRecipe"],
      mutationFn: deleteRecipe,
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["recipes"] });
         queryClient.invalidateQueries({ queryKey: ["dashboard"] }); // Invalidate dashboard when recipes change
      },
      onError: (error) => {
         toast.error(error instanceof Error ? error.message : "Failed to delete recipe");
      },
   });
};

export const useToggleFavorite = () => {
   const queryClient = useQueryClient();
   return useMutation({
      mutationKey: ["toggleFavorite"],
      mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
         toggleFavorite(id, isFavorite),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["recipes"] });
         queryClient.invalidateQueries({ queryKey: ["dashboard"] }); // Invalidate dashboard when recipes change
      },
      onError: (error) => {
         toast.error(error instanceof Error ? error.message : "Failed to update favorite");
      },
   });
};

export const useGenerateRecipeContent = () => {
   return useMutation({
      mutationKey: ["generateRecipeContent"],
      mutationFn: (payload: GenerateRecipe) => generateRecipeContent(payload),
   })
}