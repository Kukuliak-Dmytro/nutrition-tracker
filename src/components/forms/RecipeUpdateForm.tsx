import { RecipeResponse, UpdateRecipe, UpdateRecipeSchema } from "../../../utils/schemas/recipe";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateRecipe } from "@/app/hooks/useRecipes";
import { useIngredients } from "@/app/hooks/useIngredients";
import { toast } from "sonner";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, Trash2, ChevronsUpDownIcon, Search, Loader2 } from "lucide-react";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@/components/ui/popover";
import { useEffect, useState } from "react";
import NutritionDisplay from "@/components/recipes/NutritionDisplay";
import {
   calculateRecipeNutrition,
   calculateCookedNutritionPer100g,
   RecipeIngredient,
} from "../../../utils/calculations/nutrition";
import { IngredientResponse } from "../../../utils/schemas";
import { useTranslations } from "next-intl";

interface RecipeUpdateFormProps {
   children?: React.ReactNode;
   isOpen: boolean;
   onOpenChange: (open: boolean) => void;
   recipe: RecipeResponse;
   onSuccessDetailsCard?: () => void;
}

export default function RecipeUpdateForm({
   isOpen,
   onOpenChange,
   recipe,
   onSuccessDetailsCard,
}: RecipeUpdateFormProps) {
   const t = useTranslations("recipes");
   const tToast = useTranslations("toast");
   const tMeals = useTranslations("meals");
   const tCommon = useTranslations("common");
   const [openIngredientIndex, setOpenIngredientIndex] = useState<number | null>(null);
   const [searchIngredient, setSearchIngredient] = useState("");
   const [selectedIngredients, setSelectedIngredients] = useState<
      Record<string, { id: string; name: string }>
   >({});

   const { mutate: updateRecipe } = useUpdateRecipe();
   const { data: ingredientsData, isFetching } = useIngredients({
      search: searchIngredient,
      limit: 50,
   });
   const filteredIngredients = ingredientsData?.pages.flatMap((page) => page.data);

   const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
      reset,
      control,
      watch,
   } = useForm({
      resolver: zodResolver(UpdateRecipeSchema),
      defaultValues: {
         name: recipe.name,
         description: recipe.description || "",
         cookedWeightGrams: recipe.cookedWeightGrams ? Number(recipe.cookedWeightGrams) : undefined,
         status: recipe.status || "RECENT",
         ingredients: recipe.ingredients?.map((item) => ({
            ingredientId: item.ingredientId,
            quantityGrams: Number(item.quantityGrams),
         })) || [],
      },
   });

   useEffect(() => {
      reset({
         name: recipe.name,
         description: recipe.description || "",
         cookedWeightGrams: recipe.cookedWeightGrams ? Number(recipe.cookedWeightGrams) : undefined,
         status: recipe.status || "RECENT",
         ingredients: recipe.ingredients?.map((item) => ({
            ingredientId: item.ingredientId,
            quantityGrams: Number(item.quantityGrams),
         })) || [],
      });
   }, [recipe, reset]);

   const { fields, append, remove } = useFieldArray({
      control,
      name: "ingredients",
   });

   const watchedIngredients = watch("ingredients");
   const watchedCookedWeight = watch("cookedWeightGrams");

   const allIngredients =
      ingredientsData?.pages.flatMap((page) => page.data) || [];

   const ingredientsWithNutrition = (watchedIngredients || [])
      .filter((ing) => ing.ingredientId && ing.quantityGrams)
      .map((ingredient) => {
         const fromOriginal = recipe.ingredients?.find(
            (i) => i.ingredientId === ingredient.ingredientId
         )?.ingredient;

         const fromList = allIngredients.find(
            (i: IngredientResponse) => i.id === ingredient.ingredientId
         );

         const ingredientData = fromOriginal || fromList;
         if (!ingredientData) return null;

         return {
            ingredientId: ingredient.ingredientId,
            quantityGrams: Number(ingredient.quantityGrams),
            nutritionalData: {
               calories: Number(ingredientData.caloriesPer100g),
               protein: Number(ingredientData.proteinPer100g),
               carbs: Number(ingredientData.carbsPer100g),
               fat: Number(ingredientData.fatPer100g),
               fiber: Number(ingredientData.fiberPer100g || 0),
            },
         };
      })
      .filter((i): i is RecipeIngredient => i !== null);

   const totalRawWeight = ingredientsWithNutrition.reduce(
      (sum, i) => sum + i.quantityGrams,
      0
   );

   const totalRawNutrition = ingredientsWithNutrition.length > 0
      ? calculateRecipeNutrition(ingredientsWithNutrition)
      : null;

   const finalCookedWeight = Number(watchedCookedWeight) > 0 ? Number(watchedCookedWeight) : totalRawWeight;

   const cookedNutritionPer100g = totalRawNutrition && finalCookedWeight > 0
      ? calculateCookedNutritionPer100g(totalRawNutrition, finalCookedWeight)
      : null;

   const onSubmit = (data: UpdateRecipe) => {
      updateRecipe(
         { id: recipe.id, recipe: data },
         {
            onSuccess: () => {
               toast.success(tToast("recipeUpdated", { name: data.name || recipe.name || "" }));
               onOpenChange(false);
               onSuccessDetailsCard?.();
            },
            onError: () => {
               toast.error(tToast("recipeUpdateFailed", { name: data.name || recipe.name || "" }));
            },
         }
      );
   };

   return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
         <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
               <DialogTitle>{t("editRecipe")}</DialogTitle>
               <DialogDescription>
                  {t("editRecipeDescription")}
               </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label htmlFor="name" className="text-sm font-medium">
                        {t("recipeName")}
                     </Label>
                     <Input
                        type="text"
                        id="name"
                        {...register("name")}
                        className="w-full"
                     />
                     {errors.name && (
                        <p className="text-sm text-red-500">{errors.name.message}</p>
                     )}
                  </div>

                  <div className="space-y-2">
                     <Label
                        htmlFor="cookedWeightGrams"
                        className="text-sm font-medium">
                        {t("cookedWeightGrams")}
                     </Label>
                     <Input
                        type="number"
                        id="cookedWeightGrams"
                        {...register("cookedWeightGrams")}
                        placeholder={t("cookedWeightPlaceholder")}
                        className="w-full font-semibold text-primary"
                     />
                     <p className="text-xs text-muted-foreground">
                        {t("cookedWeightCalcHint")}
                     </p>
                  </div>
               </div>

               <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                     {t("description")}
                  </Label>
                  <Textarea
                     rows={2}
                     id="description"
                     {...register("description")}
                     className="w-full"
                  />
               </div>

               {/* Ingredients List */}
               <div className="space-y-4">
                  <div className="border-b pb-2 flex items-center justify-between">
                     <div>
                        <h3 className="text-lg font-semibold">{t("ingredients")}</h3>
                        <p className="text-xs text-muted-foreground">
                           {t("rawWeightSummary", { raw: totalRawWeight })}
                           {Boolean(watchedCookedWeight) && (
                              <> &rarr; {t("cookedWeight")}: <span className="font-semibold text-primary">{String(watchedCookedWeight)} {tMeals("grams")}</span></>
                           )}
                        </p>
                     </div>
                     <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ ingredientId: "", quantityGrams: 100 })}
                        className="flex items-center gap-2">
                        <PlusIcon className="h-4 w-4" />
                        {t("addIngredient")}
                     </Button>
                  </div>

                  <div className="space-y-3">
                     {fields.map((field, index) => {
                        const originalIng = recipe.ingredients?.find(
                           (i) => i.ingredientId === field.ingredientId
                        )?.ingredient;
                        const ingName =
                           selectedIngredients[field.ingredientId]?.name ||
                           originalIng?.name ||
                           allIngredients.find((i) => i.id === field.ingredientId)?.name ||
                           t("selectIngredient");

                        return (
                           <div
                              key={field.id}
                              className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 p-3 border rounded-lg bg-card shadow-sm">
                              <div className="space-y-1">
                                 <Label className="text-xs font-medium text-muted-foreground">
                                    {t("ingredientNumber", { number: index + 1 })}
                                 </Label>
                                 <Popover
                                    open={openIngredientIndex === index}
                                    onOpenChange={(isOpenState) => {
                                       setOpenIngredientIndex(isOpenState ? index : null);
                                       if (isOpenState) setSearchIngredient("");
                                    }}>
                                    <PopoverTrigger asChild>
                                       <Button
                                          variant="outline"
                                          role="combobox"
                                          className="w-full justify-between h-10 font-normal">
                                          <span className="truncate">{ingName}</span>
                                          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                       </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[320px] p-0" align="start">
                                       <div className="flex flex-col">
                                          <div className="flex items-center border-b px-3">
                                             <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                             <input
                                                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                                                placeholder={t("searchIngredientPlaceholder")}
                                                value={searchIngredient}
                                                onChange={(e) => setSearchIngredient(e.target.value)}
                                             />
                                          </div>
                                          <div className="max-h-[220px] overflow-y-auto p-1">
                                             {filteredIngredients && filteredIngredients.length > 0 ? (
                                                filteredIngredients.map((ing) => (
                                                   <div
                                                      key={ing.id}
                                                      className="flex items-center justify-between px-3 py-2 text-sm rounded cursor-pointer hover:bg-accent"
                                                      onClick={() => {
                                                         if (ing.id) {
                                                            setSelectedIngredients((prev) => ({
                                                               ...prev,
                                                               [ing.id!]: { id: ing.id!, name: ing.name },
                                                            }));
                                                            control.register(`ingredients.${index}.ingredientId`).onChange({
                                                               target: { value: ing.id, name: `ingredients.${index}.ingredientId` },
                                                            });
                                                         }
                                                         setOpenIngredientIndex(null);
                                                      }}>
                                                      <span className="font-medium truncate">{ing.name}</span>
                                                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                                         {ing.caloriesPer100g} {tMeals("kcal")} | {tMeals("fiberAbbr")}: {ing.fiberPer100g || 0}{tMeals("grams")}
                                                      </span>
                                                   </div>
                                                ))
                                             ) : (
                                                <div className="py-4 text-center text-sm text-muted-foreground">
                                                   {isFetching ? t("searching") : t("nothingFound")}
                                                </div>
                                             )}
                                          </div>
                                       </div>
                                    </PopoverContent>
                                 </Popover>
                              </div>

                              <div className="space-y-1">
                                 <Label className="text-xs font-medium text-muted-foreground">
                                    {t("weightGrams")}
                                 </Label>
                                 <Input
                                    type="number"
                                    {...register(`ingredients.${index}.quantityGrams`)}
                                    placeholder="100"
                                    min={1}
                                    className="w-24 h-10"
                                 />
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
                        );
                     })}
                  </div>
               </div>

               {/* Nutrition Preview */}
               {cookedNutritionPer100g && (
                  <div className="space-y-3 border-t pt-4">
                     <h4 className="text-sm font-semibold text-primary mb-1">
                        {t("nutritionPer100gCooked")}
                     </h4>
                     <NutritionDisplay
                        nutrition={cookedNutritionPer100g}
                        labelPer100g={true}
                     />
                  </div>
               )}

               <div className="flex justify-end pt-4 border-t gap-2">
                  <Button
                     type="button"
                     variant="outline"
                     onClick={() => onOpenChange(false)}>
                     {tCommon("cancel")}
                  </Button>
                  <Button
                     type="submit"
                     disabled={isSubmitting}
                     className="px-8 font-semibold">
                     {isSubmitting ? (
                        <>
                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                           {t("saving")}
                        </>
                     ) : (
                        t("saveChanges")
                     )}
                  </Button>
               </div>
            </form>
         </DialogContent>
      </Dialog>
   );
}
