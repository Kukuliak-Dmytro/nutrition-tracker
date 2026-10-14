import DashboardClient from "@/components/dashboard/DashboardClient";
import { getQueryClient } from "@/lib/queryClient";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { foodLogQueryOptions, foodLogSummaryQueryOptions } from "@/app/hooks/useFoodLog";
import { goalsQueryOptions } from "@/app/hooks/useGoals";
import { getSessionUserId } from "@/lib/auth";

export default async function DashboardPage() {
  const queryClient = getQueryClient();
  const userId = await getSessionUserId();

  if (userId) {
    await Promise.allSettled([
      queryClient.prefetchQuery(foodLogQueryOptions()),
      queryClient.prefetchQuery(foodLogSummaryQueryOptions()),
      queryClient.prefetchQuery(goalsQueryOptions()),
    ]);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient />
    </HydrationBoundary>
  );
}
