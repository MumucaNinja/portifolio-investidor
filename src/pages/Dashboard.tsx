import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolioSummary } from "@/hooks/usePortfolioData";
import { TrendingUp, TrendingDown, Wallet, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { totalValue, totalReturn, totalReturnPercent, dayGain, dayGainPercent, cashBalance, isLoading } = usePortfolioSummary();

  const formatCurrency = (value: number) =>
    value.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const summaryCards = [
    {
      title: "Total Net Worth",
      value: formatCurrency(totalValue + cashBalance),
      icon: Wallet,
      trend: null,
    },
    {
      title: "Day's Gain/Loss",
      value: formatCurrency(dayGain),
      icon: dayGain >= 0 ? TrendingUp : TrendingDown,
      trend: dayGainPercent,
      isPositive: dayGain >= 0,
    },
    {
      title: "Total Return",
      value: formatCurrency(totalReturn),
      icon: totalReturn >= 0 ? TrendingUp : TrendingDown,
      trend: totalReturnPercent,
      isPositive: totalReturn >= 0,
    },
    {
      title: "Cash Balance",
      value: formatCurrency(cashBalance),
      icon: DollarSign,
      trend: null,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Your portfolio overview</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <Card key={card.title} className="glass-card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <card.icon className={cn("h-4 w-4", card.isPositive === false ? "text-loss" : card.isPositive ? "text-gain" : "text-muted-foreground")} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : card.value}</div>
                {card.trend !== null && (
                  <p className={cn("text-xs mt-1", card.isPositive ? "text-gain" : "text-loss")}>
                    {card.isPositive ? "+" : ""}{card.trend.toFixed(2)}%
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Click "Add Transaction" in the sidebar to start tracking your investments. Your portfolio performance, holdings, and analytics will appear here as you add transactions.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
