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
import { Utensils, Sparkles, Apple, Search, Loader2, Check } from "lucide-react";
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
      <DialogContent fullScreenMobile className="sm:max-w-2xl md:max-w-3xl sm:max-h-[90vh]">
        <DialogHeader className="shrink-0 text-left pr-8 pb-1">
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Utensils className="w-5 h-5 text-primary shrink-0" />
            <span>{t("title", { meal: mealTitle })}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-muted/60 rounded-xl text-xs sm:text-sm font-medium shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("RECENT")}
            className={`flex items-center justify-center gap-1.5 py-2 px-1.5 sm:px-3 rounded-lg transition-all ${
              activeTab === "RECENT"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}>
            <Utensils className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">{t("tabRecentShort")}</span>
              <span className="hidden sm:inline">{t("tabRecent")}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CUSTOM")}
            className={`flex items-center justify-center gap-1.5 py-2 px-1.5 sm:px-3 rounded-lg transition-all ${
              activeTab === "CUSTOM"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}>
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">{t("tabCustomShort")}</span>
              <span className="hidden sm:inline">{t("tabCustom")}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("INGREDIENT")}
            className={`flex items-center justify-center gap-1.5 py-2 px-1.5 sm:px-3 rounded-lg transition-all ${
              activeTab === "INGREDIENT"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}>
            <Apple className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">{t("tabIngredientShort")}</span>
              <span className="hidden sm:inline">{t("tabIngredient")}</span>
            </span>
          </button>
        </div>

        {/* TAB 1: RECENT DISHES */}
        {activeTab === "RECENT" && (
          <div className="flex-1 overflow-y-auto min-h-0 space-y-5 pt-1 pb-6 pr-0.5 sm:pb-2">
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
                {/* SECTION 1: DISH SELECTION */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("selectRecentDish")}
                    </Label>
                    <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                      {recentDishes.length} {recentDishes.length === 1 ? "страва" : recentDishes.length < 5 ? "страви" : "страв"} • гортайте ↓
                    </span>
                  </div>
                  <div className="relative">
                    <div className="flex flex-col gap-2 max-h-48 sm:max-h-56 overflow-y-auto pr-1 overscroll-contain">
                      {recentDishes.map((dish) => {
                        const isSelected = selectedRecipeId === dish.id;
                        return (
                          <div
                            key={dish.id}
                            onClick={() => setSelectedRecipeId(dish.id)}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3 ${
                              isSelected
                                ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/40"
                                : "border-border/60 hover:border-border hover:bg-muted/40"
                            }`}>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-sm leading-snug">{dish.name}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {dish.cookedWeightGrams
                                  ? t("cookedWeightLabel", { weight: dish.cookedWeightGrams })
                                  : t("noWeightSpecified")}
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                              isSelected ? "bg-primary text-primary-foreground" : "border-2 border-muted-foreground/30"
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {recentDishes.length > 2 && (
                      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent opacity-80" />
                    )}
                  </div>
                </div>

                {selectedRecipe && (
                  <>
                    {/* SECTION 2: PORTION WEIGHT */}
                    <div className="space-y-2">
                      <Label htmlFor="dishPortion" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                        {t("howManyGrams")}
                      </Label>
                      <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
                        <span className="text-sm font-medium text-foreground truncate mr-2">
                          {selectedRecipe.name}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Input
                            id="dishPortion"
                            type="number"
                            min={1}
                            max={5000}
                            value={dishPortionGrams}
                            onChange={(e) => setDishPortionGrams(Number(e.target.value))}
                            className="w-24 text-right font-bold text-base h-9 bg-background"
                          />
                          <span className="text-sm font-semibold text-muted-foreground">{tMeals("grams")}</span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: NUTRITION DISPLAY */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                        {t("portionCalculated", { grams: dishPortionGrams })}
                      </Label>
                      <NutritionDisplay nutrition={recipePortionNutrition} />
                    </div>

                    {/* SECTION 4: SUBMIT BUTTON */}
                    <div>
                      <Button
                        onClick={handleAddRecentDish}
                        disabled={isPending || !dishPortionGrams}
                        className="w-full font-semibold h-11 text-base shadow-sm">
                        {isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {t("adding")}
                          </>
                        ) : (
                          `${t("addDishBtn")} • ${dishPortionGrams} ${tMeals("grams")}`
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 2: ONE-TIME CUSTOM FOOD */}
        {activeTab === "CUSTOM" && (
          <div className="flex-1 overflow-y-auto min-h-0 space-y-5 pt-1 pb-6 pr-0.5 sm:pb-2">
            {/* SECTION 1: NAME AND WEIGHT */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                {t("customTitle")}
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Input
                  id="customName"
                  placeholder={t("customDishName")}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="h-10"
                />

                <Input
                  id="customWeight"
                  type="number"
                  placeholder={t("customPortionWeight")}
                  value={customWeight}
                  onChange={(e) => setCustomWeight(e.target.value === "" ? "" : Number(e.target.value))}
                  className="h-10"
                />
              </div>
            </div>

            {/* SECTION 2: NUTRIENTS */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                {t("customCalories")} + БЖВ
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground ml-1">{t("customCalories")}</span>
                  <Input
                    id="customCalories"
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={customCalories}
                    onChange={(e) => setCustomCalories(e.target.value === "" ? "" : Number(e.target.value))}
                    className="h-10"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground ml-1">{t("customProtein")}</span>
                  <Input
                    id="customProtein"
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={customProtein}
                    onChange={(e) => setCustomProtein(e.target.value === "" ? "" : Number(e.target.value))}
                    className="h-10"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground ml-1">{t("customFat")}</span>
                  <Input
                    id="customFat"
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={customFat}
                    onChange={(e) => setCustomFat(e.target.value === "" ? "" : Number(e.target.value))}
                    className="h-10"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground ml-1">{t("customCarbs")}</span>
                  <Input
                    id="customCarbs"
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={customCarbs}
                    onChange={(e) => setCustomCarbs(e.target.value === "" ? "" : Number(e.target.value))}
                    className="h-10"
                  />
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1 md:col-span-1">
                  <span className="text-[11px] font-medium text-muted-foreground ml-1">{t("customFiber")}</span>
                  <Input
                    id="customFiber"
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={customFiber}
                    onChange={(e) => setCustomFiber(e.target.value === "" ? "" : Number(e.target.value))}
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: SUBMIT */}
            <div>
              <Button
                onClick={handleAddCustom}
                disabled={isPending || !customName.trim()}
                className="w-full font-semibold h-11 text-base shadow-sm">
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
          </div>
        )}

        {/* TAB 3: INGREDIENT FROM DATABASE */}
        {activeTab === "INGREDIENT" && (
          <div className="flex-1 overflow-y-auto min-h-0 space-y-5 pt-1 pb-6 pr-0.5 sm:pb-2">
            {/* SECTION 1: SEARCH */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                {t("searchIngredientLabel")}
              </Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder={t("searchIngredientPlaceholder")}
                  value={ingredientSearch}
                  onChange={(e) => setIngredientSearch(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>

              <div className="max-h-44 sm:max-h-48 overflow-y-auto border rounded-xl divide-y mt-2">
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
                        <span className="break-words">{ing.name}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
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
            </div>

            {selectedIngredient && (
              <>
                {/* SECTION 2: WEIGHT */}
                <div className="space-y-2">
                  <Label htmlFor="ingPortion" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    {t("ingredientWeight")}
                  </Label>
                  <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
                    <span className="text-sm font-medium text-foreground truncate mr-2">
                      {selectedIngredient.name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Input
                        id="ingPortion"
                        type="number"
                        min={1}
                        max={5000}
                        value={ingredientPortionGrams}
                        onChange={(e) => setIngredientPortionGrams(Number(e.target.value))}
                        className="w-24 text-right font-bold text-base h-9 bg-background"
                      />
                      <span className="text-sm font-semibold text-muted-foreground">{tMeals("grams")}</span>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: NUTRITION */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    {t("portionCalculated", { grams: ingredientPortionGrams })}
                  </Label>
                  <NutritionDisplay nutrition={ingredientPortionNutrition} />
                </div>

                {/* SECTION 4: SUBMIT */}
                <div>
                  <Button
                    onClick={handleAddIngredient}
                    disabled={isPending || !ingredientPortionGrams}
                    className="w-full font-semibold h-11 text-base shadow-sm">
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("adding")}
                      </>
                    ) : (
                      `${t("addIngredientBtn")} • ${ingredientPortionGrams} ${tMeals("grams")}`
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
