import {
   Heart,
   CalendarDays,
   Clock,
   Trash2,
   Eye,
   Loader2,
   ChefHat,
} from "lucide-react";
import {
   Table,
   TableCell,
   TableHead,
   TableBody,
   TableHeader,
   TableRow,
} from "../ui/table";
import { useCookingHistory } from "@/app/hooks/useCookingHistory";
import { format } from "date-fns";
import { Button } from "../ui/button";
import CookingHistoryDelete from "@/components/forms/CookingHistoryDelete";
import { useEffect, useRef } from "react";
import { calculateRecipeNutritionData } from "../../../utils/calculations/nutrition";
import { Link } from "@/i18n/routing";

interface CookingHistoryTablesProps {
   searchTerm: string;
   startDate: Date | undefined;
   endDate: Date | undefined;
}

export default function CookingHistoryTables({
   searchTerm,
   startDate,
   endDate,
}: CookingHistoryTablesProps) {
   const {
      data: cookingHistory,
      hasNextPage,
      fetchNextPage,
      isFetchingNextPage,
      isLoading,
      isError,
      refetch,
   } = useCookingHistory({
      search: searchTerm,
      startDate,
      endDate,
   });
   const observerRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      const observer = new IntersectionObserver(
         (entries) => {
            if (
               entries[0].isIntersecting &&
               hasNextPage &&
               !isFetchingNextPage
            ) {
               fetchNextPage();
            }
         },
         { threshold: 0.1 }
      );
      const currentObserver = observerRef.current;
      if (currentObserver) {
         observer.observe(currentObserver);
      }

      return () => {
         if (currentObserver) {
            observer.unobserve(currentObserver);
         }
      };
   }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

   return (
      <div className="border border-border rounded-xl overflow-hidden shadow-sm bg-white dark:bg-gray-950">
         <Table>
            <TableHeader>
               <TableRow className="bg-gray-50/80 dark:bg-gray-900/50 hover:bg-gray-50/80 dark:hover:bg-gray-900/50 border-b-2 border-gray-200 dark:border-gray-800 h-16">
                  <TableHead className="text-lg font-semibold">
                     Recipe
                  </TableHead>
                  <TableHead className="text-lg font-semibold">
                     Nutrition
                  </TableHead>
                  <TableHead className="text-lg font-semibold">
                     Date & Time
                  </TableHead>
                  <TableHead className="text-lg font-semibold">
                     Times Cooked
                  </TableHead>
                  <TableHead className="text-lg font-semibold text-right">
                     Actions
                  </TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {isLoading ? (
                  <TableRow>
                     <TableCell colSpan={5} className="py-20">
                        <div className="flex justify-center items-center">
                           <div className="text-center">
                              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                              <p className="text-lg font-semibold text-muted-foreground">
                                 Loading cooking history...
                              </p>
                              <p className="text-base text-muted-foreground mt-2">
                                 Please wait while we fetch your data
                              </p>
                           </div>
                        </div>
                     </TableCell>
                  </TableRow>
               ) : isError ? (
                  <TableRow>
                     <TableCell colSpan={5} className="py-20">
                        <div className="flex justify-center items-center">
                           <div className="text-center flex flex-col gap-4">
                              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                                 Error loading cooking history
                              </p>
                              <p className="text-base text-muted-foreground">
                                 Please try again later
                              </p>
                              <Button
                                 onClick={() => refetch()}
                                 variant="outline"
                                 size="sm"
                              >
                                 Retry
                              </Button>
                           </div>
                        </div>
                     </TableCell>
                  </TableRow>
               ) : cookingHistory?.pages.flatMap((page) => page.data).length ===
               0 ? (
                  <TableRow>
                     <TableCell colSpan={5} className="py-20">
                        <div className="flex justify-center items-center">
                           <div className="text-center flex flex-col items-center gap-3">
                              <ChefHat className="w-12 h-12 text-muted-foreground" />
                              <p className="text-lg font-semibold text-muted-foreground">
                                 No cooking history yet
                              </p>
                              <p className="text-base text-muted-foreground">
                                 Cook something to see your history!
                              </p>
                           </div>
                        </div>
                     </TableCell>
                  </TableRow>
               ) : (
                  cookingHistory?.pages
                     .flatMap((page) => page.data)
                     .map((cookingHistory) => {
                        const recipeNutritionData =
                           calculateRecipeNutritionData(cookingHistory.recipe);
                        return (
                           <TableRow
                              key={cookingHistory.id}
                              className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                              <TableCell className="py-6 max-w-xs">
                                 <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                       <h3 className="text-xl font-semibold text-foreground truncate">
                                          {cookingHistory.recipe.name}
                                       </h3>
                                       {cookingHistory.recipe.isFavorite && (
                                          <Heart className="w-5 h-5 text-red-500 fill-current flex-shrink-0" />
                                       )}
                                    </div>
                                    <p className="text-base text-muted-foreground line-clamp-2 leading-relaxed">
                                       {cookingHistory.recipe.description}
                                    </p>
                                 </div>
                              </TableCell>

                              <TableCell className="py-6">
                                 <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                       <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 font-semibold text-sm">
                                          {Number(
                                             recipeNutritionData.calories
                                          ).toFixed(1)}{" "}
                                          kcal
                                       </span>
                                       <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-semibold text-sm">
                                          {Number(
                                             recipeNutritionData.protein
                                          ).toFixed(1)}
                                          g
                                       </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                       <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 font-semibold text-sm">
                                          {Number(
                                             recipeNutritionData.carbs
                                          ).toFixed(1)}
                                          g
                                       </span>
                                       <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-semibold text-sm">
                                          {Number(
                                             recipeNutritionData.fat
                                          ).toFixed(1)}
                                          g
                                       </span>
                                    </div>
                                 </div>
                              </TableCell>

                              <TableCell className="py-6">
                                 <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2 text-base font-medium">
                                       <CalendarDays className="w-5 h-5 text-muted-foreground" />
                                       {format(
                                          cookingHistory.cookedAt,
                                          "MM/dd/yyyy"
                                       )}
                                    </div>
                                    <div className="flex items-center gap-2 text-base text-muted-foreground">
                                       <Clock className="w-5 h-5" />
                                       {format(
                                          cookingHistory.cookedAt,
                                          "HH:mm"
                                       )}
                                    </div>
                                 </div>
                              </TableCell>

                              <TableCell className="py-6">
                                 <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 font-semibold text-sm">
                                       {cookingHistory.recipe.timesCooked || 0}{" "}
                                       times
                                    </span>
                                 </div>
                              </TableCell>

                              <TableCell className="py-6">
                                 <div className="flex items-center justify-end gap-2">
                                    <Link href={`/recipes/${cookingHistory.recipe.id}`} prefetch={true}>
                                       <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-12 w-12 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
                                          <Eye className="size-6" />
                                       </Button>
                                    </Link>
                                    <CookingHistoryDelete
                                       cookingHistory={cookingHistory}>
                                       <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-10 w-10 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                                          <Trash2 className="size-5" />
                                       </Button>
                                    </CookingHistoryDelete>
                                 </div>
                              </TableCell>
                           </TableRow>
                        );
                     })
               )}
            </TableBody>
         </Table>
         {isFetchingNextPage && (
            <div className="flex justify-center items-center py-6 border-t border-border">
               <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                     Loading more cooking history...
                  </p>
               </div>
            </div>
         )}
         <div ref={observerRef} className="h-4"></div>
      </div>
   );
}
