import { useForm } from "react-hook-form";
import {
  UpdateIngredient,
  UpdateIngredientSchema,
  IngredientResponse,
} from "../../../utils/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateIngredient } from "@/app/hooks/useIngredients";
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
import { useEffect } from "react";
import { useTranslations } from "next-intl";

interface IngredientUpdateFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient: IngredientResponse;
}

export function IngredientUpdateForm({
  isOpen,
  onOpenChange,
  ingredient
}: IngredientUpdateFormProps) {
  const t = useTranslations("ingredients");
  const tToast = useTranslations("toast");
  const tCommon = useTranslations("common");
  const { mutate: updateIngredient } = useUpdateIngredient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(UpdateIngredientSchema),
    defaultValues: ingredient,
  });

  useEffect(() => {
    reset(ingredient);
  }, [ingredient, reset]);

  const onSubmit = (data: UpdateIngredient, e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    updateIngredient(
      { id: ingredient.id!, ingredient: data },
      {
        onSuccess: () => {
          toast.success(tToast("ingredientUpdated", { name: data.name || ingredient.name || "" }));
          onOpenChange(false);
        },
        onError: () => {
          toast.error(tToast("ingredientUpdateFailed", { name: data.name || ingredient.name || "" }));
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t("editIngredient")}</DialogTitle>
            </DialogHeader>
            <DialogDescription>
                {t("editIngredientDescription")}
            </DialogDescription>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit(onSubmit)(e);
              }} 
              className="flex flex-col gap-4"
            >
                <div className="flex flex-col gap-2">
                    <Label htmlFor="name">{t("name")}</Label>
                    <Input type="text" id="name" {...register("name")} />
                    {errors.name && <p className="text-red-500">{errors.name.message}</p>}
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="category">{t("category")}</Label>
                    <Input id="category" {...register("category")} />
                    {errors.category && <p className="text-red-500">{errors.category.message}</p>}
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="caloriesPer100g">{t("caloriesPer100g")}</Label>
                    <Input type="number" step="0.10" id="caloriesPer100g" {...register("caloriesPer100g")} />
                    {errors.caloriesPer100g && <p className="text-red-500">{errors.caloriesPer100g.message}</p>}
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="proteinPer100g">{t("proteinPer100g")}</Label>
                    <Input type="number" step="0.10" id="proteinPer100g" {...register("proteinPer100g")} />
                    {errors.proteinPer100g && <p className="text-red-500">{errors.proteinPer100g.message}</p>}
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="carbsPer100g">{t("carbsPer100g")}</Label>
                    <Input type="number" step="0.10" id="carbsPer100g" {...register("carbsPer100g")} />
                    {errors.carbsPer100g && <p className="text-red-500">{errors.carbsPer100g.message}</p>}
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="fatPer100g">{t("fatPer100g")}</Label>
                    <Input type="number" step="0.10" id="fatPer100g" {...register("fatPer100g")} />
                    {errors.fatPer100g && <p className="text-red-500">{errors.fatPer100g.message}</p>}
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="fiberPer100g">{t("fiberPer100g")}</Label>
                    <Input type="number" step="0.10" id="fiberPer100g" {...register("fiberPer100g")} />
                    {errors.fiberPer100g && <p className="text-red-500">{errors.fiberPer100g.message}</p>}
                </div>
                <div className="flex justify-end gap-2 relative">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{tCommon("cancel")}</Button>
                <Button type="submit">{t("saveIngredient")}</Button>
                </div>
            </form>
        </DialogContent>
    </Dialog>
  )
}
