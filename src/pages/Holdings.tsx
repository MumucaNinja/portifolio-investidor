import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useHoldings } from "@/hooks/usePortfolioData";
import { cn } from "@/lib/utils";
import { formatCurrencyBRL, formatNumberBR, formatPercentBR } from "@/lib/formatters";

export default function Holdings() {
  const { holdings, isLoading } = useHoldings();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Carteira</h1>
          <p className="text-muted-foreground">Seus ativos em custódia</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Todas as Posições</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : holdings.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma posição ainda. Adicione transações para ver sua carteira.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">PM</TableHead>
                    <TableHead className="text-right">Atual</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">L/P</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdings.map((h) => (
                    <TableRow key={h.ticker} className="hover:bg-secondary/50">
                      <TableCell className="font-medium">{h.ticker}</TableCell>
                      <TableCell>{h.asset_name}</TableCell>
                      <TableCell>
                        <Badge style={{ backgroundColor: h.asset_class_color }} className="text-white">
                          {h.asset_class}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatNumberBR(h.quantity, 4)}</TableCell>
                      <TableCell className="text-right">{formatCurrencyBRL(h.avg_price)}</TableCell>
                      <TableCell className="text-right">{formatCurrencyBRL(h.current_price)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrencyBRL(h.current_value)}</TableCell>
                      <TableCell className={cn("text-right font-medium", h.profit_loss >= 0 ? "text-gain" : "text-loss")}>
                        {formatCurrencyBRL(h.profit_loss)} ({formatPercentBR(h.profit_loss_percent)})
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
