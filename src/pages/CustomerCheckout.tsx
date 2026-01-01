import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, Check, Package, CreditCard, ShoppingBag, MapPin, User, Mail, Phone } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const CustomerCheckout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { cart, merchantInfo, cartTotal, clearCart } = useCart();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [orderNumber, setOrderNumber] = useState('');

  // Customer details form
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setUserProfile(data);
      setCustomerDetails({
        name: data.full_name || '',
        email: user.email || '',
        phone: data.phone_number || '',
        notes: ''
      });
    };

    fetchProfile();
  }, [user]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add some items to your cart before checking out.",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [cart, navigate, toast]);

  // Calculate payment breakdown
  const eligibleSubtotal = cart.reduce((total, item) => {
    return total + (item.is_barter_eligible ? item.price * item.quantity : 0);
  }, 0);

  const restrictedSubtotal = cart.reduce((total, item) => {
    return total + (!item.is_barter_eligible ? item.price * item.quantity : 0);
  }, 0);

  const barterPercentage = merchantInfo?.barter_percentage || 0;
  const barterAmount = (eligibleSubtotal * barterPercentage) / 100;
  const cashSubtotal = cartTotal - barterAmount;
  const taxRate = 0.08;
  const taxAmount = cashSubtotal * taxRate;
  const totalAmount = cashSubtotal + taxAmount;

  const handleNext = () => {
    if (currentStep === 2) {
      // Validate customer details
      if (!customerDetails.name || !customerDetails.email) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields.",
          variant: "destructive"
        });
        return;
      }
    }

    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handlePlaceOrder = async () => {
    if (!user || !merchantInfo) return;

    // Check if user has enough credits
    if (barterAmount > (userProfile?.barter_credits || 0)) {
      toast({
        title: "Insufficient credits",
        description: `You need $${barterAmount.toFixed(2)} in barter credits but only have $${(userProfile?.barter_credits || 0).toFixed(2)}.`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Get merchant's user_id from business
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('user_id')
        .eq('id', merchantInfo.id)
        .single();

      if (businessError) throw businessError;

      // Prepare order data
      const orderData = {
        subtotal: cartTotal,
        eligible_subtotal: eligibleSubtotal,
        restricted_subtotal: restrictedSubtotal,
        barter_amount: barterAmount,
        barter_percentage: barterPercentage,
        cash_amount: cashSubtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        payment_method: 'cash', // Will be 'stripe' when Stripe is integrated
        customer_name: customerDetails.name,
        customer_email: customerDetails.email,
        customer_phone: customerDetails.phone,
        pickup_location: merchantInfo.location,
        estimated_pickup_time: new Date(Date.now() + 30 * 60000).toISOString(), // 30 mins from now
        customer_notes: customerDetails.notes
      };

      // Prepare order items
      const orderItems = cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        product_sku: item.sku,
        product_barcode: item.barcode,
        unit_price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
        is_barter_eligible: item.is_barter_eligible,
        restriction_reason: item.restriction_reason,
        category_name: item.category_name
      }));

      // Call the database function to process the order
      const { data: result, error: orderError } = await supabase.rpc('process_order_checkout', {
        p_customer_id: user.id,
        p_merchant_id: business.user_id,
        p_order_data: orderData,
        p_items: orderItems
      });

      if (orderError) throw orderError;

      // Fetch the created order to get the order number
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('order_number')
        .eq('id', result)
        .single();

      if (fetchError) throw fetchError;

      setOrderNumber(order.order_number);

      // Move to confirmation step
      setCurrentStep(4);

      // Clear cart
      clearCart();

      toast({
        title: "Order placed successfully!",
        description: `Your order #${order.order_number} has been confirmed.`
      });

    } catch (error: any) {
      console.error('Error placing order:', error);
      toast({
        title: "Error placing order",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Review Cart', icon: ShoppingBag },
    { number: 2, title: 'Details', icon: User },
    { number: 3, title: 'Payment', icon: CreditCard },
    { number: 4, title: 'Confirmation', icon: Check }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold">Checkout</h1>
          {merchantInfo && (
            <p className="text-gray-600 mt-2">Ordering from {merchantInfo.business_name}</p>
          )}
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      currentStep >= step.number
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    <step.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs mt-2 text-center hidden sm:block">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          {/* Step 1: Review Cart */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Review Your Order</CardTitle>
                <CardDescription>
                  {cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b pb-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.sku && <p className="text-sm text-gray-600">SKU: {item.sku}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-semibold text-green-600">
                          ${item.price.toFixed(2)}
                        </span>
                        <span className="text-gray-600">× {item.quantity}</span>
                        {item.is_barter_eligible ? (
                          <Badge variant="outline" className="text-xs bg-green-50">
                            Barter OK
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-red-50">
                            Cash Only
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}

                <Separator />

                {/* Payment Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">${cartTotal.toFixed(2)}</span>
                  </div>
                  {barterAmount > 0 && (
                    <>
                      <div className="flex justify-between text-green-700">
                        <span>Barter credits ({barterPercentage}%):</span>
                        <span className="font-medium">-${barterAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cash subtotal:</span>
                        <span className="font-medium">${cashSubtotal.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (8%):</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <Button onClick={handleNext} className="w-full" size="lg">
                  Continue to Details
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Customer Details */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
                <CardDescription>Please provide your contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={customerDetails.name}
                      onChange={(e) =>
                        setCustomerDetails({ ...customerDetails, name: e.target.value })
                      }
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerDetails.email}
                      onChange={(e) =>
                        setCustomerDetails({ ...customerDetails, email: e.target.value })
                      }
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerDetails.phone}
                    onChange={(e) =>
                      setCustomerDetails({ ...customerDetails, phone: e.target.value })
                    }
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={customerDetails.notes}
                    onChange={(e) =>
                      setCustomerDetails({ ...customerDetails, notes: e.target.value })
                    }
                    placeholder="Any special instructions for your order..."
                    rows={3}
                  />
                </div>

                {merchantInfo && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">Pickup Location</p>
                        <p className="text-sm text-blue-700">{merchantInfo.location}</p>
                        <p className="text-xs text-blue-600 mt-1">
                          Estimated pickup time: 30 minutes
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button onClick={handleBack} variant="outline" className="flex-1">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleNext} className="flex-1">
                    Continue to Payment
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Payment */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
                <CardDescription>Review and complete your payment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment Summary */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold mb-3">Payment Breakdown</h3>
                  <div className="flex justify-between text-sm">
                    <span>Items subtotal:</span>
                    <span className="font-medium">${cartTotal.toFixed(2)}</span>
                  </div>
                  {barterAmount > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Eligible for barter:</span>
                        <span className="font-medium">${eligibleSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-700">
                        <span>Barter credits applied ({barterPercentage}%):</span>
                        <span className="font-semibold">-${barterAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Cash portion:</span>
                        <span className="font-medium">${cashSubtotal.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Tax (8% on cash):</span>
                    <span className="font-medium">${taxAmount.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total to pay:</span>
                    <span className="text-green-600">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Credits Balance */}
                {barterAmount > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Your Barter Credits</h4>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Current balance:</span>
                      <span className="font-medium">
                        ${(userProfile?.barter_credits || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>After this purchase:</span>
                      <span
                        className={`font-semibold ${
                          (userProfile?.barter_credits || 0) - barterAmount < 0
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        ${((userProfile?.barter_credits || 0) - barterAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Payment Method - Placeholder for Stripe */}
                <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">Cash payment at pickup</p>
                  <p className="text-sm text-gray-500">
                    Stripe payment integration coming soon
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleBack} variant="outline" className="flex-1">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handlePlaceOrder}
                    className="flex-1"
                    disabled={
                      loading ||
                      (barterAmount > 0 && barterAmount > (userProfile?.barter_credits || 0))
                    }
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Place Order ${totalAmount.toFixed(2)}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="h-10 w-10 text-green-600" />
                </div>

                <h2 className="text-3xl font-bold mb-2">Order Confirmed!</h2>
                <p className="text-xl text-gray-600 mb-6">
                  Order #{orderNumber}
                </p>

                <div className="max-w-md mx-auto space-y-4 mb-8">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Payment Summary</h3>
                    <div className="space-y-2 text-sm">
                      {barterAmount > 0 && (
                        <div className="flex justify-between text-green-700">
                          <span>Barter credits used:</span>
                          <span className="font-semibold">${barterAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Cash to pay at pickup:</span>
                        <span className="font-semibold">${totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {merchantInfo && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Pickup Information</h4>
                      <div className="text-sm space-y-1">
                        <p className="font-medium">{merchantInfo.business_name}</p>
                        <p className="text-gray-700">{merchantInfo.location}</p>
                        <p className="text-blue-600 font-medium mt-2">
                          Ready in approximately 30 minutes
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 max-w-md mx-auto">
                  <Button onClick={() => navigate('/orders')} variant="outline" className="flex-1">
                    View My Orders
                  </Button>
                  <Button onClick={() => navigate('/')} className="flex-1">
                    Continue Shopping
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerCheckout;
