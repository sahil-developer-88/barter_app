
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, ShoppingCart, CreditCard, DollarSign, CheckCircle, AlertCircle, Scan, AlertTriangle } from 'lucide-react';
import { shiftPOSTransaction, type POSTransaction } from '@/utils/posIntegration';
import { useCheckoutEligibility } from '@/hooks/useCheckoutEligibility';

interface Customer {
  id: string;
  name: string;
  barterBalance: number;
  qrCode: string;
}

const StreamlinedCheckout = () => {
  const [currentStep, setCurrentStep] = useState<'scan' | 'review' | 'process' | 'complete'>('scan');
  const [customerCode, setCustomerCode] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [posTransaction, setPosTransaction] = useState<POSTransaction | null>(null);
  const [barterPercentage, setBarterPercentage] = useState(25);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  
  // Mock POS transaction (in real implementation, this would come from actual POS)
  const mockPOSTransaction: POSTransaction = {
    id: `pos_${Date.now()}`,
    items: [
      { barcode: '123456789', name: 'Organic Coffee Beans', price: 12.99, quantity: 1, category: 'Food & Beverages' },
      { barcode: '987654321', name: 'Almond Milk', price: 4.49, quantity: 2, category: 'Food & Beverages' },
    ],
    subtotal: 21.97,
    tax: 1.76,
    taxRate: 8.25,
    timestamp: new Date().toISOString(),
    storeId: 'STORE001',
    cashierInfo: 'Register 2 - Alice'
  };

  const handleCustomerScan = async () => {
    if (!customerCode) {
      setError('Please scan or enter customer code');
      return;
    }

    try {
      // Simulate customer lookup
      const mockCustomer: Customer = {
        id: customerCode.split('-')[0] || customerCode,
        name: 'John Smith',
        barterBalance: 150.75,
        qrCode: customerCode
      };

      setCustomer(mockCustomer);
      setPosTransaction(mockPOSTransaction);
      setCurrentStep('review');
      setError('');
    } catch (error) {
      setError('Customer not found. Please verify the code.');
    }
  };

  const handleShiftTransaction = async () => {
    if (!customer || !posTransaction) return;

    setIsProcessing(true);
    setCurrentStep('process');

    try {
      const result = await shiftPOSTransaction(
        posTransaction.id,
        customer.id,
        barterPercentage
      );

      if (result.success) {
        setTimeout(() => {
          setCurrentStep('complete');
          setIsProcessing(false);
        }, 2000);
      } else {
        setError(result.error || 'Transaction failed');
        setIsProcessing(false);
        setCurrentStep('review');
      }
    } catch (error) {
      setError('Failed to process transaction');
      setIsProcessing(false);
      setCurrentStep('review');
    }
  };

  const resetFlow = () => {
    setCurrentStep('scan');
    setCustomerCode('');
    setCustomer(null);
    setPosTransaction(null);
    setError('');
  };

  // Use new checkout eligibility hook with product-level checking
  const {
    checkoutSplit,
    payment,
    validation,
    isLoading: isCheckingProducts
  } = useCheckoutEligibility(
    posTransaction,
    barterPercentage,
    customer?.barterBalance || 0,
    posTransaction?.taxRate || 8.25
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            Barter Exchange Checkout
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            {['scan', 'review', 'process', 'complete'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep === step ? 'bg-blue-600 text-white' : 
                    ['review', 'process', 'complete'].includes(currentStep) && index < 2 ? 'bg-green-600 text-white' :
                    currentStep === 'complete' && index < 4 ? 'bg-green-600 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                {index < 3 && <ArrowRight className="w-4 h-4 mx-2 text-gray-400" />}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {currentStep === 'scan' && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Scan className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Scan Customer Code</h3>
                <p className="text-gray-600">Have the customer show their barter QR code or enter their customer ID</p>
              </div>
              
              <div>
                <Label htmlFor="customer-code">Customer Code</Label>
                <Input
                  id="customer-code"
                  value={customerCode}
                  onChange={(e) => setCustomerCode(e.target.value)}
                  placeholder="Scan QR code or enter customer ID"
                  className="text-center text-lg"
                />
              </div>
              
              <Button 
                onClick={handleCustomerScan}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!customerCode}
              >
                Continue to Checkout
              </Button>
            </div>
          )}

          {currentStep === 'review' && customer && posTransaction && payment && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">Customer Information</h3>
                <p className="text-blue-700">{customer.name}</p>
                <p className="text-sm text-blue-600">Available Balance: ${customer.barterBalance.toFixed(2)}</p>
              </div>

              {/* Validation Warnings */}
              {validation?.warnings && validation.warnings.length > 0 && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    {validation.warnings.map((warning, index) => (
                      <div key={index}>{warning}</div>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              {/* Validation Errors */}
              {validation?.errors && validation.errors.length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {validation.errors.map((err, index) => (
                      <div key={index}>{err}</div>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              {/* Barter-Eligible Items */}
              {payment.eligibleItems.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Barter-Eligible Items
                    </h3>
                    <Badge variant="default" className="bg-green-600">
                      ${payment.eligibleSubtotal.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {payment.eligibleItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-gray-600 ml-2">×{item.quantity}</span>
                          {item.categoryName && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {item.categoryName}
                            </Badge>
                          )}
                        </div>
                        <span className="font-medium">${item.totalPrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Restricted Items */}
              {payment.restrictedItems.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      Restricted Items (Cash Only)
                    </h3>
                    <Badge variant="destructive">
                      ${payment.restrictedSubtotal.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {payment.restrictedItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-start p-2 bg-red-50 rounded border border-red-200">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-sm text-gray-600">×{item.quantity}</span>
                          </div>
                          {item.restrictionReason && (
                            <p className="text-xs text-red-700 mt-1">
                              ⚠️ {item.restrictionReason}
                            </p>
                          )}
                          {item.categoryName && (
                            <Badge variant="outline" className="mt-1 text-xs border-red-300 text-red-700">
                              {item.categoryName}
                            </Badge>
                          )}
                        </div>
                        <span className="font-medium">${item.totalPrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Barter Percentage Slider */}
              <div>
                <Label>
                  Barter Percentage: {barterPercentage}%
                  {payment.eligibleSubtotal > 0 && (
                    <span className="text-sm text-gray-600 ml-2">
                      (Applied to ${payment.eligibleSubtotal.toFixed(2)} eligible items)
                    </span>
                  )}
                </Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={barterPercentage}
                  onChange={(e) => setBarterPercentage(parseInt(e.target.value))}
                  className="w-full mt-2"
                  disabled={payment.eligibleSubtotal === 0}
                />
                {payment.eligibleSubtotal === 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    All items are restricted - barter cannot be applied
                  </p>
                )}
              </div>

              {/* Enhanced Payment Breakdown */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="text-sm font-semibold text-gray-700 mb-2">Payment Breakdown</div>

                {/* Eligible Items Subtotal */}
                {payment.eligibleSubtotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Eligible Items:</span>
                    <span className="text-green-700">${payment.eligibleSubtotal.toFixed(2)}</span>
                  </div>
                )}

                {/* Restricted Items Subtotal */}
                {payment.restrictedSubtotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-700">Restricted Items (Cash Only):</span>
                    <span className="text-red-700">${payment.restrictedSubtotal.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between border-t pt-2">
                  <span>Total Subtotal:</span>
                  <span>${payment.totalSubtotal.toFixed(2)}</span>
                </div>

                {/* Barter Credits Applied */}
                {payment.barterAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Barter Credits Applied:</span>
                    <span>-${payment.barterAmount.toFixed(2)}</span>
                  </div>
                )}

                {/* Cash Breakdown */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cash for Eligible Items:</span>
                  <span className="text-gray-600">${payment.cashForEligibleItems.toFixed(2)}</span>
                </div>
                {payment.restrictedSubtotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cash for Restricted Items:</span>
                    <span className="text-gray-600">${payment.cashForRestrictedItems.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between border-t pt-2">
                  <span>Total Cash Subtotal:</span>
                  <span>${payment.totalCashSubtotal.toFixed(2)}</span>
                </div>

                {/* Tax (only on cash portion) */}
                <div className="flex justify-between">
                  <span>Tax ({payment.taxRate}% on cash only):</span>
                  <span>${payment.taxOnCash.toFixed(2)}</span>
                </div>

                {/* Final Total */}
                <div className="flex justify-between font-bold text-lg border-t-2 pt-2 mt-2">
                  <span>Total Due:</span>
                  <span>${payment.finalTotal.toFixed(2)}</span>
                </div>

                {/* Credits Remaining */}
                {payment.barterAmount > 0 && (
                  <div className="flex justify-between text-sm text-blue-600 mt-2 pt-2 border-t">
                    <span>Remaining Barter Balance:</span>
                    <span>${payment.barterCreditsRemaining.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={resetFlow} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleShiftTransaction}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={
                    !validation?.isValid ||
                    payment.barterAmount > customer.barterBalance ||
                    isCheckingProducts
                  }
                >
                  {isCheckingProducts ? 'Checking Products...' : 'Process Payment'}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'process' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Processing Transaction</h3>
              <p className="text-gray-600 mb-4">Shifting POS transaction to barter system...</p>
              <Progress value={75} className="w-full" />
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">Transaction Complete!</h3>
              <p className="text-gray-600 mb-6">Barter payment has been processed successfully.</p>
              
              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-green-800">
                  Transaction ID: {posTransaction?.id}<br />
                  Receipt will be printed automatically
                </p>
              </div>
              
              <Button onClick={resetFlow} className="bg-blue-600 hover:bg-blue-700">
                Start New Transaction
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StreamlinedCheckout;
