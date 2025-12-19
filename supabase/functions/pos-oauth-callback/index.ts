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

/**
 * Register webhook with Shopify using Admin API
 */
const registerShopifyWebhook = async (shopDomain: string, accessToken: string): Promise<void> => {
  const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/pos-webhook?provider=shopify`;

  const response = await fetch(`https://${shopDomain}/admin/api/2024-01/webhooks.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      webhook: {
        topic: 'orders/create',
        address: webhookUrl,
        format: 'json',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to register Shopify webhook:', errorText);
    throw new Error(`Webhook registration failed: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Webhook registered:', data.webhook);
};

/**
 * Register webhook with Lightspeed using API
 */
const registerLightspeedWebhook = async (storeId: string, accessToken: string): Promise<void> => {
  const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/pos-webhook?provider=lightspeed`;

  const response = await fetch(
    `https://${storeId}.retail.lightspeed.app/api/webhook.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: 'sale.update',
        url: webhookUrl,
        format: 'json',
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to register Lightspeed webhook:', errorText);
    throw new Error(`Webhook registration failed: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Lightspeed webhook registered:', data);
};

const exchangeCodeForToken = async (
  provider: string,
  code: string,
  redirectUri: string,
  shopName?: string
): Promise<TokenResponse> => {
  let tokenUrl = '';
  let clientId = '';
  let clientSecret = '';

  switch (provider.toLowerCase()) {
    case 'square':
      console.log("llllllll")
      clientId = Deno.env.get('SQUARE_OAUTH_CLIENT_ID') || '';
      clientSecret = Deno.env.get('SQUARE_OAUTH_CLIENT_SECRET') || '';
      // Use sandbox URL if client ID contains 'sandbox'
      tokenUrl = clientId.includes('sandbox')
        ? 'https://connect.squareupsandbox.com/oauth2/token'
        : 'https://connect.squareup.com/oauth2/token';
      break;

    case 'shopify':
      if (!shopName) {
        throw new Error('Shop name is required for Shopify OAuth');
      }
      tokenUrl = `https://${shopName}/admin/oauth/access_token`;
      clientId = Deno.env.get('SHOPIFY_CLIENT_ID') || '';
      clientSecret = Deno.env.get('SHOPIFY_CLIENT_SECRET') || '';
      break;

    case 'clover':
      tokenUrl = 'https://sandbox.dev.clover.com/oauth/token';
      clientId = Deno.env.get('CLOVER_OAUTH_CLIENT_ID') || '';
      clientSecret = Deno.env.get('CLOVER_OAUTH_CLIENT_SECRET') || '';
      break;

    case 'lightspeed':
      // Lightspeed token endpoint requires store domain
      if (!shopName) {
        throw new Error('Lightspeed requires store domain for token exchange');
      }
      tokenUrl = `https://${shopName}.retail.lightspeed.app/api/1.0/token`;
      clientId = Deno.env.get('LIGHTSPEED_OAUTH_CLIENT_ID') || '';
      clientSecret = Deno.env.get('LIGHTSPEED_OAUTH_CLIENT_SECRET') || '';
      break;

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  console.log(`🔄 Exchanging code for ${provider}`);
  console.log(`   Token URL: ${tokenUrl}`);
  console.log(`   Client ID (full): ${clientId}`);
  console.log(`   Client Secret (first 10 chars): ${clientSecret.substring(0, 10)}...`);
  console.log(`   Client Secret (last 4 chars): ...${clientSecret.slice(-4)}`);
  console.log(`   Redirect URI: ${redirectUri}`);
  console.log(`   Shop Name: ${shopName || 'N/A'}`);
  console.log(`   Code (first 10 chars): ${code.substring(0, 10)}...`);

  // Lightspeed requires form-urlencoded, others use JSON
  const isFormEncoded = provider.toLowerCase() === 'lightspeed';

  let body;
  let headers: Record<string, string>;

  if (isFormEncoded) {
    // Lightspeed: credentials in body as form-urlencoded
    const params = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });
    body = params.toString();
    headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    console.log(`   Request format: form-urlencoded (credentials in body)`);
    console.log(`   Body params: code=..., client_id=${clientId}, grant_type=authorization_code, redirect_uri=${redirectUri}`);
  } else {
    // Use JSON for other providers
    body = JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });
    headers = {
      'Content-Type': 'application/json',
    };
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Token exchange failed for ${provider}`);
    console.error(`   Status: ${response.status} ${response.statusText}`);
    console.error(`   URL: ${tokenUrl}`);
    console.error(`   Response: ${errorText}`);
    console.error(`   Client ID: ${clientId.substring(0, 10)}...`);
    console.error(`   Redirect URI: ${redirectUri}`);
    throw new Error(`Failed to exchange authorization code: ${response.statusText} - ${errorText}`);
  }

  console.log(`✅ Token exchange successful for ${provider}`);

  return await response.json();
};

const getMerchantInfo = async (provider: string, accessToken: string, clientId?: string, shopName?: string) => {
  let merchantId = '';
  let locationId = '';
  let storeId = '';

  try {
    switch (provider.toLowerCase()) {
      case 'square': {
        // Use sandbox URL if client ID contains 'sandbox'
        const isSandbox = clientId?.includes('sandbox');
        const baseUrl = isSandbox
          ? 'https://connect.squareupsandbox.com'
          : 'https://connect.squareup.com';

        const response = await fetch(`${baseUrl}/v2/merchants`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Square-Version': '2024-01-18',
          },
        });

        if (response.ok) {
          const data = await response.json();
          merchantId = data.merchant?.[0]?.id || '';

          // Get locations
          const locationsResponse = await fetch(`${baseUrl}/v2/locations`, {
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
        if (!shopName) {
          throw new Error('Shop name is required for Shopify');
        }
        const response = await fetch(`https://${shopName}/admin/api/2024-01/shop.json`, {
          headers: {
            'X-Shopify-Access-Token': accessToken,
          },
        });

        if (response.ok) {
          const data = await response.json();
          merchantId = data.shop?.id?.toString() || '';
          locationId = data.shop?.primary_location_id?.toString() || '';
          storeId = shopName; // Store the shop domain for webhook identification
        }
        break;
      }
      
      case 'clover': {
        const response = await fetch('https://sandbox.dev.clover.com/v3/merchants/me', {
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

      case 'lightspeed': {
        if (!shopName) break;

        const response = await fetch(`https://${shopName}.retail.lightspeed.app/api/1.0/account.json`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          merchantId = data.accountID || '';
          storeId = shopName; // Store domain prefix for future API calls
        }
        break;
      }
    }
  } catch (error) {
    console.error(`Error fetching merchant info for ${provider}:`, error);
  }

  return { merchantId, locationId, storeId };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const shop = url.searchParams.get('shop'); // Shopify shop domain
    const domainPrefix = url.searchParams.get('domain_prefix'); // Lightspeed domain prefix
    const error = url.searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:8080';
      return Response.redirect(`${frontendUrl}/merchant-dashboard?oauth_error=${error}`);
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

    // Get shop/domain name from callback params or metadata
    // Lightspeed sends domain_prefix, Shopify sends shop param
    const shopNameFromState = oauthState.metadata?.shop_name;
    const shopNameToUse = shop || domainPrefix || shopNameFromState;

    // Exchange code for tokens
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/pos-oauth-callback`;
    const tokenData = await exchangeCodeForToken(provider, code, redirectUri, shopNameToUse || undefined);

    // Get merchant/location info
    const clientId = provider === 'square' ? Deno.env.get('SQUARE_OAUTH_CLIENT_ID') : undefined;
    const { merchantId, locationId, storeId } = await getMerchantInfo(provider, tokenData.access_token, clientId, shopNameToUse || undefined);

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
        store_id: storeId || locationId || null, // Use storeId for Shopify (shop domain), locationId for others
        status: 'active',
        scopes: tokenData.scope?.split(' ') || [],
        token_expires_at: tokenData.expires_at || null,
      });

    if (integrationError) {
      console.error('Error storing integration:', integrationError);
      throw new Error('Failed to store integration');
    }

    // Update profile POS setup preference to 'completed'
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ pos_setup_preference: 'completed' })
      .eq('user_id', userId);

    if (profileError) {
      console.error('Error updating profile POS preference:', profileError);
      // Don't throw error - integration is already saved
    }

    // Register webhooks for Shopify
    if (provider.toLowerCase() === 'shopify' && shop) {
      try {
        await registerShopifyWebhook(shop, tokenData.access_token);
        console.log(`✅ Shopify webhook registered for shop: ${shop}`);
      } catch (webhookError) {
        console.error('⚠️ Warning: Failed to register webhook:', webhookError);
        // Don't fail the entire OAuth flow if webhook registration fails
      }
    }

    // Register webhooks for Lightspeed
    if (provider.toLowerCase() === 'lightspeed' && storeId) {
      try {
        await registerLightspeedWebhook(storeId, tokenData.access_token);
        console.log(`✅ Lightspeed webhook registered for store: ${storeId}`);
      } catch (webhookError) {
        console.error('⚠️ Warning: Failed to register Lightspeed webhook:', webhookError);
        // Don't fail the entire OAuth flow if webhook registration fails
      }
    }

    // Delete used state token
    await supabase
      .from('oauth_states')
      .delete()
      .eq('state_token', state);

    console.log(`OAuth callback successful for ${provider}, user: ${userId}`);

    // Redirect to merchant dashboard with success
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:8080';
    return Response.redirect(`${frontendUrl}/merchant-dashboard?oauth_success=true&provider=${provider}`);

  } catch (error: any) {
    console.error('Error in pos-oauth-callback:', error);
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:8080';
    return Response.redirect(`${frontendUrl}/merchant-dashboard?oauth_error=${encodeURIComponent(error.message)}`);
  }
});
