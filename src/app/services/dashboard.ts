import { http, getErrorMessage } from "@/lib/http";
import { z } from "zod";

export const DashboardResponseSchema = z.object({
  totalRecipes: z.number().optional(),
  recentRecipes: z.array(z.any()).optional(),
}).passthrough();

export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;

export const getDashboardData = async (): Promise<DashboardResponse> => {
  try {
    const response = await http.get("/dashboard");
    return response.data as DashboardResponse;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
