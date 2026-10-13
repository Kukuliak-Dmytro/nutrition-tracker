import { Button } from "./button";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { cn } from "@/lib/utils";
import { ChevronDown, Search, X } from "lucide-react";
import { Input } from "./input";
import { Slider } from "./slider";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { useTranslations } from "next-intl";

interface NutritionFiltersProps {
  fatMin: number;
  fatMax: number;
  onChangeFat: (min: number, max: number) => void;
  carbsMin: number;
  carbsMax: number;
  onChangeCarbs: (min: number, max: number) => void;
  proteinMin: number;
  proteinMax: number;
  onChangeProtein: (min: number, max: number) => void;
  caloriesMin: number;
  caloriesMax: number;
  onChangeCalories: (min: number, max: number) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  limits?: {
    calories: { max: number };
    protein: { max: number };
    carbs: { max: number };
    fat: { max: number };
  };
}

export function NutritionFilters({
  fatMin,
  fatMax,
  onChangeFat,
  carbsMin,
  carbsMax,
  onChangeCarbs,
  proteinMin,
  proteinMax,
  onChangeProtein,
  caloriesMin,
  caloriesMax,
  onChangeCalories,
  setSearchTerm,
  inputValue,
  setInputValue,
  limits = {
    calories: { max: 900 },
    protein: { max: 100 },
    carbs: { max: 100 },
    fat: { max: 100 },
  },
}: NutritionFiltersProps) {
  const t = useTranslations("filters");
  const tMeals = useTranslations("meals");
  const [isCaloriesOpen, setIsCaloriesOpen] = useState(false);
  const [isProteinOpen, setIsProteinOpen] = useState(false);
  const [isCarbsOpen, setIsCarbsOpen] = useState(false);
  const [isFatOpen, setIsFatOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function clearFilters() {
    onChangeProtein(0, limits.protein.max);
    onChangeCarbs(0, limits.carbs.max);
    onChangeCalories(0, limits.calories.max);
    onChangeFat(0, limits.fat.max);
    setSearchTerm("");
    setInputValue("");
    router.replace(pathname);
  }

  const debouncedSearch = useDebouncedCallback((term: string) => {
    if (term.length < 2 && term.length > 0) return;
    if (!term.trim()) {
      setSearchTerm("");
      const params = new URLSearchParams(searchParams);
      params.delete("query");
      router.replace(`${pathname}?${params.toString()}`);
      return;
    }

    setSearchTerm(term);
    const params = new URLSearchParams(searchParams);
    params.set("query", term);
    router.replace(`${pathname}?${params.toString()}`);
  }, 300);



  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    debouncedSearch(e.target.value);
  };

  useEffect(() => {
    const query = searchParams.get("query") || "";
    setSearchTerm(query);
    setInputValue(query);
  }, [searchParams, setSearchTerm, setInputValue]);

  return (
    <div className="flex flex-col gap-4 bg-muted p-4 rounded-lg">
      <div className="flex flex-wrap gap-2 items-center">
        <Popover open={isProteinOpen} onOpenChange={setIsProteinOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 border-dashed transition-colors duration-150 hover:bg-muted",
                (proteinMin !== 0 || proteinMax !== limits.protein.max) &&
                  "bg-accent border-solid"
              )}
            >
              <span className="font-medium text-sm">{t("protein")}</span>
              {(proteinMin !== 0 || proteinMax !== limits.protein.max) && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {proteinMin}-{proteinMax}{tMeals("grams")}
                </span>
              )}
              <ChevronDown className="ml-2 h-3 w-3 opacity-70" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{t("proteinGrams")}</h4>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {t("min")}
                    </label>
                    <Input
                      type="number"
                      value={proteinMin}
                      min={0}
                      max={limits.protein.max}
                      className="h-8"
                      onChange={(e) =>
                        onChangeProtein(Number(e.target.value), proteinMax)
                      }
                    />
                  </div>
                  <span className="text-muted-foreground mt-5">-</span>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {t("max")}
                    </label>
                    <Input
                      type="number"
                      value={proteinMax}
                      min={0}
                      max={limits.protein.max}
                      className="h-8"
                      onChange={(e) =>
                        onChangeProtein(proteinMin, Number(e.target.value))
                      }
                    />
                  </div>
                </div>
                <div className="px-2 pt-2">
                  <Slider
                    min={0}
                    max={limits.protein.max}
                    step={1}
                    value={[proteinMin, proteinMax]}
                    onValueChange={(values) =>
                      onChangeProtein(values[0], values[1])
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>0{tMeals("grams")}</span>
                    <span>{limits.protein.max}{tMeals("grams")}</span>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={isCaloriesOpen} onOpenChange={setIsCaloriesOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 border-dashed transition-colors duration-150 hover:bg-muted",
                (caloriesMin !== 0 || caloriesMax !== limits.calories.max) &&
                  "bg-accent border-solid"
              )}
            >
              <span className="font-medium text-sm">{t("calories")}</span>
              {(caloriesMin !== 0 || caloriesMax !== limits.calories.max) && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {caloriesMin}-{caloriesMax}{tMeals("kcal")}
                </span>
              )}
              <ChevronDown className="ml-2 h-3 w-3 opacity-70" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{t("caloriesKcal")}</h4>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">{t("min")}</label>
                    <Input
                      type="number"
                      value={caloriesMin}
                      min={0}
                      max={limits.calories.max}
                      className="h-8"
                      onChange={(e) =>
                        onChangeCalories(Number(e.target.value), caloriesMax)
                      }
                    />
                  </div>
                  <span className="text-muted-foreground mt-5">-</span>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">{t("max")}</label>
                    <Input
                      type="number"
                      value={caloriesMax}
                      min={0}
                      max={limits.calories.max}
                      className="h-8"
                      onChange={(e) =>
                        onChangeCalories(caloriesMin, Number(e.target.value))
                      }
                    />
                  </div>
                </div>
                <div className="px-2 pt-2">
                  <Slider
                    min={0}
                    max={limits.calories.max}
                    step={1}
                    value={[caloriesMin, caloriesMax]}
                    onValueChange={(values) => {
                      onChangeCalories(values[0], values[1]);
                    }}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>0{tMeals("kcal")}</span>
                    <span>{limits.calories.max}{tMeals("kcal")}</span>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={isCarbsOpen} onOpenChange={setIsCarbsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 border-dashed transition-colors duration-150 hover:bg-muted",
                (carbsMin !== 0 || carbsMax !== limits.carbs.max) && "bg-accent border-solid"
              )}
            >
              <span className="font-medium text-sm">{t("carbs")}</span>
              {(carbsMin !== 0 || carbsMax !== limits.carbs.max) && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {carbsMin}-{carbsMax}{tMeals("grams")}
                </span>
              )}
              <ChevronDown className="ml-2 h-3 w-3 opacity-70" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{t("carbsGrams")}</h4>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">{t("min")}</label>
                    <Input
                      type="number"
                      value={carbsMin}
                      min={0}
                      max={limits.carbs.max}
                      className="h-8"
                      onChange={(e) =>
                        onChangeCarbs(Number(e.target.value), carbsMax)
                      }
                    />
                  </div>
                  <span className="text-muted-foreground mt-5">-</span>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {t("max")}
                    </label>
                    <Input
                      type="number"
                      value={carbsMax}
                      min={0}
                      max={limits.carbs.max}
                      onChange={(e) =>
                        onChangeCarbs(carbsMin, Number(e.target.value))
                      }
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="px-2 pt-2">
                  <Slider
                    min={0}
                    max={limits.carbs.max}
                    step={1}
                    value={[carbsMin, carbsMax]}
                    onValueChange={(values) =>
                      onChangeCarbs(values[0], values[1])
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>0{tMeals("grams")}</span>
                    <span>{limits.carbs.max}{tMeals("grams")}</span>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={isFatOpen} onOpenChange={setIsFatOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 border-dashed transition-colors duration-150 hover:bg-muted",
                (fatMin !== 0 || fatMax !== limits.fat.max) && "bg-accent border-solid"
              )}
            >
              <span className="font-medium text-sm">{t("fat")}</span>
              {(fatMin !== 0 || fatMax !== limits.fat.max) && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {fatMin}-{fatMax}{tMeals("grams")}
                </span>
              )}
              <ChevronDown className="ml-2 h-3 w-3 opacity-70" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{t("fatGrams")}</h4>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {t("min")}
                    </label>
                    <Input
                      type="number"
                      value={fatMin}
                      min={0}
                      max={limits.fat.max}
                      className="h-8"
                      onChange={(e) =>
                        onChangeFat(Number(e.target.value), fatMax)
                      }
                    />
                  </div>
                  <span className="text-muted-foreground mt-5">-</span>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {t("max")}
                    </label>
                    <Input
                      type="number"
                      value={fatMax}
                      min={0}
                      max={limits.fat.max}
                      className="h-8"
                      onChange={(e) =>
                        onChangeFat(fatMin, Number(e.target.value))
                      }
                    />
                  </div>
                </div>
                <div className="px-2 pt-2">
                  <Slider
                    min={0}
                    max={limits.fat.max}
                    step={1}
                    value={[fatMin, fatMax]}
                    onValueChange={(values) =>
                      onChangeFat(values[0], values[1])
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>0{tMeals("grams")}</span>
                    <span>{limits.fat.max}{tMeals("grams")}</span>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-8 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors duration-150"
          onClick={clearFilters}
        >
          <X className="h-3 w-3 mr-1" />
          {t("clearFilters")}
        </Button>
      </div>

      <div className="w-full relative shadow-sm rounded-lg">
        <Search
          size={22}
          className="text-[#8c6e5f] absolute left-3 top-1/2 -translate-y-1/2"
        />
        <Input
          className="bg-input-background px-4 py-2 pl-10 h-12 placeholder:text-[#8c6e5f]"
          placeholder={t("searchByName")}
          value={inputValue}
          onChange={handleSearchChange}
        />
      </div>
    </div>
  );
}
