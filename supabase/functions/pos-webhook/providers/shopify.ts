import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";
import { calculateTransactionSplit } from '../utils/split-calculator.ts';

/**
 * Handle Shopify POS webhook events
 * Docs: https://shopify.dev/docs/api/admin-rest/2023-10/resources/webhook
 */
export async function handleShopifyWebhook(
  payload: any,
  headers: any,
  supabase: any
): Promise<any> {
  console.log('🟩 Processing Shopify webhook');

  // Verify webhook signature
  const signature = headers['x-shopify-hmac-sha256'];
  const webhookSecret = Deno.env.get('SHOPIFY_WEBHOOK_SECRET');
  
  if (webhookSecret && signature) {
    const isValid = verifyShopifySignature(
      JSON.stringify(payload),
      signature,
      webhookSecret
    );
    
    if (!isValid) {
      console.error('❌ Invalid Shopify signature');
      return { success: false, error: 'Invalid signature' };
    }
  }

  // Handle order created/updated event
  if (payload.id && payload.total_price) {
    // Get merchant by shop domain
    const shopDomain = headers['x-shopify-shop-domain'];
    
    const { data: integration } = await supabase
      .from('pos_integrations')
      .select('user_id, config')
      .eq('provider', 'shopify')
      .eq('store_id', shopDomain)
      .single();

    if (!integration) {
      console.error('❌ No integration found for shop:', shopDomain);
      return { success: false, error: 'Integration not found' };
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from('pos_transactions')
      .select('id')
      .eq('pos_provider', 'shopify')
      .eq('external_transaction_id', payload.id.toString())
      .single();

    if (existing) {
      console.log('⚠️ Duplicate transaction, skipping');
      return { success: true, duplicate: true };
    }

    // Calculate barter split
    const totalAmount = parseFloat(payload.total_price);
    const barterConfig = integration.config?.barterPercentage || 25;
    
    const split = calculateTransactionSplit(
      totalAmount,
      barterConfig,
      parseFloat(payload.total_tip_received || 0)
    );

    // Parse line items
    const items = payload.line_items?.map((item: any) => ({
      name: item.title,
      quantity: item.quantity,
      price: parseFloat(item.price),
      sku: item.sku
    })) || [];

    // Insert transaction
    const { data: transaction, error } = await supabase
      .from('pos_transactions')
      .insert({
        merchant_id: integration.user_id,
        external_transaction_id: payload.id.toString(),
        pos_provider: 'shopify',
        total_amount: totalAmount,
        currency: payload.currency || 'USD',
        tax_amount: parseFloat(payload.total_tax || 0),
        tip_amount: parseFloat(payload.total_tip_received || 0),
        discount_amount: parseFloat(payload.total_discounts || 0),
        barter_amount: split.barterAmount,
        barter_percentage: split.barterPercentage,
        cash_amount: split.cashAmount,
        card_amount: split.cardAmount,
        items: items,
        customer_info: payload.customer ? {
          id: payload.customer.id,
          email: payload.customer.email,
          name: `${payload.customer.first_name} ${payload.customer.last_name}`
        } : null,
        location_id: payload.location_id?.toString(),
        transaction_date: payload.created_at,
        webhook_signature: signature,
        raw_webhook_data: payload,
        status: payload.financial_status === 'paid' ? 'completed' : 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error inserting transaction:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Shopify transaction processed:', transaction.id);
    return { success: true, transaction_id: transaction.id };
  }

  return { success: true, message: 'Event type not handled' };
}

/**
 * Verify Shopify webhook signature
 */
function verifyShopifySignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const hmac = createHmac('sha256', secret);
  hmac.update(body);
  const expectedSignature = hmac.digest('base64');
  
  return signature === expectedSignature;
}
