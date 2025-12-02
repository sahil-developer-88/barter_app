import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OAuthConfig {
  authUrl: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

const getOAuthConfig = (provider: string): OAuthConfig | null => {
  const baseRedirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/pos-oauth-callback`;
  
  switch (provider.toLowerCase()) {
    case 'square':
      return {
        authUrl: 'https://connect.squareup.com/oauth2/authorize',
        clientId: Deno.env.get('SQUARE_OAUTH_CLIENT_ID') || '',
        redirectUri: baseRedirectUri,
        scopes: ['MERCHANT_PROFILE_READ', 'PAYMENTS_WRITE', 'PAYMENTS_READ', 'ORDERS_READ']
      };
    
    case 'shopify':
      return {
        authUrl: 'https://SHOP_NAME.myshopify.com/admin/oauth/authorize',
        clientId: Deno.env.get('SHOPIFY_OAUTH_CLIENT_ID') || '',
        redirectUri: baseRedirectUri,
        scopes: ['read_orders', 'read_products', 'write_webhooks']
      };
    
    case 'clover':
      return {
        authUrl: 'https://www.clover.com/oauth/authorize',
        clientId: Deno.env.get('CLOVER_OAUTH_CLIENT_ID') || '',
        redirectUri: baseRedirectUri,
        scopes: ['payments', 'orders', 'merchants']
      };
    
    default:
      return null;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { provider, shopName } = await req.json();

    if (!provider) {
      throw new Error('Provider is required');
    }

    const oauthConfig = getOAuthConfig(provider);
    if (!oauthConfig || !oauthConfig.clientId) {
      throw new Error(`OAuth not configured for provider: ${provider}`);
    }

    // Generate random state token for CSRF protection
    const stateToken = crypto.randomUUID();

    // Store state in database
    const { error: stateError } = await supabase
      .from('oauth_states')
      .insert({
        user_id: user.id,
        state_token: stateToken,
        provider: provider.toLowerCase(),
      });

    if (stateError) {
      console.error('Error storing OAuth state:', stateError);
      throw new Error('Failed to initiate OAuth flow');
    }

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: oauthConfig.clientId,
      scope: oauthConfig.scopes.join(' '),
      redirect_uri: oauthConfig.redirectUri,
      state: stateToken,
      response_type: 'code',
    });

    // For Shopify, replace SHOP_NAME in URL
    let authUrl = oauthConfig.authUrl;
    if (provider.toLowerCase() === 'shopify' && shopName) {
      authUrl = authUrl.replace('SHOP_NAME', shopName);
    }

    const authorizationUrl = `${authUrl}?${params.toString()}`;

    console.log(`OAuth flow initiated for ${provider}, user: ${user.id}`);

    return new Response(
      JSON.stringify({ 
        authorizationUrl,
        state: stateToken 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in pos-oauth-initiate:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
