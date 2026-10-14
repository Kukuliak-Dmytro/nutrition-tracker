"use client";

import { useState, useEffect, useMemo } from "react";
import { FoodLogEntryResponse } from "../../../utils/schemas/foodLog";
import { useUpdateFoodLogEntry } from "@/app/hooks/useFoodLog";
import { calculatePortionNutrition } from "../../../utils/calculations/nutrition";
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
import { Loader2, Utensils, Apple, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

interface EditFoodModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  entry: FoodLogEntryResponse | null;
}

export function EditFoodModal({
  isOpen,
  onOpenChange,
  entry,
}: EditFoodModalProps) {
  const t = useTranslations("editFoodModal");
  const tMeals = useTranslations("meals");
  const { mutate: updateEntry, isPending } = useUpdateFoodLogEntry();

  const isIngredientOrRecipe = Boolean(entry?.recipeId || entry?.ingredientId);

  // Grams for recipe or ingredient
  const [weightGrams, setWeightGrams] = useState<number | "">("");

  // Custom fields
  const [customName, setCustomName] = useState("");
  const [customWeight, setCustomWeight] = useState<number | "">("");
  const [customCalories, setCustomCalories] = useState<number | "">("");
  const [customProtein, setCustomProtein] = useState<number | "">("");
  const [customFat, setCustomFat] = useState<number | "">("");
  const [customCarbs, setCustomCarbs] = useState<number | "">("");
  const [customFiber, setCustomFiber] = useState<number | "">("");

  // Populate state whenever entry changes
  useEffect(() => {
    if (entry) {
      if (isIngredientOrRecipe) {
        setWeightGrams(entry.weightGrams ? Number(entry.weightGrams) : 100);
      } else {
        setCustomName(entry.name);
        setCustomWeight(entry.weightGrams ? Number(entry.weightGrams) : "");
        setCustomCalories(Number(entry.calories));
        setCustomProtein(Number(entry.protein));
        setCustomFat(Number(entry.fat));
        setCustomCarbs(Number(entry.carbs));
        setCustomFiber(entry.fiber ? Number(entry.fiber) : 0);
      }
    }
  }, [entry, isIngredientOrRecipe]);

  // Per 100g calculated from existing entry values
  const per100g = useMemo(() => {
    if (!entry || !entry.weightGrams || Number(entry.weightGrams) <= 0) {
      return {
        calories: Number(entry?.calories || 0),
        protein: Number(entry?.protein || 0),
        fat: Number(entry?.fat || 0),
        carbs: Number(entry?.carbs || 0),
        fiber: Number(entry?.fiber || 0),
      };
    }
    const origWeight = Number(entry.weightGrams);
    return {
      calories: (Number(entry.calories) / origWeight) * 100,
      protein: (Number(entry.protein) / origWeight) * 100,
      fat: (Number(entry.fat) / origWeight) * 100,
      carbs: (Number(entry.carbs) / origWeight) * 100,
      fiber: (Number(entry.fiber || 0) / origWeight) * 100,
    };
  }, [entry]);

  // Recalculated values for the currently selected grams
  const currentCalculated = useMemo(() => {
    const w = typeof weightGrams === "number" ? weightGrams : 0;
    return calculatePortionNutrition(per100g, w);
  }, [per100g, weightGrams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;

    if (isIngredientOrRecipe) {
      const numericWeight = typeof weightGrams === "number" ? weightGrams : 0;
      if (numericWeight <= 0) return;

      updateEntry(
        {
          id: entry.id,
          entry: {
            weightGrams: numericWeight,
            calories: currentCalculated.calories,
            protein: currentCalculated.protein,
            fat: currentCalculated.fat,
            carbs: currentCalculated.carbs,
            fiber: currentCalculated.fiber,
          },
        },
        {
          onSuccess: () => onOpenChange(false),
        }
      );
    } else {
      if (!customName.trim()) return;
      const cals = typeof customCalories === "number" ? customCalories : 0;

      updateEntry(
        {
          id: entry.id,
          entry: {
            name: customName.trim(),
            weightGrams:
              typeof customWeight === "number" && customWeight > 0
                ? customWeight
                : null,
            calories: cals,
            protein: typeof customProtein === "number" ? customProtein : 0,
            fat: typeof customFat === "number" ? customFat : 0,
            carbs: typeof customCarbs === "number" ? customCarbs : 0,
            fiber: typeof customFiber === "number" ? customFiber : 0,
          },
        },
        {
          onSuccess: () => onOpenChange(false),
        }
      );
    }
  };

  const adjustGrams = (delta: number) => {
    const current = typeof weightGrams === "number" ? weightGrams : 0;
    const next = Math.max(1, current + delta);
    setWeightGrams(next);
  };

  if (!entry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg font-bold">
              {t("title")}
            </DialogTitle>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
              {entry.recipeId ? (
                <>
                  <Utensils className="w-3 h-3 text-primary" />
                  <span>{t("dishBadge")}</span>
                </>
              ) : entry.ingredientId ? (
                <>
                  <Apple className="w-3 h-3 text-emerald-500" />
                  <span>{t("ingredientBadge")}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{t("customBadge")}</span>
                </>
              )}
            </span>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {isIngredientOrRecipe ? (
            /* Mode 1: Recipe or Ingredient - ONLY GRAMS */
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <p className="font-semibold text-sm text-foreground">
                  {entry.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  100{tMeals("grams")}: {Math.round(per100g.calories)} {tMeals("kcal")} &bull;{" "}
                  {tMeals("proteinAbbr")}: {per100g.protein.toFixed(1)}{tMeals("grams")} &bull;{" "}
                  {tMeals("fatAbbr")}: {per100g.fat.toFixed(1)}{tMeals("grams")} &bull;{" "}
                  {tMeals("carbsAbbr")}: {per100g.carbs.toFixed(1)}{tMeals("grams")} &bull;{" "}
                  {tMeals("fiberAbbr")}: {per100g.fiber.toFixed(1)}{tMeals("grams")}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-weight" className="text-xs font-medium">
                    {t("weightGrams")}
                  </Label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjustGrams(-50)}
                      className="px-1.5 py-0.5 text-[11px] rounded bg-muted hover:bg-muted/80 text-muted-foreground cursor-pointer">
                      -50
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustGrams(-10)}
                      className="px-1.5 py-0.5 text-[11px] rounded bg-muted hover:bg-muted/80 text-muted-foreground cursor-pointer">
                      -10
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustGrams(10)}
                      className="px-1.5 py-0.5 text-[11px] rounded bg-muted hover:bg-muted/80 text-muted-foreground cursor-pointer">
                      +10
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustGrams(50)}
                      className="px-1.5 py-0.5 text-[11px] rounded bg-muted hover:bg-muted/80 text-muted-foreground cursor-pointer">
                      +50
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Input
                    id="edit-weight"
                    type="number"
                    min={1}
                    max={5000}
                    step={1}
                    required
                    value={weightGrams}
                    onChange={(e) =>
                      setWeightGrams(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="h-10 text-base font-semibold pr-8 rounded-xl"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                    {tMeals("grams")}
                  </span>
                </div>
              </div>

              {/* Dynamic live preview */}
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {t("calculatedNutrition", {
                    grams: typeof weightGrams === "number" ? weightGrams : 0,
                  })}
                </p>
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <span className="text-xl font-bold text-orange-600">
                    {currentCalculated.calories} {tMeals("kcal")}
                  </span>
                  <div className="text-xs text-muted-foreground space-x-2">
                    <span>
                      {tMeals("proteinAbbr")}: <b>{currentCalculated.protein}</b>{tMeals("grams")}
                    </span>
                    <span>
                      {tMeals("fatAbbr")}: <b>{currentCalculated.fat}</b>{tMeals("grams")}
                    </span>
                    <span>
                      {tMeals("carbsAbbr")}: <b>{currentCalculated.carbs}</b>{tMeals("grams")}
                    </span>
                    <span>
                      {tMeals("fiberAbbr")}: <b>{currentCalculated.fiber}</b>{tMeals("grams")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Mode 2: Custom One-Time - ALL FIELDS EDITABLE */
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="custom-name" className="text-xs font-medium">
                  {t("name")}
                </Label>
                <Input
                  id="custom-name"
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  className="h-9 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="custom-weight" className="text-xs font-medium">
                    {t("weightGrams")}
                  </Label>
                  <Input
                    id="custom-weight"
                    type="number"
                    min={0}
                    step={1}
                    value={customWeight}
                    onChange={(e) =>
                      setCustomWeight(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    placeholder="г"
                    className="h-9 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="custom-calories" className="text-xs font-medium text-orange-600">
                    {t("calories")}
                  </Label>
                  <Input
                    id="custom-calories"
                    type="number"
                    min={0}
                    step={0.1}
                    required
                    value={customCalories}
                    onChange={(e) =>
                      setCustomCalories(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    placeholder="ккал"
                    className="h-9 rounded-xl text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="custom-p" className="text-xs font-medium">
                    {t("protein")}
                  </Label>
                  <Input
                    id="custom-p"
                    type="number"
                    min={0}
                    step={0.1}
                    value={customProtein}
                    onChange={(e) =>
                      setCustomProtein(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="h-9 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="custom-f" className="text-xs font-medium">
                    {t("fat")}
                  </Label>
                  <Input
                    id="custom-f"
                    type="number"
                    min={0}
                    step={0.1}
                    value={customFat}
                    onChange={(e) =>
                      setCustomFat(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="h-9 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="custom-c" className="text-xs font-medium">
                    {t("carbs")}
                  </Label>
                  <Input
                    id="custom-c"
                    type="number"
                    min={0}
                    step={0.1}
                    value={customCarbs}
                    onChange={(e) =>
                      setCustomCarbs(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="h-9 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="custom-fib" className="text-xs font-medium">
                    {t("fiber")}
                  </Label>
                  <Input
                    id="custom-fib"
                    type="number"
                    min={0}
                    step={0.1}
                    value={customFiber}
                    onChange={(e) =>
                      setCustomFiber(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="h-9 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-9">
              {t("cancelBtn")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="rounded-xl h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              {isPending ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t("saving")}</span>
                </span>
              ) : (
                t("saveBtn")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
