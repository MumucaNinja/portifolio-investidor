import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Não autorizado', details: 'Token de autenticação não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Não autorizado', details: 'Sessão expirada ou inválida' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.info(`Authenticated user: ${user.id}`);

    const { tickers } = await req.json();

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhum ticker fornecido', details: 'A lista de ativos está vazia' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate tickers input
    const maxTickers = 50;
    if (tickers.length > maxTickers) {
      return new Response(
        JSON.stringify({ error: 'Limite excedido', details: `Máximo de ${maxTickers} ativos permitidos` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tickerRegex = /^[A-Z0-9]{1,10}$/;
    const validTickers = tickers.filter((t: unknown) => 
      typeof t === 'string' && tickerRegex.test(t)
    );

    if (validTickers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Tickers inválidos', details: 'Nenhum ticker válido fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const BRAPI_TOKEN = Deno.env.get('BRAPI_TOKEN');
    if (!BRAPI_TOKEN) {
      console.error('BRAPI_TOKEN is not configured');
      return new Response(
        JSON.stringify({ error: 'Configuração incompleta', details: 'Token da API Brapi não configurado. Configure a chave BRAPI_TOKEN.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.info(`Fetching prices for ${validTickers.length} tickers: ${validTickers.join(', ')}`);

    // Fetch prices one ticker at a time (Brapi free plan limitation)
    const prices: Record<string, number> = {};
    const errors: string[] = [];
    
    for (const ticker of validTickers) {
      try {
        const apiUrl = `https://brapi.dev/api/quote/${ticker}?token=${BRAPI_TOKEN}`;
        console.info(`Fetching price for: ${ticker}`);
        
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok) {
          // Handle specific error codes
          if (response.status === 401) {
            console.error(`API 401 error for ${ticker}: Chave de API inválida`);
            errors.push(`${ticker}: Chave de API inválida`);
            continue;
          }
          if (response.status === 429) {
            console.error(`API 429 error for ${ticker}: Limite de requisições excedido`);
            errors.push(`${ticker}: Limite de requisições excedido`);
            // Stop fetching more if rate limited
            break;
          }
          if (response.status === 404) {
            console.warn(`Ticker ${ticker} não encontrado na Brapi`);
            errors.push(`${ticker}: Ativo não encontrado`);
            continue;
          }
          
          console.error(`API error for ${ticker}:`, response.status, data);
          errors.push(`${ticker}: Erro ${response.status}`);
          continue;
        }

        // Check for API-level errors in response body
        if (data.error) {
          console.error(`Brapi API error for ${ticker}:`, data.message);
          errors.push(`${ticker}: ${data.message}`);
          continue;
        }

        // Extract price from response
        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
          const result = data.results[0];
          if (result.regularMarketPrice !== undefined) {
            prices[result.symbol || ticker] = result.regularMarketPrice;
            console.info(`${ticker}: R$ ${result.regularMarketPrice}`);
          } else {
            console.warn(`No price found for ${ticker}`);
            errors.push(`${ticker}: Preço não disponível`);
          }
        } else {
          console.warn(`No results for ${ticker}`);
          errors.push(`${ticker}: Sem dados`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (fetchError) {
        console.error(`Fetch error for ${ticker}:`, fetchError);
        errors.push(`${ticker}: Erro de conexão`);
      }
    }

    const priceCount = Object.keys(prices).length;
    console.info(`Successfully fetched ${priceCount} prices. Errors: ${errors.length}`);

    // Return success even with partial results
    if (priceCount > 0) {
      return new Response(
        JSON.stringify({ 
          prices, 
          updatedAt: new Date().toISOString(),
          count: priceCount,
          errors: errors.length > 0 ? errors : undefined
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // All requests failed
    return new Response(
      JSON.stringify({ 
        error: 'Falha ao buscar cotações', 
        details: errors.join('; ') || 'Nenhum preço encontrado',
        errors
      }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-prices function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
