import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/hooks/usePortfolioData";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function Transactions() {
  const { data: transactions, isLoading } = useTransactions();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatCurrency = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
            <p className="text-muted-foreground">Transaction history</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : !transactions?.length ? (
              <p className="text-muted-foreground">No transactions yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-secondary/50">
                      <TableCell>{format(new Date(tx.transaction_date), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <Badge className={cn(tx.transaction_type === "buy" ? "bg-gain" : "bg-loss", "text-white")}>
                          {tx.transaction_type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{tx.ticker}</TableCell>
                      <TableCell>{tx.asset_name}</TableCell>
                      <TableCell className="text-right">{tx.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(tx.price_per_unit)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(tx.total_value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <AddTransactionModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </DashboardLayout>
  );
}
