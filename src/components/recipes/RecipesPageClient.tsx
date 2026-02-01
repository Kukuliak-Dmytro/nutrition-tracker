"use client";
import { Button } from "@/components/ui/button";
import { NutritionFilters } from "@/components/ui/NutritionFilters";
import { useState, Suspense } from "react";
import RecipesTables from "@/components/recipes/RecipesTables";
import { RecipeCreateForm } from "@/components/forms/RecipeCreateForm";
import { useRecipes } from "@/app/hooks/useRecipes";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTranslations } from 'next-intl';

function RecipesPageContent() {
   const t = useTranslations('recipes');
   const searchParams = useSearchParams();
   const ingredientsParam = searchParams.get("ingredients");
   const [searchTerm, setSearchTerm] = useState("");
   const [inputValue, setInputValue] = useState("");
   const [filters, setFilters] = useState({
      calories: { min: 0, max: 3000 },
      protein: { min: 0, max: 200 },
      carbs: { min: 0, max: 300 },
      fat: { min: 0, max: 150 },
   });

   const updateFilter = (
      nutrient: "protein" | "carbs" | "fat" | "calories",
      min: number,
      max: number
   ) => {
      setFilters((prev) => ({ ...prev, [nutrient]: { min, max } }));
   };
   const { data: totalData } = useRecipes({});
   const totalRecipes = totalData?.totalRecipes;

   return (
      <div className="w-full mt-10 flex flex-col gap-8">
         <div className="flex flex-col md:flex-row w-full justify-between items-center">
            <div className="flex flex-col gap-2">
               <h1 className="text-3xl font-bold">{t('title')}</h1>
               <h3 className="text-muted-foreground text-lg font-normal">
                  <span>
                     {t('totalRecipes')}:{" "}
                     {totalRecipes !== undefined ? totalRecipes : t('loading')}
                  </span>
               </h3>
            </div>
            <RecipeCreateForm>
               <Button>{t('addRecipe')}</Button>
            </RecipeCreateForm>
         </div>
         <NutritionFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            inputValue={inputValue}
            setInputValue={setInputValue}
            fatMin={filters.fat.min}
            fatMax={filters.fat.max}
            onChangeFat={(min, max) => updateFilter("fat", min, max)}
            carbsMin={filters.carbs.min}
            carbsMax={filters.carbs.max}
            onChangeCarbs={(min, max) => updateFilter("carbs", min, max)}
            proteinMin={filters.protein.min}
            proteinMax={filters.protein.max}
            onChangeProtein={(min, max) => updateFilter("protein", min, max)}
            caloriesMin={filters.calories.min}
            caloriesMax={filters.calories.max}
            onChangeCalories={(min, max) => updateFilter("calories", min, max)}
            limits={{
               calories: { max: 3000 },
               protein: { max: 200 },
               carbs: { max: 300 },
               fat: { max: 150 },
            }}
         />
         <RecipesTables
            searchTerm={searchTerm}
            filters={filters}
            ingredients={ingredientsParam}
         />
      </div>
   );
}

function RecipesPageLoading() {
   const t = useTranslations('recipes');
   return (
      <div className="w-full mt-10 flex flex-col gap-8">
         <div className="flex flex-col md:flex-row w-full justify-between items-center">
            <div className="flex flex-col gap-2">
               <h1 className="text-3xl font-bold">{t('title')}</h1>
               <h3 className="text-muted-foreground text-lg font-normal">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('loading')}</span>
               </h3>
            </div>
         </div>
      </div>
   );
}

export default function RecipesPageClient() {
   return (
      <Suspense fallback={<RecipesPageLoading />}>
         <RecipesPageContent />
      </Suspense>
   );
}
