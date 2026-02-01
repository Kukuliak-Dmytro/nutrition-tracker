import { Plus, PackagePlus, ChefHat } from "lucide-react";
import { IngredientCreateForm } from "@/components/forms/IngredientCreateForm";
import { RecipeCreateForm } from "@/components/forms/RecipeCreateForm";
import { IngredientSearchModal } from "@/components/forms/IngredientSearchModal";
import { useTranslations } from 'next-intl';

export default function QuickActions() {
   const t = useTranslations('dashboard');
   
   return (
      <section
         className="w-full border border-gray-200/80 rounded-xl flex flex-col items-center justify-center shadow-md dark:shadow-muted-foreground/10 bg-white dark:bg-gray-950"
         aria-labelledby="quick-actions-title">
         <span className="flex w-full px-8 pb-6 pt-8 justify-center sm:justify-start">
            <h2
               id="quick-actions-title"
               className="text-xl sm:text-2xl md:text-3xl font-semibold text-center sm:text-left">
               {t('quickActions')}
            </h2>
         </span>
         <div className="flex flex-col sm:flex-row justify-between w-full px-8 pb-8 pt-4 gap-6">
           <RecipeCreateForm>
               <button type="button" className="group text-left flex items-center gap-4 p-4 sm:p-6 shadow-md bg-primary text-primary-foreground rounded-xl w-full h-20 sm:h-24 cursor-pointer hover:bg-orange-600/90 active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary dark:focus-visible:ring-offset-gray-950">
                  <div className="bg-white/20 text-primary-foreground rounded-xl p-2.5 sm:p-3 group-hover:scale-105 transition-all dark:bg-gray-200">
                     <Plus className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col w-full gap-0.5 sm:gap-1">
                     <p className="font-semibold text-sm sm:text-lg">
                        {t('createRecipe')}
                     </p>
                     <p className="text-sm font-light opacity-90">
                        {t('buildNewDish')}
                     </p>
                  </div>
               </button>
            </RecipeCreateForm>

            <IngredientCreateForm>
               <button type="button" className="group text-left flex items-center gap-4 p-4 sm:p-6 shadow-md bg-chart-2 text-primary-foreground rounded-xl w-full h-20 sm:h-24 cursor-pointer hover:bg-green-800/90 active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-chart-2 dark:focus-visible:ring-offset-gray-950">
                  <div className="bg-white/20 text-primary-foreground rounded-xl p-2.5 sm:p-3 group-hover:scale-105 transition-all">
                     <PackagePlus className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex flex-col w-full gap-0.5 sm:gap-1">
                     <p className="font-semibold text-sm sm:text-lg">
                      {t('createIngredient')}
                     </p>
                     <p className="text-sm font-light opacity-90">
                        {t('createNewIngredient')}
                     </p>
                  </div>
               </button>
            </IngredientCreateForm>
            <IngredientSearchModal>
               <button type="button" className="group text-left flex items-center gap-4 p-4 sm:p-6 shadow-md bg-purple-600 text-white rounded-xl w-full h-20 sm:h-24 cursor-pointer hover:bg-purple-700 active:scale-[0.99] transition-all dark:hover:bg-purple-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-600 dark:focus-visible:ring-offset-gray-950">
                  <div className="bg-white/20 text-white rounded-xl p-2.5 sm:p-3 group-hover:scale-105 transition-all">
                     <ChefHat className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex flex-col w-full gap-0.5 sm:gap-1">
                     <p className="font-semibold text-sm sm:text-lg">
                        {t('searchByIngredients')}
                     </p>
                     <p className="text-base sm:text-sm font-light opacity-90">
                        {t('findRecipes')}
                     </p>
                  </div>
               </button>
            </IngredientSearchModal>
         </div>
      </section>
   );
}
