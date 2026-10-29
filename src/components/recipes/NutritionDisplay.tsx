import { NutritionalData, calculateNutritionPerServing } from "../../../utils/calculations/nutrition";
import { useTranslations } from 'next-intl';

interface NutritionDisplayProps {
    nutrition: NutritionalData;
    servings?: number;
    showPerServing?: boolean;
    labelPer100g?: boolean;
}

export default function NutritionDisplay({ 
    nutrition, 
    servings = 1, 
    showPerServing = false,
    labelPer100g = false,
}: NutritionDisplayProps) {
    const t = useTranslations('recipes');
    const displayedNutrition = showPerServing ? calculateNutritionPerServing(nutrition, servings) : nutrition;

    return (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5 p-2 sm:p-3 bg-muted/40 border border-border/40 rounded-xl">
          <div className="text-center p-2 rounded-lg bg-card shadow-xs border border-border/60 min-w-0">
            <div className="text-base sm:text-xl font-bold text-primary tabular-nums whitespace-nowrap">
              {Number(displayedNutrition.calories || 0).toFixed(1)}
            </div>
            <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">{t('calories')} {labelPer100g && t('per100g')}</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-card shadow-xs border border-border/60 min-w-0">
            <div className="text-base sm:text-xl font-bold text-foreground tabular-nums whitespace-nowrap">
              {Number(displayedNutrition.protein || 0).toFixed(1)}{t('g')}
            </div>
            <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">{t('protein')}</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-card shadow-xs border border-border/60 min-w-0">
            <div className="text-base sm:text-xl font-bold text-foreground tabular-nums whitespace-nowrap">
              {Number(displayedNutrition.fat || 0).toFixed(1)}{t('g')}
            </div>
            <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">{t('fat')}</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-card shadow-xs border border-border/60 min-w-0">
            <div className="text-base sm:text-xl font-bold text-foreground tabular-nums whitespace-nowrap">
              {Number(displayedNutrition.carbs || 0).toFixed(1)}{t('g')}
            </div>
            <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">{t('carbs')}</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-card shadow-xs border border-border/60 col-span-2 sm:col-span-1 min-w-0">
            <div className="text-base sm:text-xl font-bold text-foreground tabular-nums whitespace-nowrap">
              {Number(displayedNutrition.fiber || 0).toFixed(1)}{t('g')}
            </div>
            <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">{t('fiber')}</div>
          </div>
        </div>
    )
}