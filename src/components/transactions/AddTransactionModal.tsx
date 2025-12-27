import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrencyBRL, formatDateLongBR } from "@/lib/formatters";

interface AssetClass {
  id: string;
  name: string;
  color: string;
}

interface AddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTransactionModal({ open, onOpenChange }: AddTransactionModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [assetClasses, setAssetClasses] = useState<AssetClass[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [ticker, setTicker] = useState("");
  const [assetName, setAssetName] = useState("");
  const [assetClassId, setAssetClassId] = useState("");
  const [transactionType, setTransactionType] = useState<"buy" | "sell">("buy");
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  const [quantity, setQuantity] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [fees, setFees] = useState("0");

  const totalValue =
    (parseFloat(quantity) || 0) * (parseFloat(pricePerUnit) || 0) + (parseFloat(fees) || 0);

  useEffect(() => {
    if (open) {
      fetchAssetClasses();
    }
  }, [open]);

  const fetchAssetClasses = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("asset_classes")
      .select("id, name, color")
      .eq("is_active", true)
      .order("name");

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar classes de ativos",
      });
    } else {
      setAssetClasses(data || []);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setTicker("");
    setAssetName("");
    setAssetClassId("");
    setTransactionType("buy");
    setTransactionDate(new Date());
    setQuantity("");
    setPricePerUnit("");
    setFees("0");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ticker || !assetName || !assetClassId || !quantity || !pricePerUnit) {
      toast({
        variant: "destructive",
        title: "Erro de Validação",
        description: "Por favor, preencha todos os campos obrigatórios",
      });
      return;
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Você precisa estar logado para adicionar transações",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      ticker: ticker.toUpperCase(),
      asset_name: assetName,
      asset_class_id: assetClassId,
      transaction_type: transactionType,
      transaction_date: format(transactionDate, "yyyy-MM-dd"),
      quantity: parseFloat(quantity),
      price_per_unit: parseFloat(pricePerUnit),
      fees: parseFloat(fees) || 0,
      total_value: totalValue,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } else {
      toast({
        title: "Sucesso!",
        description: "Transação adicionada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["holdings"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-summary"] });
      resetForm();
      onOpenChange(false);
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
          <DialogDescription>
            Registre uma nova operação de compra ou venda no seu portfólio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticker">Ticker *</Label>
              <Input
                id="ticker"
                placeholder="PETR4"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assetName">Nome do Ativo *</Label>
              <Input
                id="assetName"
                placeholder="Petrobras PN"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Classe do Ativo *</Label>
              <Select value={assetClassId} onValueChange={setAssetClassId}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione"} />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {assetClasses.map((ac) => (
                    <SelectItem key={ac.id} value={ac.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ac.color }}
                        />
                        {ac.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Operação</Label>
              <div className="flex rounded-lg border border-input overflow-hidden">
                <button
                  type="button"
                  onClick={() => setTransactionType("buy")}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium transition-colors",
                    transactionType === "buy"
                      ? "bg-gain text-gain-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  )}
                >
                  Compra
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionType("sell")}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium transition-colors",
                    transactionType === "sell"
                      ? "bg-loss text-loss-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  )}
                >
                  Venda
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data da Operação</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-secondary/50",
                    !transactionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {transactionDate ? formatDateLongBR(transactionDate) : "Escolha uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover" align="start">
                <Calendar
                  mode="single"
                  selected={transactionDate}
                  onSelect={(date) => date && setTransactionDate(date)}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                step="any"
                placeholder="100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Preço/Unidade *</Label>
              <Input
                id="price"
                type="number"
                step="any"
                placeholder="38,50"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fees">Taxas</Label>
              <Input
                id="fees"
                type="number"
                step="any"
                placeholder="0"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
              />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-secondary/50">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Valor Total</span>
              <span className="text-lg font-bold text-foreground">
                {formatCurrencyBRL(totalValue)}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
