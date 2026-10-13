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
import {
   calculateRecipeNutritionData,
   calculateCookedNutritionPer100g,
} from "../../../utils/calculations/nutrition";
import { RecipeResponse, RecipeStatus } from "../../../utils/schemas/recipe";
import { useRecipes, useToggleRecipeStatus } from "@/app/hooks/useRecipes";
import { Loader2, Pencil, Trash2, ChefHat, Archive, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import RecipeDelete from "@/components/forms/RecipeDelete";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type SortableField = "name" | "cookedWeightGrams";

interface RecipesTablesProps {
   searchTerm: string;
   statusFilter?: RecipeStatus | "ALL";
   filters: {
      calories: { min: number; max: number };
      protein: { min: number; max: number };
      carbs: { min: number; max: number };
      fat: { min: number; max: number };
   };
   ingredients: string | null;
}

export default function RecipesTables({
   searchTerm,
   statusFilter,
   filters,
   ingredients,
}: RecipesTablesProps) {
   const t = useTranslations("recipes");
   const tMeals = useTranslations("meals");
   const tToast = useTranslations("toast");
   const [sortState, setSortState] = useState<
      | {
           field: SortableField;
           order: "asc" | "desc";
        }
      | undefined
   >(undefined);

   const status = statusFilter && statusFilter !== "ALL" ? statusFilter : undefined;

   const { data, isLoading, isError, refetch } = useRecipes({
      search: searchTerm,
      status: status,
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
   const { mutate: toggleStatus } = useToggleRecipeStatus();
   const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

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

   const handleToggleStatus = (recipe: RecipeResponse) => {
      const nextStatus = recipe.status === "RECENT" ? "ARCHIVED" : "RECENT";
      toggleStatus(
         { id: recipe.id, status: nextStatus },
         {
            onSuccess: () => {
               toast.success(
                  nextStatus === "ARCHIVED"
                     ? tToast("recipeArchived", { name: recipe.name })
                     : tToast("recipeRestored", { name: recipe.name })
               );
            },
         }
      );
   };

   if (isLoading) {
      return (
         <div className="flex justify-center items-center h-80 border border-border rounded-xl bg-card shadow-sm">
            <div className="flex flex-col items-center gap-4">
               <Loader2 className="w-12 h-12 animate-spin text-primary" />
               <p className="text-base text-muted-foreground">{t("loadingDishes")}</p>
            </div>
         </div>
      );
   }

   if (isError) {
      return (
         <div className="flex justify-center items-center h-80 border border-border rounded-xl bg-card shadow-sm">
            <div className="flex flex-col items-center gap-4">
               <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {t("errorLoadingDishes")}
               </p>
               <Button onClick={() => refetch()} variant="outline">
                  {t("tryAgain")}
               </Button>
            </div>
         </div>
      );
   }

   if (recipes.length === 0) {
      return (
         <div className="flex justify-center items-center h-80 border border-border rounded-xl bg-card shadow-sm">
            <div className="flex flex-col items-center gap-3">
               <ChefHat className="text-muted-foreground" size={48} />
               <p className="text-lg font-medium text-muted-foreground">
                  {t("noDishesFound")}
               </p>
            </div>
         </div>
      );
   }

   return (
      <div className="border border-border rounded-xl overflow-x-auto shadow-sm bg-card">
         <Table>
            <TableHeader>
               <TableRow className="border-b">
                  <SortableHeader
                     field="name"
                     sortState={sortState}
                     onSort={handleSort}>
                     {t("dishName")}
                  </SortableHeader>
                  <TableHead className="font-semibold text-sm">{t("status")}</TableHead>
                  <TableHead className="font-semibold text-sm">{t("cookedWeight")}</TableHead>
                  <TableHead className="font-semibold text-sm text-center">{t("calPer100g")}</TableHead>
                  <TableHead className="font-semibold text-sm text-center">{t("proteinPer100g")}</TableHead>
                  <TableHead className="font-semibold text-sm text-center">{t("fatPer100g")}</TableHead>
                  <TableHead className="font-semibold text-sm text-center">{t("carbsPer100g")}</TableHead>
                  <TableHead className="font-semibold text-sm text-center">{t("fiberPer100g")}</TableHead>
                  <TableHead className="font-semibold text-sm text-right pr-6">{t("actions")}</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {recipes.map((recipe: RecipeResponse) => {
                  const totalNutrition = calculateRecipeNutritionData(recipe);
                  const totalRawWeight = (recipe.ingredients || []).reduce(
                     (sum, i) => sum + Number(i.quantityGrams),
                     0
                  );
                  const cookedWeight = recipe.cookedWeightGrams
                     ? Number(recipe.cookedWeightGrams)
                     : totalRawWeight;

                  const per100g = cookedWeight > 0
                     ? calculateCookedNutritionPer100g(totalNutrition, cookedWeight)
                     : totalNutrition;

                  const isRecent = recipe.status === "RECENT";

                  return (
                     <TableRow
                        key={recipe.id}
                        className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-4 max-w-xs">
                           <Link
                              href={`/recipes/${recipe.id}`}
                              className="flex flex-col gap-0.5 hover:opacity-80 transition-opacity">
                              <span className="font-semibold text-foreground truncate">
                                 {recipe.name}
                              </span>
                              {recipe.description && (
                                 <span className="text-xs text-muted-foreground line-clamp-1">
                                    {recipe.description}
                                 </span>
                              )}
                           </Link>
                        </TableCell>

                        <TableCell className="py-4">
                           <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                 isRecent
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "bg-muted text-muted-foreground"
                              }`}>
                              {isRecent ? t("statusRecent") : t("statusArchived")}
                           </span>
                        </TableCell>

                        <TableCell className="py-4 font-medium text-sm">
                           {recipe.cookedWeightGrams ? `${recipe.cookedWeightGrams} ${tMeals("grams")}` : t("rawWeightLabel", { weight: totalRawWeight })}
                        </TableCell>

                        <TableCell className="py-4 text-center">
                           <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 font-semibold text-xs">
                              {Number(per100g.calories).toFixed(1)} {tMeals("kcal")}
                           </span>
                        </TableCell>

                        <TableCell className="py-4 text-center">
                           <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-semibold text-xs">
                              {Number(per100g.protein).toFixed(1)}{tMeals("grams")}
                           </span>
                        </TableCell>

                        <TableCell className="py-4 text-center">
                           <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-semibold text-xs">
                              {Number(per100g.fat).toFixed(1)}{tMeals("grams")}
                           </span>
                        </TableCell>

                        <TableCell className="py-4 text-center">
                           <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 font-semibold text-xs">
                              {Number(per100g.carbs).toFixed(1)}{tMeals("grams")}
                           </span>
                        </TableCell>

                        <TableCell className="py-4 text-center">
                           <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 font-semibold text-xs">
                              {Number(per100g.fiber).toFixed(1)}{tMeals("grams")}
                           </span>
                        </TableCell>

                        <TableCell className="py-4 text-right pr-4">
                           <div className="flex items-center justify-end gap-1">
                              <Button
                                 variant="ghost"
                                 size="sm"
                                 title={isRecent ? t("toArchiveFull") : t("activateFull")}
                                 onClick={() => handleToggleStatus(recipe)}
                                 className="h-8 px-2 text-xs flex items-center gap-1">
                                 {isRecent ? (
                                    <>
                                       <Archive className="w-3.5 h-3.5" />
                                       {t("toArchiveBtn")}
                                    </>
                                 ) : (
                                    <>
                                       <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                       {t("activateBtn")}
                                    </>
                                 )}
                              </Button>

                              <RecipeUpdateForm
                                 recipe={recipe}
                                 isOpen={selectedRecipeId === recipe.id}
                                 onOpenChange={(open) => {
                                    setSelectedRecipeId(open ? recipe.id : null);
                                 }}>
                                 <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:text-primary">
                                    <Pencil className="w-4 h-4" />
                                 </Button>
                              </RecipeUpdateForm>

                              <RecipeDelete recipe={recipe}>
                                 <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                    <Trash2 className="w-4 h-4" />
                                 </Button>
                              </RecipeDelete>
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
