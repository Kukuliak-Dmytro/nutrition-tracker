import {
  useMutation,
  useQuery,
  useQueryClient,
  queryOptions,
} from "@tanstack/react-query";
import { DailyGoal } from "../../../utils/schemas/goals";
import { getDailyGoal, updateDailyGoal } from "@/app/services/goals";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export const goalsQueryOptions = () => {
  return queryOptions({
    queryKey: ["dailyGoals"],
    queryFn: getDailyGoal,
  });
};

export const useDailyGoals = () => {
  return useQuery(goalsQueryOptions());
};

export const useUpdateDailyGoals = () => {
  const queryClient = useQueryClient();
  const t = useTranslations("toast");
  return useMutation({
    mutationKey: ["updateDailyGoals"],
    mutationFn: (goal: DailyGoal) => updateDailyGoal(goal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyGoals"] });
      toast.success(t("goalsUpdated"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("goalsUpdateFailed"));
    },
  });
};
