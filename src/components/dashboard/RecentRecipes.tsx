"use client";
import { ChefHat, ArrowRight, Heart, Star, Eye, Loader2 } from "lucide-react";
import { useDashboard } from "@/app/hooks/useDashboard";
import { calculateRecipeNutritionData } from "../../../utils/calculations/nutrition";
import { Link } from '@/i18n/routing';
import { Button } from "../ui/button";
import { useTranslations } from 'next-intl';

export default function RecentRecipes() {
   const { data: dashboardData, isLoading, isError, refetch } = useDashboard();
   const t = useTranslations('dashboard');
   const tCommon = useTranslations('common');
   const recentRecipes = dashboardData?.recentRecipes.slice(0, 4) || [];

   if (isLoading) {
      return (
         <section className="w-full h-full border min-h-96 border-gray-200/80 rounded-xl flex flex-col shadow-md dark:shadow-muted-foreground/10 bg-white dark:bg-gray-950">
            <span className="flex w-full px-4 sm:px-8 pb-4 sm:pb-6 pt-6 sm:pt-8 flex-col items-center gap-2 sm:flex-row sm:justify-between">
               <h2 className="text-2xl sm:text-3xl font-semibold text-center sm:text-left">
                  {t('recentRecipes')}
               </h2>
               <Link
                  className="flex items-center gap-1.5 text-primary text-sm sm:text-base font-semibold hover:text-primary/80 transition-all"
                  href="/recipes">
                  {t('viewAll')} <ArrowRight size={20} />
               </Link>
            </span>
            <div className="flex flex-col items-center gap-3 py-20">
               <div className="text-muted-foreground">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
               </div>
               <p className="text-muted-foreground text-base">
                  {t('loadingRecipes')}
               </p>
            </div>
         </section>
      );
   }

   if (isError) {
      return (
         <section className="w-full h-full border border-gray-200/80 rounded-xl min-h-96 flex flex-col shadow-md dark:shadow-muted-foreground/10 bg-white dark:bg-gray-950">
            <span className="flex w-full px-8 pb-6 pt-8 justify-between items-center">
               <h2 className="text-3xl font-semibold">{t('recentRecipes')}</h2>
            </span>
            <div className="flex flex-col items-center gap-4 py-20">
               <p className="text-base text-red-600 dark:text-red-400 font-medium">
                  {t('errorLoadingRecipes')}
               </p>
               <Button onClick={() => refetch()} variant="outline" size="sm">
                  {tCommon('retry')}
               </Button>
            </div>
         </section>
      );
   }

   if (!recentRecipes || recentRecipes.length === 0) {
      return (
         <section className="w-full h-full border border-gray-200/80 rounded-xl min-h-96 flex flex-col items-center justify-center shadow-md dark:shadow-muted-foreground/10 bg-white dark:bg-gray-950">
            <span className="flex w-full px-8 pb-6 pt-8 justify-between items-center">
               <h2 className="text-3xl font-semibold">{t('recentRecipes')}</h2>
               <Link
                  className="flex items-center gap-1.5 text-primary text-base font-semibold hover:text-primary/80 transition-all"
                  href="/recipes">
                  {t('viewAll')} <ArrowRight size={20} />
               </Link>
            </span>
            <div className="flex flex-col items-center gap-3 py-20">
               <div className="text-muted-foreground">
                  <ChefHat size={64} />
               </div>
               <p className="text-muted-foreground text-base">
                  {t('noRecipesYet')}
               </p>
            </div>
         </section>
      );
   }

   return (
      <section className="w-full h-full border border-gray-200/80 rounded-xl min-h-96 flex flex-col shadow-md dark:shadow-muted-foreground/10 bg-white dark:bg-gray-950">
         <span className="flex w-full px-8 pb-6 pt-8 justify-between items-center">
            <h2 className="text-3xl font-semibold">{t('recentRecipes')}</h2>
            <Link
               className="flex items-center gap-1.5 text-primary text-base font-semibold hover:text-primary/80 transition-all"
               href="/recipes">
               {t('viewAll')} <ArrowRight size={20} />
            </Link>
         </span>

         <div className="px-4 sm:px-8 pb-6 sm:pb-8">
            <div className="flex flex-col gap-4">
               {recentRecipes.map((recipe) => {
                  const nutrition = calculateRecipeNutritionData(recipe);
                  return (
                     <Link
                        key={recipe.id}
                        href={`/recipes/${recipe.id}`}
                        prefetch={true}
                        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow block">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                           <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                 <h3 className="text-lg font-semibold text-foreground">
                                    {recipe.name}
                                 </h3>
                                 {recipe.rating && (
                                    <div className="flex items-center gap-1">
                                       <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                       <span className="text-sm text-muted-foreground">
                                          {recipe.rating}/100
                                       </span>
                                    </div>
                                 )}
                                 {recipe.isFavorite && (
                                    <Heart className="w-4 h-4 text-red-500 fill-current" />
                                 )}
                              </div>

                              {recipe.description && (
                                 <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                    {recipe.description}
                                 </p>
                              )}

                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
                                 <span className="inline-flex items-center px-2 py-1 rounded-md bg-orange-50 dark:bg-orange-950/30 text-calories dark:text-orange-400 font-medium">
                                    {Number(nutrition.calories).toFixed(0)} kcal
                                 </span>
                                 <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/30 text-protein dark:text-blue-400 font-medium">
                                    {Number(nutrition.protein).toFixed(1)}g {t('protein')}
                                 </span>
                                 <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 dark:bg-green-950/30 text-carbs dark:text-green-400 font-medium">
                                    {Number(nutrition.carbs).toFixed(1)}g {t('carbs')}
                                 </span>
                                 <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-50 dark:bg-red-950/30 text-fat dark:text-red-400 font-medium">
                                    {Number(nutrition.fat).toFixed(1)}g {t('fat')}
                                 </span>
                              </div>
                           </div>

                           <div className="ml-4">
                              <Link href={`/recipes/${recipe.id}`} prefetch={true}>
                                 <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
                                    <Eye className="size-5" />
                                 </Button>
                              </Link>
                           </div>
                        </div>
                     </Link>
                  );
               })}
            </div>
         </div>
      </section>
   );
}
