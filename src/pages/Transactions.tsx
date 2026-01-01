import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTransactions } from "@/hooks/usePortfolioData";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";
import { EditTransactionModal } from "@/components/transactions/EditTransactionModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrencyBRL, formatDateBR, formatNumberBR } from "@/lib/formatters";

interface Transaction {
  id: string;
  ticker: string;
  asset_name: string;
  asset_class_id: string;
  transaction_type: string;
  transaction_date: string;
  quantity: number;
  price_per_unit: number;
  fees: number | null;
  total_value: number;
}

export default function Transactions() {
  const { data: transactions, isLoading } = useTransactions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [deleteTransaction, setDeleteTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    if (!deleteTransaction) return;

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", deleteTransaction.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } else {
      toast({
        title: "Sucesso!",
        description: "Transação excluída com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["holdings"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dividends"] });
    }
    setDeleteTransaction(null);
  };

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case "buy":
        return <Badge className="bg-gain text-white">COMPRA</Badge>;
      case "sell":
        return <Badge className="bg-loss text-white">VENDA</Badge>;
      case "dividend":
        return <Badge className="bg-primary text-white">PROVENTO</Badge>;
      default:
        return <Badge>{type.toUpperCase()}</Badge>;
    }
  };

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
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-secondary/50">
                      <TableCell>{formatDateBR(tx.transaction_date)}</TableCell>
                      <TableCell>
                        {getTransactionTypeBadge(tx.transaction_type)}
                      </TableCell>
                      <TableCell className="font-medium">{tx.ticker}</TableCell>
                      <TableCell>{tx.asset_name}</TableCell>
                      <TableCell className="text-right">
                        {tx.transaction_type === "dividend" ? "-" : formatNumberBR(tx.quantity, 4)}
                      </TableCell>
                      <TableCell className="text-right">
                        {tx.transaction_type === "dividend" ? "-" : formatCurrencyBRL(tx.price_per_unit)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        tx.transaction_type === "dividend" && "text-gain"
                      )}>
                        {formatCurrencyBRL(tx.total_value)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditTransaction(tx as Transaction)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-loss hover:text-loss"
                            onClick={() => setDeleteTransaction(tx as Transaction)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AddTransactionModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      
      <EditTransactionModal
        open={!!editTransaction}
        onOpenChange={(open) => !open && setEditTransaction(null)}
        transaction={editTransaction}
      />

      <AlertDialog open={!!deleteTransaction} onOpenChange={(open) => !open && setDeleteTransaction(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a transação de {deleteTransaction?.ticker}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-loss hover:bg-loss/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
