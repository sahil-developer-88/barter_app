import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  merchant_id?: string;
  scope?: string;
}

const exchangeCodeForToken = async (
  provider: string,
  code: string,
  redirectUri: string
): Promise<TokenResponse> => {
  let tokenUrl = '';
  let clientId = '';
  let clientSecret = '';

  switch (provider.toLowerCase()) {
    case 'square':
      tokenUrl = 'https://connect.squareup.com/oauth2/token';
      clientId = Deno.env.get('SQUARE_OAUTH_CLIENT_ID') || '';
      clientSecret = Deno.env.get('SQUARE_OAUTH_CLIENT_SECRET') || '';
      break;
    
    case 'shopify':
      tokenUrl = 'https://SHOP_NAME.myshopify.com/admin/oauth/access_token';
      clientId = Deno.env.get('SHOPIFY_OAUTH_CLIENT_ID') || '';
      clientSecret = Deno.env.get('SHOPIFY_OAUTH_CLIENT_SECRET') || '';
      break;
    
    case 'clover':
      tokenUrl = 'https://www.clover.com/oauth/token';
      clientId = Deno.env.get('CLOVER_OAUTH_CLIENT_ID') || '';
      clientSecret = Deno.env.get('CLOVER_OAUTH_CLIENT_SECRET') || '';
      break;
    
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Token exchange failed for ${provider}:`, errorText);
    throw new Error(`Failed to exchange authorization code: ${response.statusText}`);
  }

  return await response.json();
};

const getMerchantInfo = async (provider: string, accessToken: string) => {
  let merchantId = '';
  let locationId = '';
  
  try {
    switch (provider.toLowerCase()) {
      case 'square': {
        const response = await fetch('https://connect.squareup.com/v2/merchants', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Square-Version': '2024-01-18',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          merchantId = data.merchant?.[0]?.id || '';
          
          // Get locations
          const locationsResponse = await fetch('https://connect.squareup.com/v2/locations', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Square-Version': '2024-01-18',
            },
          });
          
          if (locationsResponse.ok) {
            const locationsData = await locationsResponse.json();
            locationId = locationsData.locations?.[0]?.id || '';
          }
        }
        break;
      }
      
      case 'shopify': {
        const response = await fetch('https://SHOP_NAME.myshopify.com/admin/api/2024-01/shop.json', {
          headers: {
            'X-Shopify-Access-Token': accessToken,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          merchantId = data.shop?.id?.toString() || '';
          locationId = data.shop?.primary_location_id?.toString() || '';
        }
        break;
      }
      
      case 'clover': {
        const response = await fetch('https://api.clover.com/v3/merchants/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          merchantId = data.id || '';
        }
        break;
      }
    }
  } catch (error) {
    console.error(`Error fetching merchant info for ${provider}:`, error);
  }
  
  return { merchantId, locationId };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return Response.redirect(`${Deno.env.get('SUPABASE_URL')}/merchant-dashboard?oauth_error=${error}`);
    }

    if (!code || !state) {
      throw new Error('Missing code or state parameter');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify state token
    const { data: oauthState, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state_token', state)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (stateError || !oauthState) {
      throw new Error('Invalid or expired state token');
    }

    const provider = oauthState.provider;
    const userId = oauthState.user_id;

    // Exchange code for tokens
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/pos-oauth-callback`;
    const tokenData = await exchangeCodeForToken(provider, code, redirectUri);

    // Get merchant/location info
    const { merchantId, locationId } = await getMerchantInfo(provider, tokenData.access_token);

    // Store integration in database
    const { error: integrationError } = await supabase
      .from('pos_integrations')
      .insert({
        user_id: userId,
        provider: provider,
        auth_method: 'oauth',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        merchant_id: merchantId || null,
        store_id: locationId || null,
        status: 'active',
        scopes: tokenData.scope?.split(' ') || [],
        token_expires_at: tokenData.expires_at || null,
      });

    if (integrationError) {
      console.error('Error storing integration:', integrationError);
      throw new Error('Failed to store integration');
    }

    // Delete used state token
    await supabase
      .from('oauth_states')
      .delete()
      .eq('state_token', state);

    console.log(`OAuth callback successful for ${provider}, user: ${userId}`);

    // Redirect to merchant dashboard with success
    return Response.redirect(`${Deno.env.get('SUPABASE_URL')}/merchant-dashboard?oauth_success=true&provider=${provider}`);

  } catch (error: any) {
    console.error('Error in pos-oauth-callback:', error);
    return Response.redirect(`${Deno.env.get('SUPABASE_URL')}/merchant-dashboard?oauth_error=${encodeURIComponent(error.message)}`);
  }
});
