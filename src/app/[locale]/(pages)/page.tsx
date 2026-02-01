import DashboardClient from "@/components/dashboard/DashboardClient";
import { getQueryClient } from "@/lib/queryClient";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { dashboardQueryOptions } from "@/app/hooks/useDashboard";

export default async function DashboardPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(dashboardQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient />
    </HydrationBoundary>
  );
}

