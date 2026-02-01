import { TrendingUp, Utensils, Flame } from "lucide-react";
import { useDashboard } from "@/app/hooks/useDashboard";
import { useTranslations } from 'next-intl';

export default function HeroSection() {
  const { data: dashboardData } = useDashboard();
  const t = useTranslations('dashboard');
  const totalRecipes = dashboardData?.totalRecipes || 0;
  const todayCooks = dashboardData?.cookingStats.todayCooks || 0;
  const thisWeekCooks = dashboardData?.cookingStats.thisWeekCooks || 0;

  return (
    <section
      className="w-full flex flex-col items-center justify-center bg-muted/30 border border-border/50 py-10 px-4 sm:px-6 md:py-16 md:px-8 rounded-xl shadow-md"
      aria-labelledby="dashboard-hero-title"
    >
      <div className="flex flex-col items-center justify-center gap-2 md:gap-3 text-center max-w-3xl">
        <h1 id="dashboard-hero-title" className="text-2xl sm:text-3xl md:text-5xl font-semibold">
          {t('welcome')}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base md:text-xl">
          {t('readyToCook')}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 w-full max-w-6xl mx-auto gap-4 sm:gap-6 md:gap-8 mt-8 md:mt-12">
        <div className="flex w-full items-center justify-between sm:justify-start gap-4 sm:gap-5 border border-border/50 py-4 sm:py-6 md:py-8 px-4 sm:px-6 md:px-8 rounded-lg md:rounded-xl shadow hover:shadow-md transition-all bg-white dark:bg-gray-950">
          <div className="text-primary bg-primary/15 p-2.5 sm:p-3 md:p-3.5 rounded-lg md:rounded-xl">
            <Utensils className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          <div className="flex flex-col items-end sm:items-start">
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base">{t('todayMeals')}</p>
            <p className="text-foreground text-xl sm:text-2xl md:text-3xl font-semibold">{todayCooks}</p>
          </div>
        </div>
        <div className="flex w-full items-center justify-between sm:justify-start gap-4 sm:gap-5 border border-border/50 py-4 sm:py-6 md:py-8 px-4 sm:px-6 md:px-8 rounded-lg md:rounded-xl shadow hover:shadow-md transition-all bg-white dark:bg-gray-950">
          <div className="text-foreground bg-primary/15 p-2.5 sm:p-3 md:p-3.5 rounded-lg md:rounded-xl">
            <TrendingUp className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          <div className="flex flex-col items-end sm:items-start">
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base">{t('totalRecipes')}</p>
            <p className="text-foreground text-xl sm:text-2xl md:text-3xl font-semibold">{totalRecipes}</p>
          </div>
        </div>
        <div className="flex w-full items-center justify-between sm:justify-start gap-4 sm:gap-5 border border-border/50 py-4 sm:py-6 md:py-8 px-4 sm:px-6 md:px-8 rounded-lg md:rounded-xl shadow hover:shadow-md transition-all bg-white dark:bg-gray-950">
          <div className="text-primary bg-primary/15 p-2.5 sm:p-3 md:p-3.5 rounded-lg md:rounded-xl">
            <Flame className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          <div className="flex flex-col items-end sm:items-start">
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base">{t('thisWeekCooking')}</p>
            <p className="text-foreground text-xl sm:text-2xl md:text-3xl font-semibold">{thisWeekCooks}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
