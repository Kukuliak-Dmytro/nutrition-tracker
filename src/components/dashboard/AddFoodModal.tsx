"use client";
import { useState } from "react";
import { MealType } from "../../../utils/schemas/foodLog";
import { useCreateFoodLogEntry } from "@/app/hooks/useFoodLog";
import { useRecipes } from "@/app/hooks/useRecipes";
import { useIngredients } from "@/app/hooks/useIngredients";
import { IngredientResponse } from "../../../utils/schemas/ingredient";
import {
  calculateRecipeNutritionData,
  calculateCookedNutritionPer100g,
  calculatePortionNutrition,
} from "../../../utils/calculations/nutrition";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Utensils, Sparkles, Apple, Search, Loader2 } from "lucide-react";
import NutritionDisplay from "@/components/recipes/NutritionDisplay";
import { useTranslations } from "next-intl";

interface AddFoodModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  mealType: MealType;
  mealTitle: string;
}

export function AddFoodModal({
  isOpen,
  onOpenChange,
  date,
  mealType,
  mealTitle,
}: AddFoodModalProps) {
  const t = useTranslations("addFoodModal");
  const tCommon = useTranslations("common");
  const tMeals = useTranslations("meals");
  const [activeTab, setActiveTab] = useState<"RECENT" | "CUSTOM" | "INGREDIENT">("RECENT");
  const { mutate: createEntry, isPending } = useCreateFoodLogEntry();

  // Tab 1: Recent Dishes state
  const { data: recentRecipesData } = useRecipes({ status: "RECENT" });
  const recentDishes = recentRecipesData?.recipes || [];
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [dishPortionGrams, setDishPortionGrams] = useState<number>(200);

  // Tab 2: Custom / One-time state
  const [customName, setCustomName] = useState("");
  const [customWeight, setCustomWeight] = useState<number | "">("");
  const [customCalories, setCustomCalories] = useState<number | "">("");
  const [customProtein, setCustomProtein] = useState<number | "">("");
  const [customFat, setCustomFat] = useState<number | "">("");
  const [customCarbs, setCustomCarbs] = useState<number | "">("");
  const [customFiber, setCustomFiber] = useState<number | "">("");

  // Tab 3: Ingredient search state
  const [ingredientSearch, setIngredientSearch] = useState("");
  const { data: ingredientsData, isFetching: isSearchingIngredients } = useIngredients({
    search: ingredientSearch,
    limit: 20,
  });
  const ingredientsList = ingredientsData?.pages.flatMap((p) => p.data) || [];
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientResponse | null>(null);
  const [ingredientPortionGrams, setIngredientPortionGrams] = useState<number>(100);

  // Calculate selected recipe nutrition
  const selectedRecipe = recentDishes.find((r) => r.id === selectedRecipeId);
  let recipePer100g = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  let recipePortionNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

  if (selectedRecipe) {
    const rawTotal = calculateRecipeNutritionData(selectedRecipe);
    const totalRawWeight = (selectedRecipe.ingredients || []).reduce(
      (sum, i) => sum + Number(i.quantityGrams),
      0
    );
    const cookedWeight = selectedRecipe.cookedWeightGrams
      ? Number(selectedRecipe.cookedWeightGrams)
      : totalRawWeight;

    recipePer100g = cookedWeight > 0
      ? calculateCookedNutritionPer100g(rawTotal, cookedWeight)
      : rawTotal;

    recipePortionNutrition = calculatePortionNutrition(recipePer100g, dishPortionGrams || 0);
  }

  // Calculate selected ingredient portion nutrition
  let ingredientPortionNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  if (selectedIngredient) {
    const per100 = {
      calories: Number(selectedIngredient.caloriesPer100g),
      protein: Number(selectedIngredient.proteinPer100g),
      fat: Number(selectedIngredient.fatPer100g),
      carbs: Number(selectedIngredient.carbsPer100g),
      fiber: Number(selectedIngredient.fiberPer100g || 0),
    };
    ingredientPortionNutrition = calculatePortionNutrition(per100, ingredientPortionGrams || 0);
  }

  const handleAddRecentDish = () => {
    if (!selectedRecipe) return;
    createEntry(
      {
        date,
        mealType,
        name: selectedRecipe.name,
        recipeId: selectedRecipe.id,
        weightGrams: dishPortionGrams,
        calories: recipePortionNutrition.calories,
        protein: recipePortionNutrition.protein,
        fat: recipePortionNutrition.fat,
        carbs: recipePortionNutrition.carbs,
        fiber: recipePortionNutrition.fiber,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedRecipeId("");
        },
      }
    );
  };

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    createEntry(
      {
        date,
        mealType,
        name: customName.trim(),
        weightGrams: typeof customWeight === "number" ? customWeight : null,
        calories: Number(customCalories) || 0,
        protein: Number(customProtein) || 0,
        fat: Number(customFat) || 0,
        carbs: Number(customCarbs) || 0,
        fiber: Number(customFiber) || 0,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setCustomName("");
          setCustomWeight("");
          setCustomCalories("");
          setCustomProtein("");
          setCustomFat("");
          setCustomCarbs("");
          setCustomFiber("");
        },
      }
    );
  };

  const handleAddIngredient = () => {
    if (!selectedIngredient) return;
    createEntry(
      {
        date,
        mealType,
        name: selectedIngredient.name,
        ingredientId: selectedIngredient.id,
        weightGrams: ingredientPortionGrams,
        calories: ingredientPortionNutrition.calories,
        protein: ingredientPortionNutrition.protein,
        fat: ingredientPortionNutrition.fat,
        carbs: ingredientPortionNutrition.carbs,
        fiber: ingredientPortionNutrition.fiber,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedIngredient(null);
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Utensils className="w-5 h-5 text-primary" />
            {t("title", { meal: mealTitle })}
          </DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="flex flex-col gap-1.5 p-1.5 bg-muted/50 rounded-xl text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("RECENT")}
            className={`flex items-center justify-between py-2 px-3 rounded-lg transition-all ${
              activeTab === "RECENT"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}>
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-primary" />
              <span>{t("tabRecent")}</span>
            </div>
            {activeTab === "RECENT" && (
              <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CUSTOM")}
            className={`flex items-center justify-between py-2 px-3 rounded-lg transition-all ${
              activeTab === "CUSTOM"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{t("tabCustom")}</span>
            </div>
            {activeTab === "CUSTOM" && (
              <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("INGREDIENT")}
            className={`flex items-center justify-between py-2 px-3 rounded-lg transition-all ${
              activeTab === "INGREDIENT"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}>
            <div className="flex items-center gap-2">
              <Apple className="w-4 h-4 text-emerald-500" />
              <span>{t("tabIngredient")}</span>
            </div>
            {activeTab === "INGREDIENT" && (
              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            )}
          </button>
        </div>

        {/* TAB 1: RECENT DISHES */}
        {activeTab === "RECENT" && (
          <div className="space-y-4 pt-2">
            {recentDishes.length === 0 ? (
               <div className="p-6 text-center border rounded-xl bg-muted/20 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                     {t("noRecentDishes")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                     {t("noRecentHint")}
                  </p>
               </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label>{t("selectRecentDish")}</Label>
                  <div className="flex flex-col gap-2 max-h-56 overflow-y-auto p-1">
                    {recentDishes.map((dish) => {
                      const isSelected = selectedRecipeId === dish.id;
                      return (
                        <div
                          key={dish.id}
                          onClick={() => setSelectedRecipeId(dish.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "hover:bg-muted/50"
                          }`}>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm leading-snug">{dish.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {dish.cookedWeightGrams
                                ? t("cookedWeightLabel", { weight: dish.cookedWeightGrams })
                                : t("noWeightSpecified")}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedRecipe && (
                  <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="dishPortion" className="font-semibold">
                        {t("howManyGrams")}
                      </Label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          id="dishPortion"
                          type="number"
                          min={1}
                          max={5000}
                          value={dishPortionGrams}
                          onChange={(e) => setDishPortionGrams(Number(e.target.value))}
                          className="w-28 text-right font-bold text-base"
                        />
                        <span className="text-sm font-semibold text-muted-foreground">{tMeals("grams")}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {t("portionCalculated", { grams: dishPortionGrams })}
                      </div>
                      <NutritionDisplay nutrition={recipePortionNutrition} />
                    </div>

                    <Button
                      onClick={handleAddRecentDish}
                      disabled={isPending || !dishPortionGrams}
                      className="w-full font-semibold">
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t("adding")}
                        </>
                      ) : (
                        `${t("addDishBtn")} (${dishPortionGrams}${tMeals("grams")} «${selectedRecipe.name}»)`
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 2: ONE-TIME CUSTOM FOOD */}
        {activeTab === "CUSTOM" && (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground">
              {t("customHint")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="customName">{t("customDishName")}</Label>
                <Input
                  id="customName"
                  placeholder={t("customDishPlaceholder")}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="customWeight">{t("customPortionWeight")}</Label>
                <Input
                  id="customWeight"
                  type="number"
                  placeholder="350"
                  value={customWeight}
                  onChange={(e) => setCustomWeight(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="customCalories">{t("customCalories")}</Label>
                <Input
                  id="customCalories"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={customCalories}
                  onChange={(e) => setCustomCalories(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="customProtein">{t("customProtein")}</Label>
                <Input
                  id="customProtein"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={customProtein}
                  onChange={(e) => setCustomProtein(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="customFat">{t("customFat")}</Label>
                <Input
                  id="customFat"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={customFat}
                  onChange={(e) => setCustomFat(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="customCarbs">{t("customCarbs")}</Label>
                <Input
                  id="customCarbs"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={customCarbs}
                  onChange={(e) => setCustomCarbs(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>

              <div className="space-y-1 col-span-2 sm:col-span-1">
                <Label htmlFor="customFiber">{t("customFiber")}</Label>
                <Input
                  id="customFiber"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={customFiber}
                  onChange={(e) => setCustomFiber(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
            </div>

            <Button
              onClick={handleAddCustom}
              disabled={isPending || !customName.trim()}
              className="w-full font-semibold">
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("adding")}
                </>
              ) : (
                t("addCustomBtn")
              )}
            </Button>
          </div>
        )}

        {/* TAB 3: INGREDIENT FROM DATABASE */}
        {activeTab === "INGREDIENT" && (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>{t("searchIngredientLabel")}</Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder={t("searchIngredientPlaceholder")}
                  value={ingredientSearch}
                  onChange={(e) => setIngredientSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto border rounded-xl divide-y">
              {ingredientsList.length > 0 ? (
                ingredientsList.map((ing) => {
                  const isSelected = selectedIngredient?.id === ing.id;
                  return (
                    <div
                      key={ing.id}
                      onClick={() => setSelectedIngredient(ing)}
                      className={`p-2.5 text-sm flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors ${
                        isSelected ? "bg-primary/10 font-semibold" : ""
                      }`}>
                      <span>{ing.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {t("ingredientPer100g", {
                          calories: ing.caloriesPer100g,
                          protein: ing.proteinPer100g,
                          fat: ing.fatPer100g,
                          carbs: ing.carbsPer100g,
                          fiber: ing.fiberPer100g || 0,
                        })}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  {isSearchingIngredients ? tCommon("loading") : tCommon("no")}
                </div>
              )}
            </div>

            {selectedIngredient && (
              <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ingPortion" className="font-semibold">
                    {t("ingredientWeight")}
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      id="ingPortion"
                      type="number"
                      min={1}
                      max={5000}
                      value={ingredientPortionGrams}
                      onChange={(e) => setIngredientPortionGrams(Number(e.target.value))}
                      className="w-24 text-right font-bold text-base"
                    />
                    <span className="text-sm font-semibold text-muted-foreground">{tMeals("grams")}</span>
                  </div>
                </div>

                <NutritionDisplay nutrition={ingredientPortionNutrition} />

                <Button
                  onClick={handleAddIngredient}
                  disabled={isPending || !ingredientPortionGrams}
                  className="w-full font-semibold">
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("adding")}
                    </>
                  ) : (
                    `${t("addIngredientBtn")} (${ingredientPortionGrams}${tMeals("grams")} «${selectedIngredient.name}»)`
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
