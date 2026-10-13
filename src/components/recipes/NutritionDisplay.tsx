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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="text-center p-2 rounded-md bg-background/60 shadow-sm">
            <div className="text-xl font-bold text-orange-600">
              {Number(displayedNutrition.calories || 0).toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">{t('calories')} {labelPer100g && t('per100g')}</div>
          </div>
          <div className="text-center p-2 rounded-md bg-background/60 shadow-sm">
            <div className="text-xl font-bold text-blue-600">
              {Number(displayedNutrition.protein || 0).toFixed(1)}{t('g')}
            </div>
            <div className="text-xs text-muted-foreground">{t('protein')}</div>
          </div>
          <div className="text-center p-2 rounded-md bg-background/60 shadow-sm">
            <div className="text-xl font-bold text-amber-600">
              {Number(displayedNutrition.fat || 0).toFixed(1)}{t('g')}
            </div>
            <div className="text-xs text-muted-foreground">{t('fat')}</div>
          </div>
          <div className="text-center p-2 rounded-md bg-background/60 shadow-sm">
            <div className="text-xl font-bold text-emerald-600">
              {Number(displayedNutrition.carbs || 0).toFixed(1)}{t('g')}
            </div>
            <div className="text-xs text-muted-foreground">{t('carbs')}</div>
          </div>
          <div className="text-center p-2 rounded-md bg-background/60 shadow-sm col-span-2 sm:col-span-1">
            <div className="text-xl font-bold text-purple-600">
              {Number(displayedNutrition.fiber || 0).toFixed(1)}{t('g')}
            </div>
            <div className="text-xs text-muted-foreground">{t('fiber')}</div>
          </div>
        </div>
    )
}