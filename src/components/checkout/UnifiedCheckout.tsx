import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ShoppingCart,
  User,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Scan,
  Plus,
  Minus,
  X,
  Search
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { getUserFriendlyError } from '@/utils/errorMessages';
import { CheckoutProgress, type CheckoutStep } from './CheckoutProgress';

interface Product {
  id: string;
  name: string;
  price: number;
  barcode?: string;
  sku?: string;
  category_name?: string;
  is_barter_eligible: boolean;
  restriction_reason?: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface Customer {
  id: string;
  full_name: string;
  available_credits: number;
}

type CheckoutMode = 'select' | 'regular' | 'barter_member' | 'complete';

const UnifiedCheckout = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { cart, addToCart: addToCartContext, removeFromCart, updateQuantity, clearCart } = useCart();

  // State
  const [mode, setMode] = useState<CheckoutMode>('select');
  const [products, setProducts] = useState<Product[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerCode, setCustomerCode] = useState('');
  const [barterPercentage, setBarterPercentage] = useState(30);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('validating');

  // Fetch merchant's barter percentage and products on mount
  useEffect(() => {
    if (user) {
      fetchMerchantSettings();
      fetchProducts();
    }
  }, [user]);

  const fetchMerchantSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('barter_percentage')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data && data.barter_percentage) {
        setBarterPercentage(data.barter_percentage);
      }
    } catch (err: any) {
      console.error('Error fetching merchant settings:', err);
    }
  };

  const fetchProducts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('products_with_eligibility')
        .select('*')
        .eq('merchant_id', user.id)
        .eq('sync_status', 'success')
        .order('name');

      if (error) throw error;

      setProducts(data || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive'
      });
    }
  };

  // Cart Management - using context
  const addToCart = (product: Product) => {
    addToCartContext(product);
  };

  // Calculate totals
  const calculateTotals = () => {
    const eligibleItems = cart.filter(item => item.is_barter_eligible);
    const restrictedItems = cart.filter(item => !item.is_barter_eligible);

    const eligibleSubtotal = eligibleItems.reduce(
      (sum, item) => sum + (item.price * item.quantity), 0
    );

    const restrictedSubtotal = restrictedItems.reduce(
      (sum, item) => sum + (item.price * item.quantity), 0
    );

    const totalSubtotal = eligibleSubtotal + restrictedSubtotal;

    // Apply barter percentage ONLY to eligible items
    const barterAmount = (eligibleSubtotal * barterPercentage) / 100;
    const cashForEligible = eligibleSubtotal - barterAmount;
    const totalCash = cashForEligible + restrictedSubtotal;

    // Tax only on cash portion (8.25% default)
    const taxRate = 8.25;
    const taxOnCash = totalCash * (taxRate / 100);

    const finalTotal = totalCash + taxOnCash;

    return {
      eligibleSubtotal,
      restrictedSubtotal,
      totalSubtotal,
      barterAmount,
      cashForEligible,
      totalCash,
      taxOnCash,
      finalTotal,
      taxRate
    };
  };

  // Mode 1: Regular Customer Checkout
  const processRegularCheckout = async () => {
    if (!user || cart.length === 0) return;

    setIsLoading(true);
    setError('');
    setCheckoutStep('validating');

    try {
      const totals = calculateTotals();

      // Step 1: Validating cart
      setCheckoutStep('checking_eligibility');

      // Determine POS provider from cart items
      const posIntegrationId = cart.find(item => (item as any).pos_integration_id)?.pos_integration_id;
      let posProvider = 'generic';

      if (posIntegrationId) {
        const { data: integration } = await supabase
          .from('pos_integrations')
          .select('provider')
          .eq('id', posIntegrationId)
          .single();

        if (integration) {
          posProvider = integration.provider;
        }
      }

      // Step 2: Processing payment
      setCheckoutStep('processing_payment');

      // Create transaction record and get ID
      const { data: txData, error: txError } = await supabase
        .from('pos_transactions')
        .insert({
          merchant_id: user.id,
          pos_provider: posProvider,
          pos_integration_id: posIntegrationId || null,
          external_transaction_id: `TEMP-${Date.now()}`,
          total_amount: totals.totalSubtotal,
          cash_amount: totals.totalCash,
          barter_amount: totals.barterAmount,
          barter_percentage: barterPercentage,
          tax_amount: totals.taxOnCash,
          currency: 'USD',
          status: 'completed',
          transaction_date: new Date().toISOString(),
          items: cart.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            barcode: item.barcode,
            sku: item.sku
          }))
        })
        .select()
        .single();

      if (txError) throw txError;

      // Credit merchant's barter balance
      const { error: creditError } = await supabase.rpc('credit_merchant_balance', {
        p_merchant_id: user.id,
        p_amount: totals.barterAmount
      });

      if (creditError) throw creditError;

      // Sync to POS system if products are from a POS integration
      if (posIntegrationId && txData) {
        // Step 3: Syncing to POS
        setCheckoutStep('syncing_pos');

        try {
          const syncResponse = await supabase.functions.invoke('pos-transaction-sync', {
            body: {
              transaction_id: txData.id,
              merchant_id: user.id,
              pos_integration_id: posIntegrationId,
              items: cart.map(item => ({
                product_id: item.id,
                external_product_id: (item as any).external_product_id || '',
                external_variant_id: (item as any).external_variant_id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                sku: item.sku,
                barcode: item.barcode,
              })),
              totals: {
                subtotal: totals.totalSubtotal,
                cash_amount: totals.totalCash,
                barter_amount: totals.barterAmount,
                tax_amount: totals.taxOnCash,
                total: totals.finalTotal,
              },
            },
          });

          if (syncResponse.data?.success) {
            console.log('✅ Transaction synced to POS:', syncResponse.data.provider);
          } else {
            console.error('⚠️ POS sync failed:', syncResponse.error);
            console.error('⚠️ Full response:', syncResponse);
          }
        } catch (syncError) {
          console.warn('⚠️ POS sync error:', syncError);
          // Don't fail the whole transaction if POS sync fails
        }
      }

      toast({
        title: 'Transaction Complete!',
        description: `Customer paid $${totals.finalTotal.toFixed(2)}. You earned $${totals.barterAmount.toFixed(2)} barter credits.`
      });

      setMode('complete');
    } catch (err: any) {
      console.error('Error processing regular checkout:', err);

      const friendlyError = getUserFriendlyError({
        error: err,
        context: 'checkout'
      });

      setError(friendlyError.description);
      toast({
        title: friendlyError.title,
        description: friendlyError.description,
        variant: friendlyError.variant
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mode 2: Scan Customer QR Code
  const scanCustomerCode = async () => {
    if (!customerCode) {
      setError('Please enter customer code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const customerId = customerCode.split('-')[0];

      // Fetch customer profile
      const { data: profileData, error: profileError } = await supabase
        .rpc('get_public_profile_info', { profile_user_id: customerId });

      if (profileError || !profileData || profileData.length === 0) {
        throw new Error('Customer not found');
      }

      // Fetch customer credits
      const { data: creditsData, error: creditsError } = await supabase
        .from('user_credits')
        .select('available_credits')
        .eq('user_id', customerId)
        .single();

      if (creditsError) throw new Error('Customer credits not found');

      setCustomer({
        id: profileData[0].id,
        full_name: profileData[0].full_name || 'Customer',
        available_credits: creditsData.available_credits || 0
      });

      setError('');
    } catch (err: any) {
      const friendlyError = getUserFriendlyError({
        error: err,
        context: 'checkout'
      });

      setError(friendlyError.description);
      toast({
        title: friendlyError.title,
        description: friendlyError.description,
        variant: friendlyError.variant
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mode 2: Barter Member Checkout
  const processBarterMemberCheckout = async () => {
    if (!user || !customer || cart.length === 0) return;

    setIsLoading(true);
    setError('');
    setCheckoutStep('validating');

    try {
      const totals = calculateTotals();

      // Step 1: Checking eligibility
      setCheckoutStep('checking_eligibility');

      // Validate sufficient balance
      if (customer.available_credits < totals.barterAmount) {
        throw new Error('Customer has insufficient barter credits');
      }

      // Determine POS provider from cart items
      const posIntegrationId = cart.find(item => (item as any).pos_integration_id)?.pos_integration_id;
      let posProvider = 'generic';

      if (posIntegrationId) {
        const { data: integration } = await supabase
          .from('pos_integrations')
          .select('provider')
          .eq('id', posIntegrationId)
          .single();

        if (integration) {
          posProvider = integration.provider;
        }
      }

      // Step 2: Processing payment
      setCheckoutStep('processing_payment');

      // Debit customer's balance
      const { error: debitError } = await supabase.rpc('debit_user_credits', {
        p_user_id: customer.id,
        p_amount: totals.barterAmount
      });

      if (debitError) throw debitError;

      // Credit merchant's balance
      const { error: creditError } = await supabase.rpc('credit_merchant_balance', {
        p_merchant_id: user.id,
        p_amount: totals.barterAmount
      });

      if (creditError) throw creditError;

      // Create transaction record and get ID
      const { data: txData, error: txError } = await supabase
        .from('pos_transactions')
        .insert({
          merchant_id: user.id,
          pos_provider: posProvider,
          pos_integration_id: posIntegrationId || null,
          external_transaction_id: `TEMP-BARTER-${Date.now()}`,
          total_amount: totals.totalSubtotal,
          cash_amount: totals.totalCash,
          barter_amount: totals.barterAmount,
          barter_percentage: barterPercentage,
          tax_amount: totals.taxOnCash,
          currency: 'USD',
          status: 'completed',
          transaction_date: new Date().toISOString(),
          customer_info: {
            id: customer.id,
            name: customer.full_name
          },
          items: cart.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            barcode: item.barcode,
            sku: item.sku
          }))
        })
        .select()
        .single();

      if (txError) throw txError;

      // Sync to POS system if products are from a POS integration
      if (posIntegrationId && txData) {
        // Step 3: Syncing to POS
        setCheckoutStep('syncing_pos');

        try {
          const syncResponse = await supabase.functions.invoke('pos-transaction-sync', {
            body: {
              transaction_id: txData.id,
              merchant_id: user.id,
              pos_integration_id: posIntegrationId,
              items: cart.map(item => ({
                product_id: item.id,
                external_product_id: (item as any).external_product_id || '',
                external_variant_id: (item as any).external_variant_id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                sku: item.sku,
                barcode: item.barcode,
              })),
              totals: {
                subtotal: totals.totalSubtotal,
                cash_amount: totals.totalCash,
                barter_amount: totals.barterAmount,
                tax_amount: totals.taxOnCash,
                total: totals.finalTotal,
              },
              customer_info: {
                id: customer.id,
                name: customer.full_name,
              },
            },
          });

          if (syncResponse.data?.success) {
            console.log('✅ Transaction synced to POS:', syncResponse.data.provider);
            toast({
              title: 'Synced to POS',
              description: `Transaction appears in ${syncResponse.data.provider} dashboard`,
            });
          } else {
            console.warn('⚠️ POS sync failed:', syncResponse.error);
          }
        } catch (syncError) {
          console.warn('⚠️ POS sync error:', syncError);
          // Don't fail the whole transaction if POS sync fails
        }
      }

      toast({
        title: 'Transaction Complete!',
        description: `${customer.full_name} paid $${totals.finalTotal.toFixed(2)} cash + $${totals.barterAmount.toFixed(2)} barter credits.`
      });

      setMode('complete');
    } catch (err: any) {
      console.error('Error processing barter member checkout:', err);

      const friendlyError = getUserFriendlyError({
        error: err,
        context: 'checkout'
      });

      setError(friendlyError.description);
      toast({
        title: friendlyError.title,
        description: friendlyError.description,
        variant: friendlyError.variant
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetCheckout = () => {
    setMode('select');
    clearCart();
    setCustomer(null);
    setCustomerCode('');
    setError('');
    setSearchTerm('');
  };

  const totals = calculateTotals();

  // Filter products by search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.barcode && product.barcode.includes(searchTerm))
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            Unified Checkout
            {mode !== 'select' && mode !== 'complete' && (
              <Badge variant="outline" className="ml-2">
                {mode === 'regular' && 'Regular Customer'}
                {mode === 'barter_member' && 'Barter Member'}
              </Badge>
            )}
          </CardTitle>
          <div className="text-sm text-gray-600">
            Your barter percentage: <span className="font-bold text-blue-600">{barterPercentage}%</span>
            {' '}(Applied automatically to eligible items)
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Product Selection */}
      {mode === 'select' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Available Products ({filteredProducts.length})</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, SKU, or barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {products.length === 0
                        ? 'No products synced. Please sync products from your POS system.'
                        : 'No products found matching your search.'}
                    </p>
                  </div>
                ) : (
                  filteredProducts.map(product => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-600">${product.price.toFixed(2)}</div>
                        {product.sku && (
                          <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                        )}
                        {!product.is_barter_eligible && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            Cash Only {product.restriction_reason && `- ${product.restriction_reason}`}
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addToCart(product)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Cart ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">Cart is empty</p>
                  <p className="text-gray-400 text-xs mt-1">Add products to get started</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center gap-2 p-2 border rounded-lg bg-white">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{item.name}</div>
                          <div className="text-xs text-gray-600">${item.price.toFixed(2)} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Summary */}
                  <div className="border-t pt-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span className="font-medium">${totals.totalSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Barter ({barterPercentage}%):</span>
                      <span className="font-medium">-${totals.barterAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Checkout Mode Selection */}
                  <div className="border-t pt-4 space-y-3">
                    <div className="text-sm font-medium text-gray-700">Choose Checkout Mode:</div>
                    <div className="space-y-2">
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => setMode('regular')}
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Regular Customer
                      </Button>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => setMode('barter_member')}
                      >
                        <Scan className="w-4 h-4 mr-2" />
                        Barter Member
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2a: Regular Customer Checkout */}
      {mode === 'regular' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Regular Customer Checkout
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cart Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium mb-3">Cart Items:</div>
              <div className="space-y-1 mb-3">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-2 border border-blue-200">
              <div className="text-sm font-semibold text-blue-900 mb-2">Payment Breakdown</div>

              {totals.eligibleSubtotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Eligible Items:</span>
                  <span className="text-green-700 font-medium">${totals.eligibleSubtotal.toFixed(2)}</span>
                </div>
              )}

              {totals.restrictedSubtotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-red-700">Restricted Items (Cash Only):</span>
                  <span className="text-red-700 font-medium">${totals.restrictedSubtotal.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between border-t border-blue-300 pt-2">
                <span className="font-medium">Total Subtotal:</span>
                <span className="font-medium">${totals.totalSubtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-green-600 font-medium">
                <span>Barter Discount ({barterPercentage}%):</span>
                <span>-${totals.barterAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between border-t border-blue-300 pt-2">
                <span>Cash Subtotal:</span>
                <span>${totals.totalCash.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>Tax ({totals.taxRate}% on cash only):</span>
                <span>${totals.taxOnCash.toFixed(2)}</span>
              </div>

              <div className="flex justify-between font-bold text-lg border-t-2 border-blue-400 pt-2 mt-2">
                <span className="text-blue-900">Cash to Collect:</span>
                <span className="text-blue-600">${totals.finalTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm text-green-600 border-t border-blue-300 pt-2 mt-2">
                <span>You Earn:</span>
                <span className="font-semibold">+${totals.barterAmount.toFixed(2)} barter credits</span>
              </div>
            </div>

            {isLoading && (
              <CheckoutProgress currentStep={checkoutStep} className="mb-4" />
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setMode('select')} disabled={isLoading}>
                Back to Cart
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={processRegularCheckout}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : `Complete Sale - Collect $${totals.finalTotal.toFixed(2)}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2b: Barter Member - Scan Code */}
      {mode === 'barter_member' && !customer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="w-5 h-5 text-blue-600" />
              Scan Barter Member Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <Scan className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Have the customer show their barter QR code</p>
            </div>

            <div>
              <Label>Customer Code</Label>
              <Input
                value={customerCode}
                onChange={(e) => setCustomerCode(e.target.value)}
                placeholder="Scan or enter customer code (e.g., USER123-ABC)"
                className="text-center text-lg"
                onKeyPress={(e) => e.key === 'Enter' && scanCustomerCode()}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setMode('select')} disabled={isLoading}>
                Back to Cart
              </Button>
              <Button
                className="flex-1"
                onClick={scanCustomerCode}
                disabled={isLoading || !customerCode}
              >
                {isLoading ? 'Looking up...' : 'Continue'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2b: Barter Member Checkout */}
      {mode === 'barter_member' && customer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              Barter Member Checkout
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Info */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-900">{customer.full_name}</span>
              </div>
              <div className="text-sm text-purple-700">
                Available Credits: <span className="font-bold">${customer.available_credits.toFixed(2)}</span>
              </div>
            </div>

            {/* Cart Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium mb-3">Cart Items:</div>
              <div className="space-y-1 mb-3">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-2 border border-blue-200">
              <div className="text-sm font-semibold text-blue-900 mb-2">Payment Breakdown</div>

              {totals.eligibleSubtotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Eligible Items:</span>
                  <span className="text-green-700 font-medium">${totals.eligibleSubtotal.toFixed(2)}</span>
                </div>
              )}

              {totals.restrictedSubtotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-red-700">Restricted Items (Cash Only):</span>
                  <span className="text-red-700 font-medium">${totals.restrictedSubtotal.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between border-t border-blue-300 pt-2">
                <span className="font-medium">Total Subtotal:</span>
                <span className="font-medium">${totals.totalSubtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-purple-600 font-medium">
                <span>Barter Credits ({barterPercentage}%):</span>
                <span>-${totals.barterAmount.toFixed(2)} (from customer balance)</span>
              </div>

              <div className="flex justify-between border-t border-blue-300 pt-2">
                <span>Cash Subtotal:</span>
                <span>${totals.totalCash.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>Tax ({totals.taxRate}% on cash only):</span>
                <span>${totals.taxOnCash.toFixed(2)}</span>
              </div>

              <div className="flex justify-between font-bold text-lg border-t-2 border-blue-400 pt-2 mt-2">
                <span className="text-blue-900">Cash to Collect:</span>
                <span className="text-blue-600">${totals.finalTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm text-purple-600 border-t border-blue-300 pt-2 mt-2">
                <span>Customer Remaining Balance:</span>
                <span className="font-semibold">${(customer.available_credits - totals.barterAmount).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm text-green-600">
                <span>You Earn:</span>
                <span className="font-semibold">+${totals.barterAmount.toFixed(2)} barter credits</span>
              </div>
            </div>

            {totals.barterAmount > customer.available_credits && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  <strong>Insufficient Credits!</strong><br />
                  Required: ${totals.barterAmount.toFixed(2)}, Available: ${customer.available_credits.toFixed(2)}<br />
                  Customer needs ${(totals.barterAmount - customer.available_credits).toFixed(2)} more credits.
                </AlertDescription>
              </Alert>
            )}

            {isLoading && (
              <CheckoutProgress currentStep={checkoutStep} className="mb-4" />
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setCustomer(null);
                  setCustomerCode('');
                }}
                disabled={isLoading}
              >
                Change Customer
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={processBarterMemberCheckout}
                disabled={isLoading || totals.barterAmount > customer.available_credits}
              >
                {isLoading ? 'Processing...' : `Complete Sale - Collect $${totals.finalTotal.toFixed(2)}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Complete */}
      {mode === 'complete' && (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="w-20 h-20 mx-auto text-green-600 mb-4" />
            <h3 className="text-2xl font-bold text-green-800 mb-2">Transaction Complete!</h3>
            <p className="text-gray-600 mb-2">Payment has been processed successfully.</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto mb-6">
              <div className="text-sm text-green-800">
                <div className="font-semibold mb-2">Transaction Summary:</div>
                <div className="flex justify-between">
                  <span>Cash Collected:</span>
                  <span className="font-bold">${totals.finalTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Barter Credits Earned:</span>
                  <span className="font-bold text-green-600">+${totals.barterAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <Button onClick={resetCheckout} size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Start New Transaction
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UnifiedCheckout;
