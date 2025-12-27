import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolioSummary } from "@/hooks/usePortfolioData";
import { TrendingUp, TrendingDown, Wallet, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrencyBRL, formatPercentBR } from "@/lib/formatters";

export default function Dashboard() {
  const { totalValue, totalReturn, totalReturnPercent, dayGain, dayGainPercent, cashBalance, isLoading } = usePortfolioSummary();

  const summaryCards = [
    {
      title: "Patrimônio Total",
      value: formatCurrencyBRL(totalValue + cashBalance),
      icon: Wallet,
      trend: null,
    },
    {
      title: "Variação do Dia",
      value: formatCurrencyBRL(dayGain),
      icon: dayGain >= 0 ? TrendingUp : TrendingDown,
      trend: dayGainPercent,
      isPositive: dayGain >= 0,
    },
    {
      title: "Retorno Total",
      value: formatCurrencyBRL(totalReturn),
      icon: totalReturn >= 0 ? TrendingUp : TrendingDown,
      trend: totalReturnPercent,
      isPositive: totalReturn >= 0,
    },
    {
      title: "Saldo em Caixa",
      value: formatCurrencyBRL(cashBalance),
      icon: DollarSign,
      trend: null,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Início</h1>
          <p className="text-muted-foreground">Visão geral do seu portfólio</p>
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
                    {formatPercentBR(card.trend)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Comece Agora</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Clique em "Nova Transação" na barra lateral para começar a rastrear seus investimentos. O desempenho do seu portfólio, posições e análises aparecerão aqui conforme você adiciona transações.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
