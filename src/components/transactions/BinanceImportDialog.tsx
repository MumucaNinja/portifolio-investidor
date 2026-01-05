import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParsedTransaction {
  ticker: string;
  assetName: string;
  quantity: number;
  pricePerUnit: number;
  totalValue: number;
  date: Date;
  transactionType: "buy" | "sell";
}

interface BinanceImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: ParsedTransaction) => void;
}

// Regex patterns for Binance email/text parsing
const BINANCE_PATTERNS = {
  // Pattern: "Compra de 0.00123456 BTC" or "Venda de 0.5 ETH"
  orderType: /(?:compra|venda|buy|sell)\s+(?:de\s+)?(\d+(?:[.,]\d+)?)\s*([A-Z]{2,10})/i,
  // Pattern: "Preço: R$ 150.000,00" or "Price: 150000.00 BRL"
  price: /(?:pre[çc]o|price)[:\s]*(?:R\$?\s*)?(\d+(?:[.,]\d+)*)/i,
  // Pattern: "Total: R$ 184,50" or "Amount: 184.50"
  total: /(?:total|amount|valor)[:\s]*(?:R\$?\s*)?(\d+(?:[.,]\d+)*)/i,
  // Pattern: "Data: 05/01/2026" or "Date: 2026-01-05" or "05 Jan 2026"
  date: /(?:data|date|em)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|\d{1,2}\s+\w{3}\s+\d{4})/i,
  // Alternative: Find date in format "2026-01-05 10:30:00"
  dateTime: /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\s+\d{1,2}:\d{2}/,
  // Pattern for quantities in different formats
  quantity: /(?:quantidade|qty|amount)[:\s]*(\d+(?:[.,]\d+)?)/i,
  // Crypto symbols commonly found
  cryptoSymbol: /\b(BTC|ETH|BNB|SOL|XRP|ADA|DOGE|DOT|AVAX|MATIC|LTC|LINK|UNI|ATOM|FTM|NEAR|ALGO|VET|ICP|FIL|SAND|MANA|AXS|GALA|ENJ|CHZ|SHIB|APE|OP|ARB|SUI|SEI|TIA|JUP|PYTH|WIF|PEPE|BONK|FLOKI|RENDER|INJ|TRX|XLM|ETC|BCH|LEO|TON|MKR|AAVE|CRV|GRT|SNX|COMP|YFI|SUSHI|CAKE|LUNC|USTC)\b/i,
};

// CSV column mappings for Binance export
const CSV_COLUMNS = {
  date: ["Date(UTC)", "Date", "Time", "UTC_Time", "Create Time"],
  type: ["Side", "Type", "Operation", "Order Type"],
  pair: ["Pair", "Market", "Symbol", "Trading Pair"],
  amount: ["Amount", "Quantity", "Executed", "Filled", "Order Amount"],
  price: ["Price", "Avg. Price", "Average Price", "Order Price"],
  total: ["Total", "Quote Qty", "Total Amount", "Executed Total"],
  asset: ["Coin", "Asset", "Currency"],
};

function parseNumber(value: string): number {
  if (!value) return 0;
  // Handle Brazilian format (1.234,56) and US format (1,234.56)
  const cleaned = value.replace(/[^\d.,\-]/g, "");
  
  // If it has both . and ,, determine format
  if (cleaned.includes(",") && cleaned.includes(".")) {
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    
    if (lastComma > lastDot) {
      // Brazilian format: 1.234,56
      return parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
    } else {
      // US format: 1,234.56
      return parseFloat(cleaned.replace(/,/g, ""));
    }
  }
  
  // Only comma - likely Brazilian decimal
  if (cleaned.includes(",") && !cleaned.includes(".")) {
    return parseFloat(cleaned.replace(",", "."));
  }
  
  // Only dot or no separator
  return parseFloat(cleaned.replace(/,/g, ""));
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Try various date formats
  const formats = [
    // ISO format
    /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    // Brazilian format DD/MM/YYYY
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    // Brazilian format DD/MM/YY
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/,
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[0]) {
        // ISO: YYYY-MM-DD
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      } else {
        // Brazilian: DD/MM/YYYY or DD/MM/YY
        let year = parseInt(match[3]);
        if (year < 100) year += 2000;
        return new Date(year, parseInt(match[2]) - 1, parseInt(match[1]));
      }
    }
  }
  
  // Try native parsing as fallback
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function parseBinanceText(text: string): Partial<ParsedTransaction> | null {
  const result: Partial<ParsedTransaction> = {};
  
  // Determine transaction type
  const isSell = /venda|sell/i.test(text);
  result.transactionType = isSell ? "sell" : "buy";
  
  // Try to extract crypto symbol first
  const symbolMatch = text.match(BINANCE_PATTERNS.cryptoSymbol);
  if (symbolMatch) {
    result.ticker = symbolMatch[1].toUpperCase();
    result.assetName = symbolMatch[1].toUpperCase();
  }
  
  // Try to extract quantity and asset from order pattern
  const orderMatch = text.match(BINANCE_PATTERNS.orderType);
  if (orderMatch) {
    result.quantity = parseNumber(orderMatch[1]);
    if (!result.ticker) {
      result.ticker = orderMatch[2].toUpperCase();
      result.assetName = orderMatch[2].toUpperCase();
    }
  }
  
  // Extract quantity from specific field
  if (!result.quantity) {
    const qtyMatch = text.match(BINANCE_PATTERNS.quantity);
    if (qtyMatch) {
      result.quantity = parseNumber(qtyMatch[1]);
    }
  }
  
  // Extract price
  const priceMatch = text.match(BINANCE_PATTERNS.price);
  if (priceMatch) {
    result.pricePerUnit = parseNumber(priceMatch[1]);
  }
  
  // Extract total
  const totalMatch = text.match(BINANCE_PATTERNS.total);
  if (totalMatch) {
    result.totalValue = parseNumber(totalMatch[1]);
  }
  
  // Calculate missing values
  if (result.quantity && result.totalValue && !result.pricePerUnit) {
    result.pricePerUnit = result.totalValue / result.quantity;
  } else if (result.quantity && result.pricePerUnit && !result.totalValue) {
    result.totalValue = result.quantity * result.pricePerUnit;
  }
  
  // Extract date
  let dateMatch = text.match(BINANCE_PATTERNS.dateTime);
  if (!dateMatch) {
    dateMatch = text.match(BINANCE_PATTERNS.date);
  }
  if (dateMatch) {
    const parsed = parseDate(dateMatch[1]);
    if (parsed) result.date = parsed;
  }
  
  // Return null if we couldn't extract essential data
  if (!result.ticker || (!result.quantity && !result.totalValue)) {
    return null;
  }
  
  return result;
}

function parseBinanceCSV(csvText: string): Partial<ParsedTransaction>[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];
  
  // Parse header
  const header = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  
  // Find column indices
  const findColumn = (possibleNames: string[]): number => {
    for (const name of possibleNames) {
      const idx = header.findIndex(
        (h) => h.toLowerCase() === name.toLowerCase()
      );
      if (idx >= 0) return idx;
    }
    return -1;
  };
  
  const dateIdx = findColumn(CSV_COLUMNS.date);
  const typeIdx = findColumn(CSV_COLUMNS.type);
  const pairIdx = findColumn(CSV_COLUMNS.pair);
  const amountIdx = findColumn(CSV_COLUMNS.amount);
  const priceIdx = findColumn(CSV_COLUMNS.price);
  const totalIdx = findColumn(CSV_COLUMNS.total);
  const assetIdx = findColumn(CSV_COLUMNS.asset);
  
  const results: Partial<ParsedTransaction>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));
    if (values.length < 3) continue;
    
    const result: Partial<ParsedTransaction> = {};
    
    // Extract asset/ticker
    if (assetIdx >= 0) {
      result.ticker = values[assetIdx].toUpperCase();
      result.assetName = values[assetIdx].toUpperCase();
    } else if (pairIdx >= 0) {
      // Extract from pair like "BTCBRL" or "BTC/BRL"
      const pair = values[pairIdx];
      const match = pair.match(/^([A-Z]{2,10})(?:\/|_)?(?:BRL|USDT|USD|BUSD)/i);
      if (match) {
        result.ticker = match[1].toUpperCase();
        result.assetName = match[1].toUpperCase();
      }
    }
    
    // Extract type
    if (typeIdx >= 0) {
      const type = values[typeIdx].toLowerCase();
      result.transactionType = type.includes("sell") || type.includes("venda") ? "sell" : "buy";
    } else {
      result.transactionType = "buy";
    }
    
    // Extract amount
    if (amountIdx >= 0) {
      result.quantity = parseNumber(values[amountIdx]);
    }
    
    // Extract price
    if (priceIdx >= 0) {
      result.pricePerUnit = parseNumber(values[priceIdx]);
    }
    
    // Extract total
    if (totalIdx >= 0) {
      result.totalValue = parseNumber(values[totalIdx]);
    }
    
    // Calculate missing values
    if (result.quantity && result.totalValue && !result.pricePerUnit) {
      result.pricePerUnit = result.totalValue / result.quantity;
    } else if (result.quantity && result.pricePerUnit && !result.totalValue) {
      result.totalValue = result.quantity * result.pricePerUnit;
    }
    
    // Extract date
    if (dateIdx >= 0) {
      const parsed = parseDate(values[dateIdx]);
      if (parsed) result.date = parsed;
    }
    
    if (result.ticker && (result.quantity || result.totalValue)) {
      results.push(result);
    }
  }
  
  return results;
}

export function BinanceImportDialog({ open, onOpenChange, onImport }: BinanceImportDialogProps) {
  const [text, setText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<Partial<ParsedTransaction> | null>(null);
  const { toast } = useToast();
  
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setText(content);
      handleParse(content);
    };
    reader.readAsText(file);
    
    // Reset input
    e.target.value = "";
  }, []);
  
  const handleParse = (inputText?: string) => {
    const textToParse = inputText || text;
    if (!textToParse.trim()) {
      toast({
        variant: "destructive",
        title: "Texto vazio",
        description: "Cole o texto do e-mail ou faça upload de um arquivo CSV.",
      });
      return;
    }
    
    setIsParsing(true);
    setParsedData(null);
    
    try {
      let result: Partial<ParsedTransaction> | null = null;
      
      // Check if it's CSV (has header with common column names)
      const isCSV = /^[^,\n]+(?:,[^,\n]+)+\n/m.test(textToParse) &&
        /date|time|pair|symbol|amount|quantity|price/i.test(textToParse.split("\n")[0]);
      
      if (isCSV) {
        const csvResults = parseBinanceCSV(textToParse);
        if (csvResults.length > 0) {
          result = csvResults[0]; // Take first transaction
          if (csvResults.length > 1) {
            toast({
              title: "CSV com múltiplas transações",
              description: `Encontradas ${csvResults.length} transações. Importando a primeira.`,
            });
          }
        }
      } else {
        result = parseBinanceText(textToParse);
      }
      
      if (result && result.ticker) {
        setParsedData(result);
        toast({
          title: "Dados extraídos!",
          description: `Encontrado: ${result.ticker} - ${result.quantity || "?"} unidades`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Não foi possível extrair dados",
          description: "Verifique se o texto contém informações da transação (ativo, quantidade, preço).",
        });
      }
    } catch (error) {
      console.error("Parse error:", error);
      toast({
        variant: "destructive",
        title: "Erro ao processar",
        description: "Formato não reconhecido. Tente colar o texto completo do e-mail.",
      });
    } finally {
      setIsParsing(false);
    }
  };
  
  const handleConfirmImport = () => {
    if (!parsedData?.ticker) return;
    
    const fullData: ParsedTransaction = {
      ticker: parsedData.ticker || "",
      assetName: parsedData.assetName || parsedData.ticker || "",
      quantity: parsedData.quantity || 0,
      pricePerUnit: parsedData.pricePerUnit || 0,
      totalValue: parsedData.totalValue || 0,
      date: parsedData.date || new Date(),
      transactionType: parsedData.transactionType || "buy",
    };
    
    onImport(fullData);
    setText("");
    setParsedData(null);
    onOpenChange(false);
  };
  
  const handleClose = () => {
    setText("");
    setParsedData(null);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Importar da Binance
          </DialogTitle>
          <DialogDescription>
            Cole o texto do e-mail de confirmação ou faça upload do CSV exportado.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* File upload */}
          <div className="space-y-2">
            <Label>Arquivo CSV</Label>
            <div className="flex gap-2">
              <Input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="flex-1"
              />
            </div>
          </div>
          
          {/* Text input */}
          <div className="space-y-2">
            <Label>Ou cole o texto do e-mail</Label>
            <Textarea
              placeholder={`Cole aqui o texto do e-mail de confirmação da Binance...

Exemplo:
Compra de 0.00123456 BTC
Preço: R$ 550.000,00
Total: R$ 676,50
Data: 05/01/2026`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              className="font-mono text-xs"
            />
          </div>
          
          {/* Parse button */}
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => handleParse()}
            disabled={isParsing || !text.trim()}
          >
            {isParsing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Analisar Texto
              </>
            )}
          </Button>
          
          {/* Parsed result preview */}
          {parsedData && (
            <div className="p-4 rounded-lg bg-gain/10 border border-gain/30 space-y-2">
              <div className="flex items-center gap-2 text-gain mb-2">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium text-sm">Dados Extraídos</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Ativo:</span>{" "}
                  <span className="font-medium">{parsedData.ticker}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo:</span>{" "}
                  <span className={cn(
                    "font-medium",
                    parsedData.transactionType === "buy" ? "text-gain" : "text-loss"
                  )}>
                    {parsedData.transactionType === "buy" ? "Compra" : "Venda"}
                  </span>
                </div>
                {parsedData.quantity && (
                  <div>
                    <span className="text-muted-foreground">Quantidade:</span>{" "}
                    <span className="font-medium">{parsedData.quantity}</span>
                  </div>
                )}
                {parsedData.pricePerUnit && (
                  <div>
                    <span className="text-muted-foreground">Preço:</span>{" "}
                    <span className="font-medium">
                      R$ {parsedData.pricePerUnit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {parsedData.totalValue && (
                  <div>
                    <span className="text-muted-foreground">Total:</span>{" "}
                    <span className="font-medium">
                      R$ {parsedData.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {parsedData.date && (
                  <div>
                    <span className="text-muted-foreground">Data:</span>{" "}
                    <span className="font-medium">
                      {parsedData.date.toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={!parsedData}
              onClick={handleConfirmImport}
            >
              Usar Dados
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
