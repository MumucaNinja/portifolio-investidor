import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { transactionSchema } from "@/lib/validations";
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
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrencyBRL, formatDateLongBR } from "@/lib/formatters";

interface AssetClass {
  id: string;
  name: string;
  color: string;
}

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

interface EditTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

export function EditTransactionModal({ open, onOpenChange, transaction }: EditTransactionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [assetClasses, setAssetClasses] = useState<AssetClass[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (open && transaction) {
      setTicker(transaction.ticker);
      setAssetName(transaction.asset_name);
      setAssetClassId(transaction.asset_class_id);
      setTransactionType(transaction.transaction_type as "buy" | "sell");
      setTransactionDate(parseISO(transaction.transaction_date));
      setQuantity(String(transaction.quantity));
      setPricePerUnit(String(transaction.price_per_unit));
      setFees(String(transaction.fees || 0));
      setErrors({});
      fetchAssetClasses();
    }
  }, [open, transaction]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!transaction) return;

    // Validate with zod
    const formData = {
      ticker: ticker.toUpperCase(),
      asset_name: assetName,
      asset_class_id: assetClassId,
      transaction_type: transactionType,
      quantity: parseFloat(quantity) || 0,
      price_per_unit: parseFloat(pricePerUnit) || 0,
      fees: parseFloat(fees) || 0,
      transaction_date: transactionDate,
    };

    const result = transactionSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast({
        variant: "destructive",
        title: "Erro de Validação",
        description: "Por favor, corrija os erros no formulário",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from("transactions")
      .update({
        ticker: result.data.ticker,
        asset_name: result.data.asset_name,
        asset_class_id: result.data.asset_class_id,
        transaction_type: result.data.transaction_type,
        transaction_date: format(result.data.transaction_date, "yyyy-MM-dd"),
        quantity: result.data.quantity,
        price_per_unit: result.data.price_per_unit,
        fees: result.data.fees,
        total_value: result.data.quantity * result.data.price_per_unit + result.data.fees,
      })
      .eq("id", transaction.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } else {
      toast({
        title: "Sucesso!",
        description: "Transação atualizada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["holdings"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-summary"] });
      onOpenChange(false);
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
          <DialogDescription>
            Modifique os dados da operação.
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
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className={cn("uppercase", errors.ticker && "border-loss")}
                maxLength={10}
              />
              {errors.ticker && <p className="text-xs text-loss">{errors.ticker}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="assetName">Nome do Ativo *</Label>
              <Input
                id="assetName"
                placeholder="Petrobras PN"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                className={cn(errors.asset_name && "border-loss")}
                maxLength={100}
              />
              {errors.asset_name && <p className="text-xs text-loss">{errors.asset_name}</p>}
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
                min="0.0001"
                placeholder="100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={cn(errors.quantity && "border-loss")}
              />
              {errors.quantity && <p className="text-xs text-loss">{errors.quantity}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Preço/Unidade *</Label>
              <Input
                id="price"
                type="number"
                step="any"
                min="0.01"
                placeholder="38,50"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                className={cn(errors.price_per_unit && "border-loss")}
              />
              {errors.price_per_unit && <p className="text-xs text-loss">{errors.price_per_unit}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fees">Taxas</Label>
              <Input
                id="fees"
                type="number"
                step="any"
                min="0"
                placeholder="0"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                className={cn(errors.fees && "border-loss")}
              />
              {errors.fees && <p className="text-xs text-loss">{errors.fees}</p>}
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
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
