import { supabase } from '@/integrations/supabase/client';
import { POSTransaction } from './posIntegration';

/**
 * Represents a single product in the checkout with eligibility status
 */
export interface ProductEligibility {
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
  isBarterEligible: boolean;
  restrictionReason?: string;
  categoryName?: string;
  barcode?: string;
  sku?: string;
  productId?: string;
}

/**
 * Split checkout items into eligible vs restricted
 */
export interface CheckoutSplit {
  eligibleItems: ProductEligibility[];
  restrictedItems: ProductEligibility[];
  eligibleSubtotal: number;
  restrictedSubtotal: number;
  totalSubtotal: number;
  hasRestrictedItems: boolean;
}

/**
 * Enhanced payment calculation with product-level eligibility
 */
export interface EnhancedBarterPayment {
  // Items breakdown
  eligibleSubtotal: number;
  restrictedSubtotal: number;
  totalSubtotal: number;

  // Barter calculation (only on eligible items)
  barterAmount: number;
  barterPercentage: number;
  maxBarterAmount: number;

  // Cash calculation
  cashForEligibleItems: number; // Eligible items after barter deduction
  cashForRestrictedItems: number; // All restricted items (100% cash)
  totalCashSubtotal: number;

  // Tax (only on cash portions)
  taxOnCash: number;
  taxRate: number;

  // Final totals
  finalTotal: number;
  barterCreditsRemaining: number;

  // Detailed breakdown
  eligibleItems: ProductEligibility[];
  restrictedItems: ProductEligibility[];
}

/**
 * Match POS transaction items with synced products in database
 *
 * How it works:
 * 1. For each item in POS transaction, search database by barcode/UPC
 * 2. Check product's barter_enabled and is_barter_eligible flags
 * 3. If restricted (alcohol, tobacco, etc.), add to restrictedItems
 * 4. If eligible, add to eligibleItems
 * 5. Calculate subtotals for each group
 *
 * @param posTransaction - Transaction from POS system (Square, Shopify, etc.)
 * @param merchantId - Current merchant's user ID
 * @returns CheckoutSplit with items separated by eligibility
 */
export async function matchProductsWithPOSItems(
  posTransaction: POSTransaction,
  merchantId: string
): Promise<CheckoutSplit> {
  const eligibleItems: ProductEligibility[] = [];
  const restrictedItems: ProductEligibility[] = [];

  console.log('🔍 Matching POS items with database products...');
  console.log(`📦 Total items to process: ${posTransaction.items.length}`);

  for (const item of posTransaction.items) {
    try {
      console.log(`\n🔎 Processing item: ${item.name} (barcode: ${item.barcode})`);

      // Try to find product in database by barcode or UPC
      if (item.barcode) {
        const { data: products, error } = await supabase
          .from('products_with_eligibility')
          .select('*')
          .eq('merchant_id', merchantId)
          .or(`barcode.eq.${item.barcode},upc.eq.${item.barcode}`)
          .limit(1);

        if (error) {
          console.error('❌ Database error:', error);
          throw error;
        }

        if (products && products.length > 0) {
          const dbProduct = products[0];
          console.log(`✅ Found product in database: ${dbProduct.name}`);
          console.log(`   Category: ${dbProduct.category_name}`);
          console.log(`   Barter enabled: ${dbProduct.barter_enabled}`);
          console.log(`   Is restricted: ${dbProduct.category_is_restricted}`);

          const productEligibility = createProductEligibility(item, dbProduct);

          // Check if product is eligible for barter
          if (dbProduct.is_barter_eligible && dbProduct.barter_enabled) {
            console.log(`   ✅ ELIGIBLE for barter`);
            eligibleItems.push(productEligibility);
          } else {
            console.log(`   ❌ RESTRICTED - cannot use barter`);
            restrictedItems.push({
              ...productEligibility,
              restrictionReason: dbProduct.restriction_reason ||
                               (dbProduct.category_is_restricted
                                 ? `Restricted category: ${dbProduct.category_name}`
                                 : 'Barter disabled for this product')
            });
          }
          continue;
        }
      }

      // Product not found in database - default to eligible (fail-safe)
      console.warn(`⚠️ Product not found in database: ${item.name}`);
      console.log(`   Defaulting to ELIGIBLE (fail-safe mode)`);
      eligibleItems.push({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        totalPrice: item.price * item.quantity,
        isBarterEligible: true,
        barcode: item.barcode,
        categoryName: item.category
      });

    } catch (error) {
      console.error(`❌ Error matching product ${item.name}:`, error);
      // On error, default to eligible (fail-open for better UX)
      eligibleItems.push({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        totalPrice: item.price * item.quantity,
        isBarterEligible: true,
        barcode: item.barcode,
        categoryName: item.category
      });
    }
  }

  const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const restrictedSubtotal = restrictedItems.reduce((sum, item) => sum + item.totalPrice, 0);

  console.log('\n📊 Checkout Split Summary:');
  console.log(`   ✅ Eligible items: ${eligibleItems.length} ($${eligibleSubtotal.toFixed(2)})`);
  console.log(`   ❌ Restricted items: ${restrictedItems.length} ($${restrictedSubtotal.toFixed(2)})`);
  console.log(`   💰 Total: $${(eligibleSubtotal + restrictedSubtotal).toFixed(2)}`);

  return {
    eligibleItems,
    restrictedItems,
    eligibleSubtotal,
    restrictedSubtotal,
    totalSubtotal: eligibleSubtotal + restrictedSubtotal,
    hasRestrictedItems: restrictedItems.length > 0
  };
}

/**
 * Create ProductEligibility object from POS item and database product
 */
function createProductEligibility(
  posItem: POSTransaction['items'][0],
  dbProduct: any
): ProductEligibility {
  return {
    name: dbProduct.name || posItem.name,
    price: posItem.price,
    quantity: posItem.quantity,
    totalPrice: posItem.price * posItem.quantity,
    isBarterEligible: dbProduct.is_barter_eligible && dbProduct.barter_enabled,
    categoryName: dbProduct.category_name,
    barcode: posItem.barcode,
    sku: dbProduct.sku,
    productId: dbProduct.id
  };
}

/**
 * Enhanced barter payment calculation that respects product eligibility
 *
 * KEY DIFFERENCE FROM OLD VERSION:
 * - OLD: Applied barter percentage to entire transaction
 * - NEW: Only applies barter to eligible items, restricted items are 100% cash
 *
 * Example:
 * - $50 eligible items (coffee, food)
 * - $20 restricted items (alcohol)
 * - 50% barter selected
 * - Result: $25 barter on eligible, $25 cash on eligible, $20 cash on restricted
 * - Total: $25 barter + $45 cash + tax on $45
 *
 * @param checkoutSplit - Items split by eligibility
 * @param barterPercentage - Percentage to apply (0-100)
 * @param availableBarterCredits - Customer's available credits
 * @param taxRate - Tax rate percentage (e.g., 8.25)
 */
export function calculateEnhancedBarterPayment(
  checkoutSplit: CheckoutSplit,
  barterPercentage: number,
  availableBarterCredits: number,
  taxRate: number
): EnhancedBarterPayment {
  console.log('\n💰 Calculating Enhanced Barter Payment...');
  console.log(`   Barter percentage: ${barterPercentage}%`);
  console.log(`   Available credits: $${availableBarterCredits.toFixed(2)}`);
  console.log(`   Tax rate: ${taxRate}%`);

  // Calculate maximum barter amount from eligible items only
  const maxBarterFromEligible = Math.min(
    availableBarterCredits,
    checkoutSplit.eligibleSubtotal
  );

  // Calculate actual barter amount based on percentage
  const barterAmount = Math.min(
    maxBarterFromEligible,
    (checkoutSplit.eligibleSubtotal * barterPercentage) / 100
  );

  // Calculate cash portions
  const cashForEligibleItems = checkoutSplit.eligibleSubtotal - barterAmount;
  const cashForRestrictedItems = checkoutSplit.restrictedSubtotal;
  const totalCashSubtotal = cashForEligibleItems + cashForRestrictedItems;

  // Tax only applies to cash portion (NOT on barter portion)
  const taxOnCash = totalCashSubtotal * (taxRate / 100);

  // Final total
  const finalTotal = totalCashSubtotal + taxOnCash;

  console.log('\n📊 Payment Breakdown:');
  console.log(`   Eligible items subtotal: $${checkoutSplit.eligibleSubtotal.toFixed(2)}`);
  console.log(`   Restricted items subtotal: $${checkoutSplit.restrictedSubtotal.toFixed(2)}`);
  console.log(`   ─────────────────────────`);
  console.log(`   Barter amount: -$${barterAmount.toFixed(2)} (from eligible items)`);
  console.log(`   Cash for eligible items: $${cashForEligibleItems.toFixed(2)}`);
  console.log(`   Cash for restricted items: $${cashForRestrictedItems.toFixed(2)}`);
  console.log(`   Total cash subtotal: $${totalCashSubtotal.toFixed(2)}`);
  console.log(`   Tax on cash: $${taxOnCash.toFixed(2)}`);
  console.log(`   ─────────────────────────`);
  console.log(`   FINAL TOTAL: $${finalTotal.toFixed(2)}`);

  return {
    eligibleSubtotal: checkoutSplit.eligibleSubtotal,
    restrictedSubtotal: checkoutSplit.restrictedSubtotal,
    totalSubtotal: checkoutSplit.totalSubtotal,

    barterAmount,
    barterPercentage,
    maxBarterAmount: maxBarterFromEligible,

    cashForEligibleItems,
    cashForRestrictedItems,
    totalCashSubtotal,

    taxOnCash,
    taxRate,

    finalTotal,
    barterCreditsRemaining: availableBarterCredits - barterAmount,

    eligibleItems: checkoutSplit.eligibleItems,
    restrictedItems: checkoutSplit.restrictedItems
  };
}

/**
 * Validate that checkout doesn't violate barter rules
 * Returns errors and warnings to display to user
 */
export function validateCheckout(payment: EnhancedBarterPayment): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if trying to apply barter to restricted items (should never happen)
  if (payment.restrictedItems.length > 0 && payment.barterAmount > payment.eligibleSubtotal) {
    errors.push('Cannot apply barter credits to restricted items');
  }

  // Warn about restricted items
  if (payment.restrictedItems.length > 0) {
    const restrictedCount = payment.restrictedItems.length;
    const restrictedTotal = payment.restrictedSubtotal.toFixed(2);
    warnings.push(
      `${restrictedCount} restricted item(s) totaling $${restrictedTotal} must be paid in cash only`
    );
  }

  // Check sufficient barter credits
  if (payment.barterAmount > payment.maxBarterAmount) {
    errors.push('Insufficient barter credits available');
  }

  console.log('\n✅ Validation Results:');
  console.log(`   Valid: ${errors.length === 0}`);
  if (errors.length > 0) {
    console.log(`   ❌ Errors: ${errors.join(', ')}`);
  }
  if (warnings.length > 0) {
    console.log(`   ⚠️ Warnings: ${warnings.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
