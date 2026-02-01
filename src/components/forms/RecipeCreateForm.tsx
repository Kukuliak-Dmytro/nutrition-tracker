import { useFieldArray, useForm } from "react-hook-form";
import {
   CreateRecipe,
   CreateRecipeSchema,
} from "../../../utils/schemas/recipe";
import {
   calculateRecipeNutrition,
   RecipeIngredient,
} from "../../../utils/calculations/nutrition";
import NutritionDisplay from "@/components/recipes/NutritionDisplay";
import { useCreateRecipe } from "@/app/hooks/useRecipes";
import { useRecipeAIContent } from "@/app/hooks/useGenerateRecipeContent";
import { zodResolver } from "@hookform/resolvers/zod";
import {
   Dialog,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
   DialogContent,
   DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useIngredients } from "@/app/hooks/useIngredients";
import type {
   PaginatedIngredientsResponse,
   IngredientResponse,
} from "../../../utils/schemas";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@/components/ui/popover";
import {
   ChevronsUpDownIcon,
   Loader2,
   PlusIcon,
   Search,
   Trash2,
} from "lucide-react";
import { IngredientCreateForm } from "./IngredientCreateForm";
import { getIngredient } from "@/app/services/ingredients";
import { useTranslations } from 'next-intl';

export function RecipeCreateForm({ children }: { children: React.ReactNode }) {
   const t = useTranslations('recipes');
   const tToast = useTranslations('toast');
   const [isOpen, setIsOpen] = useState(false);
   const [openIngredientIndex, setOpenIngredientIndex] = useState<
      number | null
   >(null);
   const [searchIngredient, setSearchIngredient] = useState("");
   const { mutate: createRecipe } = useCreateRecipe();
   const {
      data: ingredientsData,
      isFetching,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
   } = useIngredients({
      search: searchIngredient,
      limit: 50,
   });
   const filteredIngredients = ingredientsData?.pages.flatMap(
      (page: PaginatedIngredientsResponse) => page.data
   );
   const queryClient = useQueryClient();
   const [selectedIngredients, setSelectedIngredients] = useState<
      Record<string, { id: string; name: string }>
   >({});
   const [fetchedIngredientsCache, setFetchedIngredientsCache] = useState<
      Record<string, unknown>
   >({});

   const {
      register,
      control,
      handleSubmit,
      watch,
      setValue,
      formState: { errors, isSubmitting },
   } = useForm({
      resolver: zodResolver(CreateRecipeSchema),
      defaultValues: {
         name: "",
         description: "",
         instructions: "",
         rating: undefined,
         servings: 1,
         cookingTime: "",
         ingredients: [],
      },
   });

   const { onGenerate, isPendingDesc, isPendingInstr } = useRecipeAIContent({
      watch,
      setValue,
      resolveIngredientName: (id: string) => {
         return (
            selectedIngredients[id]?.name ||
            (fetchedIngredientsCache[id] as IngredientResponse)?.name ||
            ""
         );
      },
   });

   const onSubmit = (data: CreateRecipe) => {
      createRecipe(data, {
         onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recipes"] });
            toast.success(tToast('recipeCreated'));
            setIsOpen(false);
         },
         onError: () => {
            toast.error(tToast('recipeCreateFailed', { name: data.name }));
            setIsOpen(false);
         },
      });
   };

   const { fields, append, remove } = useFieldArray({
      control,
      name: "ingredients",
   });

   const watchedIngredients = watch("ingredients");
   const watchedServings = watch("servings") as number;

   useEffect(() => {
      const fetchMissingIngredients = async () => {
         if (!watchedIngredients || watchedIngredients.length === 0) return;

         const allIngredientIds = watchedIngredients
            .map((ing) => ing.ingredientId)
            .filter(Boolean);

         const missingIds = allIngredientIds.filter((id) => {
            if (fetchedIngredientsCache[id]) return false;
            if (
               ingredientsData?.pages.some(
                  (page: PaginatedIngredientsResponse) =>
                     page.data.some((ing: IngredientResponse) => ing.id === id)
               )
            )
               return false;
            return true;
         });

         if (missingIds.length > 0) {
            const fetches = missingIds.map((id) =>
               getIngredient(id).catch(() => null)
            );
            const results = await Promise.all(fetches);
            const newCache = { ...fetchedIngredientsCache };
            results.forEach((ing) => {
               if (ing && ing.id) newCache[ing.id] = ing;
            });
            setFetchedIngredientsCache(newCache);
         }
      };

      fetchMissingIngredients();
   }, [watchedIngredients, ingredientsData, fetchedIngredientsCache]);

   const calculateCurrentNutrition = () => {
      if (watchedIngredients.length === 0) return null;

      const allIngredients =
         ingredientsData?.pages.flatMap(
            (page: PaginatedIngredientsResponse) => page.data
         ) || [];

      const ingredientsWithNutrition = watchedIngredients
         .filter(
            (ingredient) => ingredient.ingredientId && ingredient.quantityGrams
         )
         .map((ingredient) => {
            let ingredientData = fetchedIngredientsCache[
               ingredient.ingredientId
            ] as (typeof allIngredients)[number] | undefined;
            if (!ingredientData) {
               ingredientData = allIngredients.find(
                  (ing: IngredientResponse) =>
                     ing.id === ingredient.ingredientId
               );
            }

            if (!ingredientData) {
               return null;
            }

            return {
               ingredientId: ingredient.ingredientId,
               quantityGrams: ingredient.quantityGrams,
               nutritionalData: {
                  calories: Number(ingredientData.caloriesPer100g),
                  protein: Number(ingredientData.proteinPer100g),
                  carbs: Number(ingredientData.carbsPer100g),
                  fat: Number(ingredientData.fatPer100g),
               },
            };
         })
         .filter(
            (ingredient): ingredient is RecipeIngredient => ingredient !== null
         );

      if (ingredientsWithNutrition.length === 0) return null;

      return calculateRecipeNutrition(ingredientsWithNutrition);
   };

   return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
         <DialogTrigger asChild>{children}</DialogTrigger>
         <DialogContent className="max-w-5xl sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
               <DialogTitle>{t('createNew')}</DialogTitle>
               <DialogDescription>
                  {t('createNewDescription')}
               </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
               <div className="space-y-4">
                  <div className="border-b pb-2">
                     <h3 className="text-lg font-semibold">
                        {t('basicInformation')}
                     </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">
                           {t('recipeName')} *
                        </Label>
                        <Input
                           type="text"
                           id="name"
                           {...register("name")}
                           placeholder={t('recipeNamePlaceholder')}
                           className="w-full"
                        />
                        {errors.name && (
                           <p className="text-sm text-red-500">
                              {errors.name.message}
                           </p>
                        )}
                     </div>
                     <div className="space-y-2">
                        <Label
                           htmlFor="servings"
                           className="text-sm font-medium">
                           {t('servings')} *
                        </Label>
                        <Input
                           type="number"
                           id="servings"
                           {...register("servings")}
                           placeholder={t('servingsPlaceholder')}
                           className="w-full"
                        />
                        {errors.servings && (
                           <p className="text-sm text-red-500">
                              {errors.servings.message}
                           </p>
                        )}
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="border-b pb-2">
                     <h3 className="text-lg font-semibold">{t('recipeDetails')}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label
                           htmlFor="cookingTime"
                           className="text-sm font-medium">
                           {t('cookingTime')}
                        </Label>
                        <Input
                           type="text"
                           id="cookingTime"
                           {...register("cookingTime")}
                           placeholder={t('cookingTimePlaceholder')}
                           className="w-full"
                        />
                        {errors.cookingTime && (
                           <p className="text-sm text-red-500">
                              {errors.cookingTime.message}
                           </p>
                        )}
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="rating" className="text-sm font-medium">
                           {t('rating')}
                        </Label>
                        <Input
                           type="number"
                           id="rating"
                           {...register("rating")}
                           placeholder={t('ratingPlaceholder')}
                           min="1"
                           max="100"
                           className="w-full"
                        />
                        {errors.rating && (
                           <p className="text-sm text-red-500">
                              {errors.rating.message}
                           </p>
                        )}
                     </div>
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="border-b pb-2">
                     <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{t('ingredients')}</h3>
                        <Button
                           type="button"
                           variant="outline"
                           size="sm"
                           onClick={() =>
                              append({ ingredientId: "", quantityGrams: 0 })
                           }
                           className="flex items-center gap-2">
                           <PlusIcon className="h-4 w-4" />
                           {t('addIngredient')}
                        </Button>
                     </div>
                  </div>
                  {errors.ingredients?.root?.message && (
                     <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600 font-medium">
                           {errors.ingredients.root.message}
                        </p>
                     </div>
                  )}
                  <div className="space-y-3">
                     {fields.map((field, index) => (
                        <div
                           key={field.id}
                           className={`grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-4 p-4 border rounded-lg bg-card shadow-sm ${
                              errors.ingredients?.[index]
                                 ? "border-red-200 bg-red-50/30"
                                 : ""
                           }`}>
                           <div className="space-y-2 min-w-0">
                              <Label
                                 htmlFor={`ingredients.${index}.ingredientId`}
                                 className="text-sm font-medium text-foreground">
                                 {t('ingredientNumber', { number: index + 1 })}
                              </Label>
                              <Popover
                                 open={openIngredientIndex === index}
                                 onOpenChange={(open) => {
                                    setOpenIngredientIndex(open ? index : null);
                                    if (!open) {
                                       setSearchIngredient("");
                                    }
                                 }}>
                                 <PopoverTrigger asChild>
                                    <button
                                       type="button"
                                       role="combobox"
                                       aria-controls={`ingredients.${index}.ingredientId`}
                                       aria-expanded={
                                          openIngredientIndex === index
                                       }
                                       className={`flex items-center justify-between w-full h-10 px-3 py-2 text-sm border rounded-md bg-background shadow-md hover:bg-accent hover:text-accent-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer ${
                                          errors.ingredients?.[index]
                                             ?.ingredientId
                                             ? "border-red-500 focus:border-red-500"
                                             : "border-input"
                                       }`}>
                                       <span
                                          className="truncate text-left pr-2 flex-1"
                                          style={{ minWidth: 0 }}>
                                          {watchedIngredients[index]
                                             ?.ingredientId ? (
                                             selectedIngredients[
                                                watchedIngredients[index]
                                                   ?.ingredientId
                                             ]?.name ||
                                             ingredientsData?.pages
                                                .flatMap(
                                                   (
                                                      page: PaginatedIngredientsResponse
                                                   ) => page.data
                                                )
                                                .find(
                                                   (
                                                      ingredient: IngredientResponse
                                                   ) =>
                                                      ingredient.id ===
                                                      watchedIngredients[index]
                                                         ?.ingredientId
                                                )?.name ||
                                             t('selectIngredient')
                                          ) : (
                                             <span className="text-muted-foreground">
                                                {t('selectIngredient')}
                                             </span>
                                          )}
                                       </span>
                                       <ChevronsUpDownIcon className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                                    </button>
                                 </PopoverTrigger>
                                 <PopoverContent className="w-96 p-0">
                                    <div>
                                       <div className="p-2 border-b">
                                          <Input
                                             type="text"
                                             value={searchIngredient}
                                             onChange={(e) =>
                                                setSearchIngredient(
                                                   e.target.value
                                                )
                                             }
                                             placeholder={t('searchIngredient')}
                                          />
                                          {isFetching && (
                                             <span className="text-muted-foreground flex items-center gap-2 justify-center py-4">
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                {t('searching')}
                                             </span>
                                          )}
                                          {!filteredIngredients ||
                                             (filteredIngredients?.length ===
                                                0 && (
                                                <span className="text-muted-foreground flex items-center gap-2 justify-center py-4">
                                                   <Search className="h-4 w-4 mr-2" />
                                                   {t('noIngredientsFound')}
                                                </span>
                                             ))}
                                       </div>
                                       <div className="max-h-70 overflow-y-auto">
                                          {filteredIngredients?.map(
                                             (
                                                ingredient: IngredientResponse
                                             ) => (
                                                <div
                                                   key={ingredient.id}
                                                   className="p-2 hover:bg-muted cursor-pointer"
                                                   onClick={() => {
                                                      setValue(
                                                         `ingredients.${index}.ingredientId`,
                                                         ingredient.id ?? ""
                                                      );
                                                      setSelectedIngredients(
                                                         (prev) => ({
                                                            ...prev,
                                                            [ingredient.id!]: {
                                                               id: ingredient.id!,
                                                               name: ingredient.name,
                                                            },
                                                         })
                                                      );
                                                      setOpenIngredientIndex(
                                                         null
                                                      );
                                                   }}>
                                                   <div className="flex flex-col gap-1.5 min-w-0">
                                                      <span
                                                         className="font-medium truncate"
                                                         title={
                                                            ingredient.name
                                                         }>
                                                         {ingredient.name}
                                                      </span>
                                                      <div className="text-xs text-muted-foreground truncate">
                                                         {
                                                            ingredient.caloriesPer100g
                                                         }{" "}
                                                         cal •{" "}
                                                         {
                                                            ingredient.proteinPer100g
                                                         }
                                                         g protein •{" "}
                                                         {
                                                            ingredient.carbsPer100g
                                                         }
                                                         g carbs •{" "}
                                                         {ingredient.fatPer100g}
                                                         g fat
                                                         {ingredient.category && (
                                                            <span>
                                                               {" "}
                                                               •{" "}
                                                               {
                                                                  ingredient.category
                                                               }
                                                            </span>
                                                         )}
                                                      </div>
                                                   </div>
                                                </div>
                                             )
                                          )}
                                       </div>
                                       <div className="p-2 border-t flex gap-2">
                                          <IngredientCreateForm>
                                             <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="flex-1">
                                                <PlusIcon className="h-4 w-4 mr-2" />
                                                <span className="text-sm font-medium">
                                                   {t('createNewIngredient')}
                                                </span>
                                             </Button>
                                          </IngredientCreateForm>
                                          {hasNextPage && (
                                             <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => fetchNextPage()}
                                                disabled={isFetchingNextPage}
                                                className="flex-1">
                                                {isFetchingNextPage
                                                   ? isFetching
                                                      ? t('searching')
                                                      : t('loadingMore')
                                                   : isFetching
                                                   ? t('searching')
                                                   : t('loadMore')}
                                             </Button>
                                          )}
                                       </div>
                                    </div>
                                 </PopoverContent>
                              </Popover>
                              {errors.ingredients?.[index]?.ingredientId
                                 ?.message && (
                                 <p className="text-sm text-red-500 mt-1">
                                    {
                                       errors.ingredients?.[index]?.ingredientId
                                          ?.message
                                    }
                                 </p>
                              )}
                           </div>

                           <div className="space-y-2">
                              <Label
                                 htmlFor={`ingredients.${index}.quantityGrams`}
                                 className="text-sm font-medium text-foreground">
                                 {t('quantity')}
                              </Label>
                              <Input
                                 type="number"
                                 id={`ingredients.${index}.quantityGrams`}
                                 {...register(
                                    `ingredients.${index}.quantityGrams`
                                 )}
                                 placeholder={t('quantityPlaceholder')}
                                 min={0}
                                 max={1000}
                                 step={1}
                                 className={`w-24 h-10 ${
                                    errors.ingredients?.[index]?.quantityGrams
                                       ? "border-red-500 focus:border-red-500"
                                       : ""
                                 }`}
                              />
                              {errors.ingredients?.[index]?.quantityGrams
                                 ?.message && (
                                 <p className="text-sm text-red-500">
                                    {
                                       errors.ingredients?.[index]
                                          ?.quantityGrams?.message
                                    }
                                 </p>
                              )}
                           </div>

                           <div className="flex items-end">
                              <Button
                                 type="button"
                                 variant="outline"
                                 size="icon"
                                 onClick={() => remove(index)}
                                 className="h-10 w-10 text-destructive hover:bg-destructive hover:text-destructive-foreground">
                                 <Trash2 className="h-4 w-4" />
                              </Button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
               <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center justify-between">
                     <Label
                        htmlFor="description"
                        className="text-sm font-medium">
                        {t('description')}
                     </Label>
                     <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => onGenerate("description")}>
                        {isPendingDesc ? t('generating') : t('generate')}
                     </Button>
                  </div>
                  <Textarea
                     rows={3}
                     id="description"
                     {...register("description")}
                     placeholder={t('descriptionPlaceholder')}
                     className="w-full"
                  />
                  {errors.description && (
                     <p className="text-sm text-red-500">
                        {errors.description.message}
                     </p>
                  )}
               </div>
               <div className="space-y-3 relative">
                  <div className="flex items-center justify-between">
                     <Label
                        htmlFor="instructions"
                        className="text-sm font-medium">
                        {t('instructions')}
                     </Label>
                     <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => onGenerate("instructions")}>
                        {isPendingInstr ? t('generating') : t('generate')}
                     </Button>
                  </div>
                  <Textarea
                     rows={6}
                     id="instructions"
                     {...register("instructions")}
                     placeholder={t('instructionsPlaceholder')}
                     className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                     {t('instructionsTip')}
                  </p>
                  {errors.instructions && (
                     <p className="text-sm text-red-500">
                        {errors.instructions.message}
                     </p>
                  )}
               </div>
               {ingredientsData &&
                  watchedIngredients.length > 0 &&
                  calculateCurrentNutrition() && (
                     <div className="space-y-4">
                        <div className="border-b pb-2">
                           <h3 className="text-lg font-semibold">
                              {t('nutritionalInformation')}
                           </h3>
                        </div>
                        <div className="space-y-4">
                           <div>
                              <h4 className="text-sm font-medium mb-2">
                                 {t('totalRecipe')}
                              </h4>
                              <NutritionDisplay
                                 nutrition={calculateCurrentNutrition()!}
                                 servings={watchedServings}
                                 showPerServing={false}
                              />
                           </div>
                           <div>
                              <h4 className="text-sm font-medium mb-2">
                                 {t('perServing', { servings: watchedServings })}
                              </h4>
                              <NutritionDisplay
                                 nutrition={calculateCurrentNutrition()!}
                                 servings={watchedServings}
                                 showPerServing={true}
                              />
                           </div>
                        </div>
                     </div>
                  )}

               <div className="flex justify-end pt-4 border-t gap-2">
                  <Button
                     type="button"
                     variant="outline"
                     onClick={() => setIsOpen(false)}>
                     {t('cancel')}
                  </Button>
                  <Button
                     type="submit"
                     disabled={isSubmitting}
                     className="px-8">
                     {isSubmitting ? t('creating') : t('createRecipe')}
                  </Button>
               </div>
            </form>
         </DialogContent>
      </Dialog>
   );
}
