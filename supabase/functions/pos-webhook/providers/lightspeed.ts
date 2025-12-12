import { calculateTransactionSplit } from '../utils/split-calculator.ts';
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

/**
 * Handle Lightspeed webhook events
 * Docs: https://x-series-api.lightspeedhq.com/docs/webhooks
 */
export async function handleLightspeedWebhook(
  payload: any,
  headers: any,
  supabase: any
): Promise<any> {
  console.log('🟦 Processing Lightspeed webhook');

  // Verify HMAC signature
  const signature = headers['x-signature'];
  if (signature) {
    const isValid = verifyLightspeedSignature(payload, signature);
    if (!isValid) {
      console.error('❌ Invalid Lightspeed webhook signature');
      return { success: false, error: 'Invalid signature' };
    }
  }

  // Parse form-encoded payload
  let saleData;
  if (typeof payload === 'string') {
    try {
      const parsed = new URLSearchParams(payload);
      saleData = JSON.parse(parsed.get('payload') || '{}');
    } catch (e) {
      console.error('Failed to parse payload:', e);
      return { success: false, error: 'Invalid payload format' };
    }
  } else if (payload.payload) {
    saleData = typeof payload.payload === 'string' ? JSON.parse(payload.payload) : payload.payload;
  } else {
    saleData = payload;
  }

  // Handle sale.update event
  if (saleData && saleData.saleID) {
    const saleId = saleData.saleID;
    const accountId = saleData.accountID;

    // Get merchant integration
    const { data: integration } = await supabase
      .from('pos_integrations')
      .select('user_id, config, access_token, store_id')
      .eq('provider', 'lightspeed')
      .eq('merchant_id', accountId)
      .single();

    if (!integration) {
      console.error('❌ No integration found for account:', accountId);
      return { success: false, error: 'Integration not found' };
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from('pos_transactions')
      .select('id')
      .eq('pos_provider', 'lightspeed')
      .eq('external_transaction_id', saleId.toString())
      .single();

    if (existing) {
      console.log('⚠️ Duplicate transaction, skipping');
      return { success: true, duplicate: true };
    }

    // Fetch full sale details from Lightspeed API
    const saleDetails = await fetchLightspeedSale(
      integration.store_id,
      saleId,
      integration.access_token
    );

    if (!saleDetails) {
      return { success: false, error: 'Failed to fetch sale details' };
    }

    // Calculate totals
    const totalAmount = parseFloat(saleDetails.total || '0');
    const taxAmount = parseFloat(saleDetails.totalTax || '0');
    const barterConfig = integration.config?.barterPercentage || 25;

    const split = calculateTransactionSplit(
      totalAmount,
      barterConfig,
      0 // No tip for now
    );

    // Insert transaction
    const { data: transaction, error } = await supabase
      .from('pos_transactions')
      .insert({
        merchant_id: integration.user_id,
        external_transaction_id: saleId.toString(),
        pos_provider: 'lightspeed',
        total_amount: totalAmount,
        currency: 'USD',
        tax_amount: taxAmount,
        tip_amount: 0,
        barter_amount: split.barterAmount,
        barter_percentage: split.barterPercentage,
        cash_amount: split.cashAmount,
        card_amount: split.cardAmount,
        transaction_date: saleDetails.createTime || new Date().toISOString(),
        raw_webhook_data: saleData,
        status: saleDetails.completed ? 'completed' : 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error inserting transaction:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Lightspeed transaction processed:', transaction.id);
    return { success: true, transaction_id: transaction.id };
  }

  return { success: true, message: 'Event type not handled' };
}

/**
 * Verify Lightspeed HMAC signature
 */
function verifyLightspeedSignature(payload: string, signatureHeader: string): boolean {
  try {
    const clientSecret = Deno.env.get('LIGHTSPEED_OAUTH_CLIENT_SECRET');
    if (!clientSecret) {
      console.error('Missing LIGHTSPEED_OAUTH_CLIENT_SECRET');
      return false;
    }

    // Parse signature header: signature=XXX,algorithm=HMAC-SHA256
    const parts = signatureHeader.split(',');
    const sigMap: Record<string, string> = {};
    parts.forEach(part => {
      const [key, value] = part.split('=');
      sigMap[key.trim()] = value.trim();
    });

    const providedSignature = sigMap['signature'];
    const algorithm = sigMap['algorithm'] || 'HMAC-SHA256';

    if (algorithm !== 'HMAC-SHA256') {
      console.error('Unsupported signature algorithm:', algorithm);
      return false;
    }

    // Compute HMAC
    const hmac = createHmac('sha256', clientSecret);
    hmac.update(payload);
    const computedSignature = hmac.digest('hex');

    return computedSignature === providedSignature;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Fetch sale details from Lightspeed API
 */
async function fetchLightspeedSale(
  storeId: string,
  saleId: number,
  accessToken: string
): Promise<any> {
  try {
    const response = await fetch(
      `https://${storeId}.retail.lightspeed.app/api/1.0/sale/${saleId}.json`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch Lightspeed sale:', response.status);
      return null;
    }

    const data = await response.json();
    return data.Sale;
  } catch (error) {
    console.error('Error fetching Lightspeed sale:', error);
    return null;
  }
}
