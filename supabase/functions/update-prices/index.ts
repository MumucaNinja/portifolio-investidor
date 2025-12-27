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
        JSON.stringify({ error: 'Unauthorized' }),
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
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    const { tickers } = await req.json();

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Tickers array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate tickers input
    const maxTickers = 50;
    if (tickers.length > maxTickers) {
      return new Response(
        JSON.stringify({ error: `Maximum ${maxTickers} tickers allowed` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tickerRegex = /^[A-Z0-9]{1,10}$/;
    const validTickers = tickers.filter((t: unknown) => 
      typeof t === 'string' && tickerRegex.test(t)
    );

    if (validTickers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid tickers provided' }),
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
    const tickersParam = validTickers.join(',');
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
