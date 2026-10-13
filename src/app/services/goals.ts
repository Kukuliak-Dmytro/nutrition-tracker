import { http, getErrorMessage } from "@/lib/http";
import { DailyGoal, DailyGoalResponse } from "../../../utils/schemas/goals";

export const getDailyGoal = async (): Promise<DailyGoalResponse> => {
  try {
    const response = await http.get("/goals");
    return response.data as DailyGoalResponse;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const updateDailyGoal = async (
  goal: DailyGoal
): Promise<DailyGoalResponse> => {
  try {
    const response = await http.put("/goals", goal);
    return response.data as DailyGoalResponse;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
