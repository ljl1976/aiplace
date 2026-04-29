import {
  getAllPortfolios,
  getLatestRebalanceByPortfolioId,
  getLatestRebalances,
  getLatestSnapshot,
  getLatestSnapshotHoldings,
} from "@/lib/db";
import { XueqiuOverview } from "./_components/xueqiu-overview";
import { XueqiuHoldingsChart } from "./_components/xueqiu-holdings-chart";
import { XueqiuHoldingsList } from "./_components/xueqiu-holdings-list";
import { XueqiuRebalancesTable } from "./_components/xueqiu-rebalances-table";

interface PageProps {
  searchParams: Promise<{ portfolio?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const portfolios = getAllPortfolios().filter((p) => p.id); // Filter out empty IDs
  const { portfolio: portfolioId } = await searchParams;
  const selectedPortfolio = portfolios.find((p) => p.id === portfolioId) ?? portfolios[0];

  if (!selectedPortfolio) {
    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="text-muted-foreground">暂无组合数据</div>
      </div>
    );
  }

  const latestSnapshot = getLatestSnapshot(selectedPortfolio.id);
  const holdings = latestSnapshot ? getLatestSnapshotHoldings(selectedPortfolio.id) : [];
  const rebalances = getLatestRebalances(selectedPortfolio.id, 10);
  const latestRebalance = getLatestRebalanceByPortfolioId(selectedPortfolio.id);

  // Server-side metrics data to avoid client-side fetch delay
  const metrics = latestSnapshot
    ? {
        daily_return: latestSnapshot.daily_return,
        monthly_return: latestSnapshot.monthly_return,
        total_return: latestSnapshot.total_return,
        rank_percent: latestSnapshot.rank_percent,
        cash_ratio: latestSnapshot.cash_ratio,
        score: latestSnapshot.score,
        observations: latestSnapshot.observations,
      }
    : null;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <XueqiuOverview
        portfolios={portfolios}
        selectedPortfolioId={selectedPortfolio.id}
        latestRebalance={latestRebalance}
        metrics={metrics}
      />

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <XueqiuHoldingsChart holdings={holdings} />
          <XueqiuHoldingsList holdings={holdings} />
        </div>
        <div className="flex flex-col gap-4">
          <XueqiuRebalancesTable rebalances={rebalances} />
        </div>
      </div>
    </div>
  );
}
