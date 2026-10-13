import DashboardClient from "@/components/dashboard/DashboardClient";
import { getQueryClient } from "@/lib/queryClient";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { foodLogQueryOptions, foodLogSummaryQueryOptions } from "@/app/hooks/useFoodLog";
import { goalsQueryOptions } from "@/app/hooks/useGoals";

export default async function DashboardPage() {
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(foodLogQueryOptions()),
    queryClient.prefetchQuery(foodLogSummaryQueryOptions()),
    queryClient.prefetchQuery(goalsQueryOptions()),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient />
    </HydrationBoundary>
  );
}
