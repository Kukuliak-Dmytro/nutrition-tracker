import {
  useMutation,
  useQuery,
  useQueryClient,
  queryOptions,
} from "@tanstack/react-query";
import {
  CreateFoodLogEntry,
  UpdateFoodLogEntry,
} from "../../../utils/schemas/foodLog";
import {
  getFoodLog,
  getFoodLogSummary,
  createFoodLogEntry,
  updateFoodLogEntry,
  deleteFoodLogEntry,
} from "@/app/services/food-log";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export const foodLogQueryOptions = (dateStr?: string) => {
  return queryOptions({
    queryKey: ["foodLog", dateStr || "today"],
    queryFn: () => getFoodLog(dateStr),
  });
};

export const useFoodLog = (dateStr?: string) => {
  return useQuery(foodLogQueryOptions(dateStr));
};

export const foodLogSummaryQueryOptions = (startDate?: string, endDate?: string) => {
  return queryOptions({
    queryKey: ["foodLogSummary", startDate || "all", endDate || "all"],
    queryFn: () => getFoodLogSummary(startDate, endDate),
  });
};

export const useFoodLogSummary = (startDate?: string, endDate?: string) => {
  return useQuery(foodLogSummaryQueryOptions(startDate, endDate));
};

export const useCreateFoodLogEntry = () => {
  const queryClient = useQueryClient();
  const t = useTranslations("toast");
  return useMutation({
    mutationKey: ["createFoodLogEntry"],
    mutationFn: (entry: CreateFoodLogEntry) => createFoodLogEntry(entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foodLog"] });
      queryClient.invalidateQueries({ queryKey: ["foodLogSummary"] });
      toast.success(t("foodLogAdded"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("foodLogAddFailed"));
    },
  });
};

export const useUpdateFoodLogEntry = () => {
  const queryClient = useQueryClient();
  const t = useTranslations("toast");
  return useMutation({
    mutationKey: ["updateFoodLogEntry"],
    mutationFn: ({ id, entry }: { id: string; entry: UpdateFoodLogEntry }) =>
      updateFoodLogEntry(id, entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foodLog"] });
      queryClient.invalidateQueries({ queryKey: ["foodLogSummary"] });
      toast.success(t("foodLogUpdated"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("foodLogUpdateFailed"));
    },
  });
};

export const useDeleteFoodLogEntry = () => {
  const queryClient = useQueryClient();
  const t = useTranslations("toast");
  return useMutation({
    mutationKey: ["deleteFoodLogEntry"],
    mutationFn: (id: string) => deleteFoodLogEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foodLog"] });
      queryClient.invalidateQueries({ queryKey: ["foodLogSummary"] });
      toast.success(t("foodLogDeleted"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("foodLogDeleteFailed"));
    },
  });
};
