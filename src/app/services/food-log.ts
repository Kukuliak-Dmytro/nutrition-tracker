import { http, getErrorMessage } from "@/lib/http";
import {
  CreateFoodLogEntry,
  FoodLogEntryResponse,
  UpdateFoodLogEntry,
} from "../../../utils/schemas/foodLog";

export interface FoodLogDayData {
  date: string;
  entries: FoodLogEntryResponse[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

export const getFoodLog = async (dateStr?: string): Promise<FoodLogDayData> => {
  try {
    const params = dateStr ? `?date=${dateStr}` : "";
    const response = await http.get(`/food-log${params}`);
    return response.data as FoodLogDayData;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const createFoodLogEntry = async (
  entry: CreateFoodLogEntry
): Promise<FoodLogEntryResponse> => {
  try {
    const response = await http.post("/food-log", entry);
    return response.data as FoodLogEntryResponse;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const updateFoodLogEntry = async (
  id: string,
  entry: UpdateFoodLogEntry
): Promise<FoodLogEntryResponse> => {
  try {
    const response = await http.patch(`/food-log/${id}`, entry);
    return response.data as FoodLogEntryResponse;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const deleteFoodLogEntry = async (id: string): Promise<void> => {
  try {
    await http.delete(`/food-log/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export interface DaySummary {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  entryCount: number;
  status: "DEFICIT" | "MAINTENANCE" | "SURPLUS";
  caloriesPct: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
  fiberPct: number;
  deficitVsTarget: number;
  deficitVsMaintenance: number;
}

export interface FoodLogSummaryResponse {
  days: DaySummary[];
  goals: {
    goalType: "WEIGHT_LOSS" | "MUSCLE_GAIN" | "MAINTENANCE";
    calories: number;
    maintenanceCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    maintenancePct: number;
  };
  stats: {
    totalLoggedDays: number;
    cumulativeMaintenanceDeficit: number;
    estimatedFatLossKg: number;
    averageCalories: number;
    deficitDays: number;
    maintenanceDays: number;
    surplusDays: number;
  };
}

export const getFoodLogSummary = async (
  startDate?: string,
  endDate?: string
): Promise<FoodLogSummaryResponse> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const response = await http.get(`/food-log/summary${qs}`);
    return response.data as FoodLogSummaryResponse;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

