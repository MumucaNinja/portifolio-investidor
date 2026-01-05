import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface PriceUpdateResult {
  prices: Record<string, number>;
  updatedAt: string;
  count: number;
  errors?: string[];
}

interface PriceErrorResult {
  error: string;
  details?: string;
  errors?: string[];
}

export function usePriceUpdate() {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  const updatePrices = async (tickers: string[]) => {
    if (!session?.access_token) {
      toast({
        title: "Faça login novamente",
        description: "Sua sessão expirou. Entre novamente para atualizar cotações.",
        variant: "destructive",
      });
      return;
    }

    if (tickers.length === 0) {
      toast({
        title: "Nenhum ativo",
        description: "Adicione transações para atualizar cotações.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
      const { data, error } = await supabase.functions.invoke<PriceUpdateResult | PriceErrorResult>("update-prices", {
        body: { tickers },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message || "Erro ao chamar a função");
      }

      // Check if response is an error
      if (data && 'error' in data) {
        const errorData = data as PriceErrorResult;
        console.error("API error response:", errorData);
        toast({
          title: errorData.error,
          description: errorData.details || "Verifique a configuração da API.",
          variant: "destructive",
        });
        return;
      }

      const successData = data as PriceUpdateResult;
      if (successData?.prices) {
        setPrices(prev => ({ ...prev, ...successData.prices }));
        setLastUpdated(new Date(successData.updatedAt));
        
        // Show success with partial errors if any
        if (successData.errors && successData.errors.length > 0) {
          toast({
            title: `${successData.count} cotação(ões) atualizada(s)`,
            description: `Alguns ativos falharam: ${successData.errors.slice(0, 3).join(', ')}${successData.errors.length > 3 ? '...' : ''}`,
          });
        } else {
          toast({
            title: "Cotações atualizadas",
            description: `${successData.count} ativo(s) atualizado(s) com sucesso.`,
          });
        }
      }
    } catch (error) {
      console.error("Error updating prices:", error);
      toast({
        title: "Erro ao atualizar cotações",
        description: error instanceof Error ? error.message : "Falha ao conectar com o servidor.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    prices,
    lastUpdated,
    isUpdating,
    updatePrices,
  };
}
