"use client";
import { useRecipe } from "@/app/hooks/useRecipes";
import { Button } from "@/components/ui/button";
import {
   ChefHat,
   Clock,
   InfoIcon,
   Star,
   Users,
   ChevronLeft,
   Edit,
   Loader2,
   ArrowLeft,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import NutritionDisplay from "./NutritionDisplay";
import { calculateRecipeNutritionData } from "../../../utils/calculations/nutrition";
import RecipeUpdateForm from "@/components/forms/RecipeUpdateForm";
import { useState } from "react";
import { useCreateCookingHistory } from "@/app/hooks/useCookingHistory";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { RecipeResponse } from "../../../utils/schemas/recipe";

interface RecipePageClientProps {
   recipeId: string;
}

export default function RecipePageClient({ recipeId }: RecipePageClientProps) {
   const { data: recipe, isLoading, isError } = useRecipe(recipeId);
   const [isEditOpen, setIsEditOpen] = useState(false);
   const queryClient = useQueryClient();
   const { mutate: createCookingHistory, isPending } =
      useCreateCookingHistory();
   const t = useTranslations("recipes");

   const handleEditSuccess = () => {
      queryClient.invalidateQueries({ queryKey: ["recipe", recipeId] });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["cooking-history"] });
      queryClient.invalidateQueries({ queryKey: ["recent-cooking-history"] });
      queryClient.invalidateQueries({ queryKey: ["cooking-stats"] });
      setIsEditOpen(false);
   };

   const today = new Date();
   const handleCookedToday = () => {
      if (!recipe) return;
      createCookingHistory({
         recipeId: recipe.id,
         cookedAt: today,
      });
   };

   if (isLoading) {
      return (
         <div className="w-full mt-10 flex justify-center items-center h-80">
            <div className="flex flex-col items-center gap-4">
               <Loader2 className="w-12 h-12 animate-spin text-primary" />
               <p className="text-base text-muted-foreground">
                  {t("loading")}
               </p>
            </div>
         </div>
      );
   }

   if (isError || !recipe) {
      return (
         <div className="w-full mt-10 flex justify-center items-center h-80">
            <div className="text-center flex flex-col gap-4">
               <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {t("errorLoading") || "Error loading recipe"}
               </p>
               <Link href="/recipes">
                  <Button variant="outline">
                     <ArrowLeft className="w-4 h-4 mr-2" />
                     {t("backToRecipes") || "Back to Recipes"}
                  </Button>
               </Link>
            </div>
         </div>
      );
   }

   return (
      <div className="w-full mt-10 flex flex-col gap-8 max-w-6xl mx-auto">
         <Link href="/recipes">
            <Button variant="ghost" className="mb-4">
               <ArrowLeft className="w-4 h-4 mr-2" />
               {t("backToRecipes")}
            </Button>
         </Link>

         <div className="border border-border rounded-xl overflow-hidden shadow-sm bg-white dark:bg-gray-950 p-6">
            <div className="flex flex-col gap-6">
               <div>
                  <h1 className="text-3xl font-bold mb-2">{recipe.name}</h1>
                  {recipe.description && (
                     <p className="text-base text-muted-foreground">
                        {recipe.description}
                     </p>
                  )}
               </div>

               <div className="flex items-center justify-center h-64 w-full rounded-lg bg-gradient-to-tl from-primary/90 via-orange-500/90 to-accent">
                  <ChefHat className="w-30 h-30 text-white dark:text-black opacity-70" />
               </div>

               <Separator />

               <div className="flex items-center justify-between gap-3 flex-wrap">
                  <Button
                     onClick={handleCookedToday}
                     disabled={isPending}
                     className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2">
                     {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                     ) : (
                        <ChevronLeft className="w-4 h-4" />
                     )}
                     {t("cookedToday")}
                  </Button>

                  <div className="flex items-center gap-2">
                     <RecipeUpdateForm
                        recipe={recipe as RecipeResponse}
                        isOpen={isEditOpen}
                        onOpenChange={setIsEditOpen}
                        onSuccessDetailsCard={handleEditSuccess}>
                        <Button variant="outline" className="flex items-center gap-2">
                           <Edit className="w-4 h-4" />
                           {t("editRecipe")}
                        </Button>
                     </RecipeUpdateForm>
                  </div>
               </div>

               <Separator />

               <div className="flex justify-between gap-2 items-center flex-wrap">
                  <div className="flex items-center gap-3">
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-5 h-5" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">
                           {t("servingsLabel")}:
                        </span>
                        <span className="font-semibold">{recipe.servings}</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-5 h-5" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">
                           {t("cookingTimeLabel")}:
                        </span>
                        <span className="font-semibold">
                           {recipe.cookingTime ?? t("notAvailable")}
                        </span>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <Star className="w-5 h-5" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">
                           {t("ratingLabel")}:
                        </span>
                        <span className="font-semibold">
                           {recipe.rating ?? 0}/100
                        </span>
                     </div>
                  </div>
               </div>

               <Separator />

               <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-2">
                     <InfoIcon className="w-5 h-5" />
                     <h2 className="text-xl font-semibold">
                        {t("nutritionPerServing")}
                     </h2>
                  </div>
                  <NutritionDisplay
                     nutrition={calculateRecipeNutritionData(recipe)}
                     servings={recipe.servings}
                     showPerServing={true}
                  />
               </div>

               <Separator />

               <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                     <span>{t("totalRecipeNutrition")}:</span>{" "}
                     <span className="font-semibold">
                        {Number(
                           calculateRecipeNutritionData(recipe).calories
                        ).toFixed(1)}
                        kcal
                     </span>
                     |
                     <span className="font-semibold">
                        {Number(
                           calculateRecipeNutritionData(recipe).protein
                        ).toFixed(1)}
                        g
                     </span>
                     |
                     <span className="font-semibold">
                        {Number(
                           calculateRecipeNutritionData(recipe).carbs
                        ).toFixed(1)}
                        g
                     </span>
                     |
                     <span className="font-semibold">
                        {Number(
                           calculateRecipeNutritionData(recipe).fat
                        ).toFixed(1)}
                        g
                     </span>
                  </div>
               </div>

               <Separator />

               <div className="flex flex-col gap-4">
                  <h2 className="text-xl font-semibold">{t("ingredientsTitle")}</h2>
                  <div className="flex flex-col gap-3">
                     {recipe.ingredients?.map((ingredient) => {
                        const nutrition = calculateRecipeNutritionData({
                           ingredients: [ingredient],
                        });
                        return (
                           <div
                              key={ingredient.id}
                              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border">
                              <div className="flex flex-col gap-1">
                                 <span className="font-semibold text-base">
                                    {ingredient.ingredient.name}
                                 </span>
                                 <span className="text-sm text-muted-foreground">
                                    {Number(ingredient.quantityGrams).toFixed(0)}
                                    g • {Number(nutrition.calories).toFixed(0)}
                                    kcal • P: {Number(nutrition.protein).toFixed(1)}
                                    g • C: {Number(nutrition.carbs).toFixed(1)}g
                                    • F: {Number(nutrition.fat).toFixed(1)}g
                                 </span>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>

               <Separator />

               <div className="flex flex-col gap-4">
                  <h2 className="text-xl font-semibold">{t("instructionsTitle")}</h2>
                  <div className="flex flex-col gap-3">
                     {recipe.instructions ? (
                        recipe.instructions.split("\n").map(
                           (instruction, index) =>
                              instruction.trim() && (
                                 <div key={index} className="flex gap-3">
                                    <span className="font-semibold text-primary min-w-[24px]">
                                       {index + 1}.
                                    </span>
                                    <span className="text-sm leading-relaxed">
                                       {instruction.trim()}
                                    </span>
                                 </div>
                              )
                        )
                     ) : (
                        <p className="text-muted-foreground text-sm">
                           {t("noInstructions")}
                        </p>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

