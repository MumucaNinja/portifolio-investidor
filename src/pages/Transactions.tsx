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
import { formatCurrencyBRL, formatDateBR, formatNumberBR } from "@/lib/formatters";

export default function Transactions() {
  const { data: transactions, isLoading } = useTransactions();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Transações</h1>
            <p className="text-muted-foreground">Histórico de operações</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Todas as Transações</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : !transactions?.length ? (
              <p className="text-muted-foreground">Nenhuma transação ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-secondary/50">
                      <TableCell>{formatDateBR(tx.transaction_date)}</TableCell>
                      <TableCell>
                        <Badge className={cn(tx.transaction_type === "buy" ? "bg-gain" : "bg-loss", "text-white")}>
                          {tx.transaction_type === "buy" ? "COMPRA" : "VENDA"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{tx.ticker}</TableCell>
                      <TableCell>{tx.asset_name}</TableCell>
                      <TableCell className="text-right">{formatNumberBR(tx.quantity, 4)}</TableCell>
                      <TableCell className="text-right">{formatCurrencyBRL(tx.price_per_unit)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrencyBRL(tx.total_value)}</TableCell>
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
