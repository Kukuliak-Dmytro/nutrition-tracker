"use client";
import { useRecipe, useToggleRecipeStatus } from "@/app/hooks/useRecipes";
import { Button } from "@/components/ui/button";
import {
   ChefHat,
   InfoIcon,
   Star,
   Scale,
   Edit,
   Loader2,
   ArrowLeft,
   Archive,
   CheckCircle2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import NutritionDisplay from "./NutritionDisplay";
import {
   calculateRecipeNutritionData,
   calculateCookedNutritionPer100g,
} from "../../../utils/calculations/nutrition";
import RecipeUpdateForm from "@/components/forms/RecipeUpdateForm";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/routing";
import { RecipeResponse } from "../../../utils/schemas/recipe";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface RecipePageClientProps {
   recipeId: string;
}

export default function RecipePageClient({ recipeId }: RecipePageClientProps) {
   const t = useTranslations("recipes");
   const tMeals = useTranslations("meals");
   const tToast = useTranslations("toast");
   const tCommon = useTranslations("common");
   const { data: recipe, isLoading, isError } = useRecipe(recipeId);
   const [isEditOpen, setIsEditOpen] = useState(false);
   const queryClient = useQueryClient();
   const { mutate: toggleStatus, isPending: isTogglingStatus } = useToggleRecipeStatus();

   const handleEditSuccess = () => {
      queryClient.invalidateQueries({ queryKey: ["recipe", recipeId] });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      setIsEditOpen(false);
   };

   const handleToggleArchive = () => {
      if (!recipe) return;
      const newStatus = recipe.status === "RECENT" ? "ARCHIVED" : "RECENT";
      toggleStatus(
         { id: recipe.id, status: newStatus },
         {
            onSuccess: () => {
               queryClient.invalidateQueries({ queryKey: ["recipe", recipeId] });
               queryClient.invalidateQueries({ queryKey: ["recipes"] });
               toast.success(
                  newStatus === "ARCHIVED"
                     ? tToast("recipeArchived", { name: recipe.name })
                     : tToast("recipeRestored", { name: recipe.name })
               );
            },
         }
      );
   };

   if (isLoading) {
      return (
         <div className="w-full mt-10 flex justify-center items-center h-80">
            <div className="flex flex-col items-center gap-4">
               <Loader2 className="w-12 h-12 animate-spin text-primary" />
               <p className="text-base text-muted-foreground">{t("loading")}</p>
            </div>
         </div>
      );
   }

   if (isError || !recipe) {
      return (
         <div className="w-full mt-10 flex justify-center items-center h-80">
            <div className="text-center flex flex-col gap-4">
               <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {t("errorLoading")}
               </p>
               <Link href="/recipes">
                  <Button variant="outline">
                     <ArrowLeft className="w-4 h-4 mr-2" />
                     {t("backToRecipes")}
                  </Button>
               </Link>
            </div>
         </div>
      );
   }

   const totalNutrition = calculateRecipeNutritionData(recipe);
   const totalRawWeight = (recipe.ingredients || []).reduce(
      (sum, i) => sum + Number(i.quantityGrams),
      0
   );
   const cookedWeight = recipe.cookedWeightGrams ? Number(recipe.cookedWeightGrams) : totalRawWeight;
   const cookedNutritionPer100g = cookedWeight > 0
      ? calculateCookedNutritionPer100g(totalNutrition, cookedWeight)
      : totalNutrition;

   const isRecent = recipe.status === "RECENT";

   return (
      <div className="w-full mt-10 flex flex-col gap-8 max-w-5xl mx-auto px-4">
         <Link href="/recipes">
            <Button variant="ghost" className="mb-2">
               <ArrowLeft className="w-4 h-4 mr-2" />
               {t("backToDishesList")}
            </Button>
         </Link>

         <div className="border border-border rounded-xl overflow-hidden shadow-sm bg-card p-6">
            <div className="flex flex-col gap-6">
               <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                     <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold">{recipe.name}</h1>
                        <span
                           className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              isRecent
                                 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                 : "bg-muted text-muted-foreground"
                           }`}>
                           {isRecent ? t("recentBadge") : t("archivedBadge")}
                        </span>
                     </div>
                     {recipe.description && (
                        <p className="text-base text-muted-foreground">
                           {recipe.description}
                        </p>
                     )}
                  </div>

                  <div className="flex items-center gap-2">
                     <Button
                        onClick={handleToggleArchive}
                        disabled={isTogglingStatus}
                        variant={isRecent ? "outline" : "default"}
                        className="flex items-center gap-2">
                        {isRecent ? (
                           <>
                              <Archive className="w-4 h-4" />
                              {t("toArchiveFull")}
                           </>
                        ) : (
                           <>
                              <CheckCircle2 className="w-4 h-4" />
                              {t("activateFull")}
                           </>
                        )}
                     </Button>

                     <RecipeUpdateForm
                        recipe={recipe as RecipeResponse}
                        isOpen={isEditOpen}
                        onOpenChange={setIsEditOpen}
                        onSuccessDetailsCard={handleEditSuccess}>
                        <Button variant="outline" className="flex items-center gap-2">
                           <Edit className="w-4 h-4" />
                           {tCommon("edit")}
                        </Button>
                     </RecipeUpdateForm>
                  </div>
               </div>

               <Separator />

               {/* Key Stats Bar */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-3">
                     <Scale className="w-5 h-5 text-primary" />
                     <div>
                        <div className="text-xs text-muted-foreground">{t("cookedWeight")}</div>
                        <div className="font-bold text-lg text-foreground">
                           {recipe.cookedWeightGrams ? `${recipe.cookedWeightGrams} ${tMeals("grams")}` : t("rawWeightLabel", { weight: totalRawWeight })}
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-3">
                     <ChefHat className="w-5 h-5 text-muted-foreground" />
                     <div>
                        <div className="text-xs text-muted-foreground">{t("rawWeightOfIngredients")}</div>
                        <div className="font-semibold text-lg text-foreground">
                           {totalRawWeight} {tMeals("grams")}
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-3">
                     <Star className="w-5 h-5 text-amber-500" />
                     <div>
                        <div className="text-xs text-muted-foreground">{t("ratingLabel")}</div>
                        <div className="font-semibold text-lg text-foreground">
                           {recipe.rating ? `${recipe.rating}/100` : "—"}
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-3">
                     <CheckCircle2 className={`w-5 h-5 ${isRecent ? "text-emerald-500" : "text-muted-foreground"}`} />
                     <div>
                        <div className="text-xs text-muted-foreground">{t("diaryStatus")}</div>
                        <div className="font-semibold text-sm">
                           {isRecent ? t("availableInDiary") : t("onlyInArchive")}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Nutrition per 100g */}
               <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                     <InfoIcon className="w-5 h-5 text-primary" />
                     <h2 className="text-xl font-bold">
                        {t("nutritionPer100gCooked")}
                     </h2>
                  </div>
                  <NutritionDisplay
                     nutrition={cookedNutritionPer100g}
                     labelPer100g={true}
                  />
               </div>

               {/* Total Recipe Nutrition */}
               <div className="flex flex-col gap-2 p-3 bg-muted/40 rounded-lg">
                  <div className="text-sm font-semibold text-muted-foreground">
                     {t("totalWholeDish", { weight: cookedWeight })}
                  </div>
                  <div className="flex items-center flex-wrap gap-4 text-sm font-medium">
                     <span className="text-orange-600 font-bold">
                        {totalNutrition.calories} {tMeals("kcal")}
                     </span>
                     <span>{t("protein")}: {totalNutrition.protein}{tMeals("grams")}</span>
                     <span>{t("fat")}: {totalNutrition.fat}{tMeals("grams")}</span>
                     <span>{t("carbs")}: {totalNutrition.carbs}{tMeals("grams")}</span>
                     <span className="text-purple-600 font-semibold">
                        {t("fiber")}: {totalNutrition.fiber}{tMeals("grams")}
                     </span>
                  </div>
               </div>

               <Separator />

               {/* Ingredients List */}
               <div className="flex flex-col gap-4">
                  <h2 className="text-xl font-semibold">{t("ingredientsInDish")}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     {recipe.ingredients?.map((item) => {
                        return (
                           <div
                              key={item.id}
                              className="bg-card rounded-lg p-3 border shadow-sm flex items-center justify-between">
                              <div>
                                 <span className="font-semibold text-base block">
                                    {item.ingredient.name}
                                 </span>
                                 <span className="text-xs text-muted-foreground">
                                    {item.ingredient.caloriesPer100g} {tMeals("kcal")} • {tMeals("proteinAbbr")}: {item.ingredient.proteinPer100g}{tMeals("grams")} • {tMeals("fatAbbr")}: {item.ingredient.fatPer100g}{tMeals("grams")} • {tMeals("carbsAbbr")}: {item.ingredient.carbsPer100g}{tMeals("grams")} • {tMeals("fiberAbbr")}: {item.ingredient.fiberPer100g || 0}{tMeals("grams")} {t("per100gUnit")}
                                 </span>
                              </div>
                              <span className="font-bold text-primary shrink-0 ml-4">
                                 {Number(item.quantityGrams)} {tMeals("grams")}
                              </span>
                           </div>
                        );
                     })}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
