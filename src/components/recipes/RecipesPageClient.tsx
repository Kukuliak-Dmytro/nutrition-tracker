"use client";
import { Button } from "@/components/ui/button";
import { NutritionFilters } from "@/components/ui/NutritionFilters";
import { useState } from "react";
import RecipesTables from "@/components/recipes/RecipesTables";
import { RecipeCreateForm } from "@/components/forms/RecipeCreateForm";
import { useRecipes } from "@/app/hooks/useRecipes";
import { useSearchParams } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { RecipeStatus } from "../../../utils/schemas/recipe";

import { useTranslations } from "next-intl";

export default function RecipesPageClient() {
   const t = useTranslations("recipes");
   const searchParams = useSearchParams();
   const ingredientsParam = searchParams.get("ingredients");
   const [searchTerm, setSearchTerm] = useState("");
   const [inputValue, setInputValue] = useState("");
   const [statusTab, setStatusTab] = useState<RecipeStatus | "ALL">("RECENT");
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

   const { data: recentData } = useRecipes({ status: "RECENT" });
   const { data: archiveData } = useRecipes({ status: "ARCHIVED" });

   const recentCount = recentData?.totalRecipes ?? 0;
   const archiveCount = archiveData?.totalRecipes ?? 0;

   return (
      <div className="w-full mt-6 flex flex-col gap-6 max-w-7xl mx-auto px-4">
         <div className="flex flex-col sm:flex-row w-full justify-between items-start sm:items-center gap-4">
            <div>
               <h1 className="text-3xl font-bold">{t("pageTitle")}</h1>
               <p className="text-muted-foreground text-sm">
                  {t("pageDescription")}
               </p>
            </div>
            <RecipeCreateForm>
               <Button className="flex items-center gap-2">
                  <PlusIcon className="w-4 h-4" />
                  {t("createDish")}
               </Button>
            </RecipeCreateForm>
         </div>

         {/* Tabs for Recent / Archive / All */}
         <div className="flex items-center gap-2 border-b pb-2">
            <Button
               variant={statusTab === "RECENT" ? "default" : "outline"}
               size="sm"
               onClick={() => setStatusTab("RECENT")}
               className="rounded-full">
               {t("tabRecent", { count: recentCount })}
            </Button>
            <Button
               variant={statusTab === "ARCHIVED" ? "default" : "outline"}
               size="sm"
               onClick={() => setStatusTab("ARCHIVED")}
               className="rounded-full">
               {t("tabArchived", { count: archiveCount })}
            </Button>
            <Button
               variant={statusTab === "ALL" ? "default" : "outline"}
               size="sm"
               onClick={() => setStatusTab("ALL")}
               className="rounded-full">
               {t("tabAll", { count: recentCount + archiveCount })}
            </Button>
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
            statusFilter={statusTab}
            filters={filters}
            ingredients={ingredientsParam}
         />
      </div>
   );
}
