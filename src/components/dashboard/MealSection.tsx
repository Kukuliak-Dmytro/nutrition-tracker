"use client";
import { useState } from "react";
import { MealType, FoodLogEntryResponse } from "../../../utils/schemas/foodLog";
import { useDeleteFoodLogEntry } from "@/app/hooks/useFoodLog";
import { AddFoodModal } from "./AddFoodModal";
import { EditFoodModal } from "./EditFoodModal";
import { Button } from "@/components/ui/button";
import { PlusIcon, Trash2, Pencil } from "lucide-react";

import { useTranslations } from "next-intl";

interface MealSectionProps {
  mealType: MealType;
  title: string;
  icon: React.ReactNode;
  date: string;
  entries: FoodLogEntryResponse[];
}

export function MealSection({
  mealType,
  title,
  icon,
  date,
  entries,
}: MealSectionProps) {
  const tMeals = useTranslations("meals");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FoodLogEntryResponse | null>(null);
  const { mutate: deleteEntry } = useDeleteFoodLogEntry();

  const subtotal = entries.reduce(
    (acc, item) => ({
      calories: Math.round((acc.calories + Number(item.calories)) * 10) / 10,
      protein: Math.round((acc.protein + Number(item.protein)) * 10) / 10,
      fat: Math.round((acc.fat + Number(item.fat)) * 10) / 10,
      carbs: Math.round((acc.carbs + Number(item.carbs)) * 10) / 10,
      fiber: Math.round((acc.fiber + Number(item.fiber || 0)) * 10) / 10,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 }
  );

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-muted text-muted-foreground">{icon}</div>
          <div>
            <h3 className="font-bold text-base text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">
              {entries.length === 0
                ? tMeals("emptyMeal")
                : tMeals("itemsCount", { count: entries.length })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            <div className="text-right hidden sm:block">
              <span className="font-bold text-foreground text-sm">
                {subtotal.calories} <span className="text-xs font-normal text-muted-foreground">{tMeals("kcal")}</span>
              </span>
              <div className="text-[11px] text-muted-foreground">
                <span>{tMeals("proteinAbbr")}: <strong className="font-semibold text-foreground">{subtotal.protein}g</strong></span> &bull;{" "}
                <span>{tMeals("fatAbbr")}: <strong className="font-semibold text-foreground">{subtotal.fat}g</strong></span> &bull;{" "}
                <span>{tMeals("carbsAbbr")}: <strong className="font-semibold text-foreground">{subtotal.carbs}g</strong></span> &bull;{" "}
                <span>{tMeals("fiberAbbr")}: <strong className="font-semibold text-foreground">{subtotal.fiber}g</strong></span>
              </div>
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1 text-xs rounded-xl h-8">
            <PlusIcon className="w-3.5 h-3.5" />
            {tMeals("addFood")}
          </Button>
        </div>
      </div>

      {/* Mobile Subtotal bar */}
      {entries.length > 0 && (
        <div className="sm:hidden flex items-center justify-between p-2 rounded-lg bg-muted/40 text-xs">
          <span className="font-bold text-foreground">
            {subtotal.calories} <span className="text-xs font-normal text-muted-foreground">{tMeals("kcal")}</span>
          </span>
          <span className="text-muted-foreground">
            <span>{tMeals("proteinAbbr")}:<strong className="font-semibold text-foreground">{subtotal.protein}g</strong></span> &bull;{" "}
            <span>{tMeals("fatAbbr")}:<strong className="font-semibold text-foreground">{subtotal.fat}g</strong></span> &bull;{" "}
            <span>{tMeals("carbsAbbr")}:<strong className="font-semibold text-foreground">{subtotal.carbs}g</strong></span> &bull;{" "}
            <span>{tMeals("fiberAbbr")}:<strong className="font-semibold text-foreground">{subtotal.fiber}g</strong></span>
          </span>
        </div>
      )}

      {/* Items list */}
      {entries.length > 0 && (
        <div className="divide-y border rounded-xl overflow-hidden bg-background/50">
          {entries.map((item) => (
            <div
              key={item.id}
              className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">
                    {item.name}
                  </span>
                  {item.weightGrams && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium text-muted-foreground">
                      {Number(item.weightGrams)} {tMeals("grams")}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {Number(item.calories).toFixed(0)} {tMeals("kcal")}
                  </span>
                  <span>
                    {tMeals("proteinAbbr")}: {Number(item.protein).toFixed(1)}{tMeals("grams")}
                  </span>
                  <span>
                    {tMeals("fatAbbr")}: {Number(item.fat).toFixed(1)}{tMeals("grams")}
                  </span>
                  <span>
                    {tMeals("carbsAbbr")}: {Number(item.carbs).toFixed(1)}{tMeals("grams")}
                  </span>
                  <span>
                    {tMeals("fiberAbbr")}: {Number(item.fiber || 0).toFixed(1)}{tMeals("grams")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingEntry(item)}
                  aria-label={tMeals("editEntry")}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteEntry(item.id)}
                  aria-label={tMeals("deleteEntry")}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddFoodModal
        isOpen={isAddOpen}
        onOpenChange={setIsAddOpen}
        date={date}
        mealType={mealType}
        mealTitle={title}
      />

      <EditFoodModal
        isOpen={Boolean(editingEntry)}
        onOpenChange={(open) => !open && setEditingEntry(null)}
        entry={editingEntry}
      />
    </div>
  );
}
