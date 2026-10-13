"use client";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { IngredientCreateForm } from "../forms/IngredientCreateForm";
import { Button } from "../ui/button";
import IngredientsContentClient from "./IngredientsContentClient";

import { useTranslations } from "next-intl";

function IngredientsLoading() {
   return (
      <div className="w-full flex items-center justify-center py-12">
         <Loader2 className="h-8 w-8 animate-spin" />
      </div>
   );
}

export default function IngredientsPageClient() {
   const t = useTranslations("ingredients");

   return (
      <div className="w-full mt-10 flex flex-col gap-8">
         <div className="flex flex-col md:flex-row w-full justify-between items-center gap-4">
            <div className="flex flex-col gap-2">
               <h1 className="text-3xl font-bold">{t("pageTitle")}</h1>
               <p className="text-sm text-muted-foreground">{t("pageDescription")}</p>
            </div>
            <IngredientCreateForm>
               <Button>{t("addIngredient")}</Button>
            </IngredientCreateForm>
         </div>
         <Suspense fallback={<IngredientsLoading />}>
            <IngredientsContentClient />
         </Suspense>
      </div>
   );
}
