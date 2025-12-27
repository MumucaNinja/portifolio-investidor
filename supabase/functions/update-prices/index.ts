import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { tickers } = await req.json();

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Tickers array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const BRAPI_TOKEN = Deno.env.get('BRAPI_TOKEN');
    if (!BRAPI_TOKEN) {
      console.error('BRAPI_TOKEN is not configured');
      return new Response(
        JSON.stringify({ error: 'API token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Join tickers with comma for the API call
    const tickersParam = tickers.join(',');
    const apiUrl = `https://brapi.dev/api/quote/${tickersParam}?token=${BRAPI_TOKEN}`;

    console.log(`Fetching prices for tickers: ${tickersParam}`);

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error('Brapi API error:', data);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch prices from Brapi', details: data }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract prices from the response
    const prices: Record<string, number> = {};
    
    if (data.results && Array.isArray(data.results)) {
      for (const result of data.results) {
        if (result.symbol && result.regularMarketPrice !== undefined) {
          prices[result.symbol] = result.regularMarketPrice;
          console.log(`${result.symbol}: R$ ${result.regularMarketPrice}`);
        }
      }
    }

    console.log(`Successfully fetched ${Object.keys(prices).length} prices`);

    return new Response(
      JSON.stringify({ 
        prices, 
        updatedAt: new Date().toISOString(),
        count: Object.keys(prices).length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-prices function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
