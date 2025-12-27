import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useHoldings } from "@/hooks/usePortfolioData";
import { cn } from "@/lib/utils";

export default function Holdings() {
  const { holdings, isLoading } = useHoldings();

  const formatCurrency = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Holdings</h1>
          <p className="text-muted-foreground">Your portfolio assets</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>All Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : holdings.length === 0 ? (
              <p className="text-muted-foreground">No holdings yet. Add transactions to see your portfolio.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">P/L</TableHead>
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
                      <TableCell className="text-right">{h.quantity.toFixed(4)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(h.avg_price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(h.current_price)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(h.current_value)}</TableCell>
                      <TableCell className={cn("text-right font-medium", h.profit_loss >= 0 ? "text-gain" : "text-loss")}>
                        {h.profit_loss >= 0 ? "+" : ""}{formatCurrency(h.profit_loss)} ({h.profit_loss_percent.toFixed(2)}%)
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
