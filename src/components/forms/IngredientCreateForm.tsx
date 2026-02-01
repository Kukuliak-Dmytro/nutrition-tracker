import { useForm } from "react-hook-form";
import { CreateIngredient, CreateIngredientSchema } from "../../../utils/schemas/ingredient";
import { useCreateIngredient } from "@/app/hooks/useIngredients";
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
import { toast } from "sonner";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from 'next-intl';

export function IngredientCreateForm({ children }: { children: React.ReactNode }) {
    const t = useTranslations('ingredients');
    const tToast = useTranslations('toast');
    const tCommon = useTranslations('common');
    const [open, setOpen] = useState(false);
    const { mutate: createIngredient } = useCreateIngredient();
    const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(CreateIngredientSchema),
    defaultValues: {
      name: "",
      caloriesPer100g: 0 as number,
      proteinPer100g: 0 as number,    
      carbsPer100g: 0 as number,
      fatPer100g: 0 as number,
      category: "",
    },
  });

  const onSubmit = (data: CreateIngredient, e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    createIngredient(data, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["ingredients"] });
        toast.success(tToast('ingredientCreated', { name: data.name }));
        setOpen(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('addIngredient')}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {t('createNewDescription')}
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
            <Label htmlFor="name">{t('name')}</Label>
            <Input type="text" id="name" {...register("name")} placeholder={t('namePlaceholder')} />
            {errors.name && <p className="text-red-500">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="category">{t('category')}</Label>
            <Input id="category" {...register("category")} placeholder={t('categoryPlaceholder')} />
            {errors.category && <p className="text-red-500">{errors.category.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="caloriesPer100g">{t('caloriesPer100g')}</Label>
            <Input
              type="number"
              step="0.10"
              id="caloriesPer100g"
              {...register("caloriesPer100g")}
              placeholder={t('caloriesPlaceholder')}
            />
            {errors.caloriesPer100g && <p className="text-red-500">{errors.caloriesPer100g.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="proteinPer100g">{t('proteinPer100g')}</Label>
            <Input
              type="number"
              step="0.10"
              id="proteinPer100g"
              {...register("proteinPer100g")}
              placeholder={t('proteinPlaceholder')}
            />
            {errors.proteinPer100g && <p className="text-red-500">{errors.proteinPer100g.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="carbsPer100g">{t('carbsPer100g')}</Label>
            <Input
              type="number"
              step="0.10"
              id="carbsPer100g"
              {...register("carbsPer100g")}
              placeholder={t('carbsPlaceholder')}
            />
            {errors.carbsPer100g && <p className="text-red-500">{errors.carbsPer100g.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fatPer100g">{t('fatPer100g')}</Label>
            <Input
              type="number"
              step="0.10"
              id="fatPer100g"
              {...register("fatPer100g")}
              placeholder={t('fatPlaceholder')}
            />
            {errors.fatPer100g && <p className="text-red-500">{errors.fatPer100g.message}</p>}
          </div>
          <div className="flex justify-start gap-2 mt-4">
            <Button type="submit">{t('createIngredient')}</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{tCommon('cancel')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
