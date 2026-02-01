import { useState } from "react";
import { SortableHeader } from "../layout/SortableHeader";
import RecipeUpdateForm from "@/components/forms/RecipeUpdateForm";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "../ui/table";
import { calculateRecipeNutritionData } from "../../../utils/calculations/nutrition";
import { RecipeResponse } from "../../../utils/schemas/recipe";
import { useRecipes, useToggleFavorite } from "@/app/hooks/useRecipes";
import { Eye, Heart, Loader2, Pencil, Trash2, ChefHat } from "lucide-react";
import { Button } from "../ui/button";
import RecipeDelete from "@/components/forms/RecipeDelete";
import { Link } from "@/i18n/routing";
type SortableField =
   | "name"
   | "calories"
   | "carbs"
   | "protein"
   | "fat"
   | "rating";

interface RecipesTablesProps {
   searchTerm: string;
   filters: {
      calories: { min: number; max: number };
      protein: { min: number; max: number };
      carbs: { min: number; max: number };
      fat: { min: number; max: number };
   };
   ingredients: string | null;
}

export default function RecipesTables({ searchTerm, filters, ingredients }: RecipesTablesProps) {
   const [sortState, setSortState] = useState<
      | {
           field: SortableField;
           order: "asc" | "desc";
        }
      | undefined
   >(undefined);
   const {
      data,
      isLoading,
      isError,
      refetch,
   } = useRecipes({
      search: searchTerm,
      sortBy: sortState?.field,
      sortOrder: sortState?.order,
      minCalories: filters.calories.min !== 0 ? filters.calories.min : undefined,
      maxCalories: filters.calories.max !== 3000 ? filters.calories.max : undefined,
      minProtein: filters.protein.min !== 0 ? filters.protein.min : undefined,
      maxProtein: filters.protein.max !== 200 ? filters.protein.max : undefined,
      minCarbs: filters.carbs.min !== 0 ? filters.carbs.min : undefined,
      maxCarbs: filters.carbs.max !== 300 ? filters.carbs.max : undefined,
      minFat: filters.fat.min !== 0 ? filters.fat.min : undefined,
      maxFat: filters.fat.max !== 150 ? filters.fat.max : undefined,
      ingredients: ingredients || undefined,
   });

   const recipes = data?.recipes || [];
   const { mutate: toggleFavorite } = useToggleFavorite();
   const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(
      null
   );

   const handleSort = (field: SortableField) => {
      setSortState((prev) => {
         if (!prev || prev.field !== field) {
            return { field, order: "asc" };
         } else if (prev.order === "asc") {
            return { field, order: "desc" };
         } else {
            return { field, order: "asc" };
         }
      });
   };


   const handleToggleFavorite = (id: string, currentFavorite: boolean) => {
      toggleFavorite({ id, isFavorite: !currentFavorite });
   };

   if (isLoading) {
      return (
         <div className="flex justify-center items-center h-80 border border-border rounded-xl bg-white dark:bg-gray-950 shadow-sm">
            <div className="flex flex-col items-center gap-4">
               <Loader2 className="w-12 h-12 animate-spin text-primary" />
               <p className="text-base text-muted-foreground">
                  Loading recipes...
               </p>
            </div>
         </div>
      );
   }

   if (isError) {
      return (
         <div className="flex justify-center items-center h-80 border border-border rounded-xl bg-white dark:bg-gray-950 shadow-sm">
            <div className="text-center flex flex-col gap-4">
               <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                  Error loading recipes
               </p>
               <p className="text-base text-muted-foreground">
                  Please try again later
               </p>
               <Button
                  onClick={() => refetch()}
                  variant="outline"
                  size="sm"
               >
                  Retry
               </Button>
            </div>
         </div>
      );
   }

   if (!recipes || recipes.length === 0) {
      return (
         <div className="flex justify-center items-center h-80 border border-border rounded-xl bg-white dark:bg-gray-950 shadow-sm">
            <div className="text-center flex flex-col items-center gap-3">
               <ChefHat size={48} className="text-muted-foreground" />
               <p className="text-lg font-semibold text-muted-foreground">
                  No recipes found
               </p>
               <p className="text-base text-muted-foreground">
                  Create your first recipe to get started
               </p>
            </div>
         </div>
      );
   }

   return (
      <div className="border border-border rounded-xl overflow-hidden shadow-sm bg-white dark:bg-gray-950">
         <Table>
            <TableHeader>
               <TableRow className="bg-gray-50/80 dark:bg-gray-900/50 hover:bg-gray-50/80 dark:hover:bg-gray-900/50 border-b-2 border-gray-200 dark:border-gray-800 h-16">
                  <SortableHeader
                     field="name"
                     sortState={sortState}
                     onSort={handleSort}>
                     Name
                  </SortableHeader>
                  <SortableHeader
                     field="calories"
                     sortState={sortState}
                     onSort={handleSort}>
                     Calories
                  </SortableHeader>
                  <SortableHeader
                     field="protein"
                     sortState={sortState}
                     onSort={handleSort}>
                     Protein
                  </SortableHeader>
                  <SortableHeader
                     field="carbs"
                     sortState={sortState}
                     onSort={handleSort}>
                     Carbs
                  </SortableHeader>
                  <SortableHeader
                     field="fat"
                     sortState={sortState}
                     onSort={handleSort}>
                     Fat
                  </SortableHeader>
                  <SortableHeader
                     field="rating"
                     sortState={sortState}
                     onSort={handleSort}>
                     Rating
                  </SortableHeader>
                  <TableHead className="text-lg font-semibold text-center">
                     Favorite
                  </TableHead>
                  <TableHead className="text-lg font-semibold text-right">
                     Actions
                  </TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {recipes.map((recipe: RecipeResponse) => {
                  const recipeNutritionData =
                     calculateRecipeNutritionData(recipe);
                  return (
                     <TableRow
                        key={recipe.id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                        <TableCell className="py-8 max-w-xs">
                           <Link
                              href={`/recipes/${recipe.id}`}
                              prefetch={true}
                              className="flex flex-col gap-1.5 hover:opacity-80 transition-opacity">
                              <span className="text-xl font-semibold text-foreground truncate">
                                 {recipe.name}
                              </span>
                              {recipe.description && (
                                 <span className="text-base text-muted-foreground line-clamp-2 leading-relaxed">
                                    {recipe.description}
                                 </span>
                              )}
                           </Link>
                        </TableCell>
                        <TableCell className="py-8">
                           <span className="inline-flex items-center px-4 py-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 font-semibold text-base">
                              {Number(recipeNutritionData.calories).toFixed(1)}
                              kcal
                           </span>
                        </TableCell>
                        <TableCell className="py-8">
                           <span className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-semibold text-base">
                              {Number(recipeNutritionData.protein).toFixed(1)}g
                           </span>
                        </TableCell>
                        <TableCell className="py-8">
                           <span className="inline-flex items-center px-4 py-2 rounded-lg bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 font-semibold text-base">
                              {Number(recipeNutritionData.carbs).toFixed(1)}g
                           </span>
                        </TableCell>
                        <TableCell className="py-8">
                           <span className="inline-flex items-center px-4 py-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 font-semibold text-base">
                              {Number(recipeNutritionData.fat).toFixed(1)}g
                           </span>
                        </TableCell>
                        <TableCell className="py-8">
                           <span className="text-xl font-medium text-muted-foreground">
                              {recipe.rating ? `${recipe.rating}/100` : "—"}
                           </span>
                        </TableCell>
                        <TableCell className="text-center py-8">
                           <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                 handleToggleFavorite(
                                    recipe.id,
                                    recipe.isFavorite || false
                                 )
                              }
                              className="h-12 w-12 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                              <Heart
                                 className={`size-6 transition-all ${
                                    recipe.isFavorite
                                       ? "fill-current text-red-500 scale-110"
                                       : "text-gray-400 hover:text-red-400"
                                 }`}
                              />
                           </Button>
                        </TableCell>
                        <TableCell className="py-8">
                           <div className="flex items-center justify-end gap-2">
                              <RecipeUpdateForm
                                 recipe={recipe}
                                 isOpen={selectedRecipeId === recipe.id}
                                 onOpenChange={(open) => {
                                    setSelectedRecipeId(
                                       open ? recipe.id : null
                                    );
                                 }}
                              >
                                 <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-12 w-12 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                                    <Pencil className="w-5 h-5" />
                                 </Button>
                              </RecipeUpdateForm>
                              <RecipeDelete recipe={recipe}>
                                 <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-12 w-12 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                                    <Trash2 className="w-5 h-5" />
                                 </Button>
                              </RecipeDelete>
                              <Link href={`/recipes/${recipe.id}`} prefetch={true}>
                                 <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-12 w-12 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
                                    <Eye className="w-5 h-5" />
                                 </Button>
                              </Link>
                           </div>
                        </TableCell>
                     </TableRow>
                  );
               })}
            </TableBody>
         </Table>
      </div>
   );
}
