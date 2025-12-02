import { calculateTransactionSplit } from '../utils/split-calculator.ts';

/**
 * Handle Clover webhook events
 * Docs: https://docs.clover.com/docs/webhooks
 */
export async function handleCloverWebhook(
  payload: any,
  headers: any,
  supabase: any
): Promise<any> {
  console.log('🟫 Processing Clover webhook');

  // Clover uses verification token instead of HMAC
  const verificationToken = headers['x-clover-verification-token'];
  const expectedToken = Deno.env.get('CLOVER_WEBHOOK_VERIFICATION_TOKEN');
  
  if (expectedToken && verificationToken !== expectedToken) {
    console.error('❌ Invalid Clover verification token');
    return { success: false, error: 'Invalid verification token' };
  }

  // Handle payment created event
  if (payload.type === 'CREATE' && payload.objectType === 'PAYMENT') {
    const merchantId = payload.merchantId;
    
    // Get merchant integration
    const { data: integration } = await supabase
      .from('pos_integrations')
      .select('user_id, config, access_token')
      .eq('provider', 'clover')
      .eq('merchant_id', merchantId)
      .single();

    if (!integration) {
      console.error('❌ No integration found for merchant:', merchantId);
      return { success: false, error: 'Integration not found' };
    }

    // Fetch full payment details from Clover API
    const paymentId = payload.objectId;
    const paymentDetails = await fetchCloverPayment(
      merchantId,
      paymentId,
      integration.access_token
    );

    if (!paymentDetails) {
      return { success: false, error: 'Failed to fetch payment details' };
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from('pos_transactions')
      .select('id')
      .eq('pos_provider', 'clover')
      .eq('external_transaction_id', paymentId)
      .single();

    if (existing) {
      console.log('⚠️ Duplicate transaction, skipping');
      return { success: true, duplicate: true };
    }

    // Calculate barter split
    const totalAmount = paymentDetails.amount / 100; // Clover uses cents
    const barterConfig = integration.config?.barterPercentage || 25;
    
    const split = calculateTransactionSplit(
      totalAmount,
      barterConfig,
      paymentDetails.tipAmount / 100 || 0
    );

    // Insert transaction
    const { data: transaction, error } = await supabase
      .from('pos_transactions')
      .insert({
        merchant_id: integration.user_id,
        external_transaction_id: paymentId,
        pos_provider: 'clover',
        total_amount: totalAmount,
        currency: 'USD',
        tax_amount: paymentDetails.taxAmount / 100 || 0,
        tip_amount: paymentDetails.tipAmount / 100 || 0,
        barter_amount: split.barterAmount,
        barter_percentage: split.barterPercentage,
        cash_amount: split.cashAmount,
        card_amount: split.cardAmount,
        transaction_date: new Date(paymentDetails.createdTime).toISOString(),
        raw_webhook_data: payload,
        status: paymentDetails.result === 'SUCCESS' ? 'completed' : 'failed'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error inserting transaction:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Clover transaction processed:', transaction.id);
    return { success: true, transaction_id: transaction.id };
  }

  return { success: true, message: 'Event type not handled' };
}

/**
 * Fetch payment details from Clover API
 */
async function fetchCloverPayment(
  merchantId: string,
  paymentId: string,
  accessToken: string
): Promise<any> {
  try {
    const response = await fetch(
      `https://api.clover.com/v3/merchants/${merchantId}/payments/${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch Clover payment:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Clover payment:', error);
    return null;
  }
}
