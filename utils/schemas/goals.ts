import { z } from "zod";

export const GoalTypeEnum = z.enum(["WEIGHT_LOSS", "MUSCLE_GAIN", "MAINTENANCE"]);
export type GoalType = z.infer<typeof GoalTypeEnum>;

export const DailyGoalSchema = z.object({
  goalType: GoalTypeEnum,
  calories: z.number().int().min(500, "Мінімум 500 ккал").max(10000),
  maintenanceCalories: z.number().int().min(500, "Мінімум 500 ккал").max(10000),
  protein: z.number().min(0, "Мінімум 0г").max(1000),
  carbs: z.number().min(0, "Мінімум 0г").max(1000),
  fat: z.number().min(0, "Мінімум 0г").max(1000),
  fiber: z.number().min(0, "Мінімум 0г").max(200),
});

export const DailyGoalResponseSchema = DailyGoalSchema.extend({
  id: z.string(),
  updatedAt: z.string().transform((s) => new Date(s).toISOString()),
});

export type DailyGoal = z.infer<typeof DailyGoalSchema>;
export type DailyGoalResponse = z.infer<typeof DailyGoalResponseSchema>;
