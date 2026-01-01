import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Package, ShoppingCart, MapPin, Store, Coins, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addToCart, merchantInfo, switchMerchant } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [userCredits, setUserCredits] = useState(0);

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        setLoading(true);

        // Fetch product with eligibility info
        const { data: productData, error: productError } = await supabase
          .from('products_with_eligibility')
          .select('*')
          .eq('id', id)
          .single();

        if (productError) throw productError;
        setProduct(productData);

        // Fetch business info
        if (productData.business_id) {
          const { data: businessData, error: businessError } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', productData.business_id)
            .single();

          if (businessError) throw businessError;
          setBusiness(businessData);
        }
      } catch (error: any) {
        console.error('Error fetching product:', error);
        toast({
          title: "Error",
          description: "Failed to load product details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, toast]);

  // Fetch user credits
  useEffect(() => {
    const fetchUserCredits = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('barter_credits')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setUserCredits(data?.barter_credits || 0);
      } catch (error) {
        console.error('Error fetching user credits:', error);
      }
    };

    fetchUserCredits();
  }, [user]);

  const handleAddToCart = () => {
    if (!product || !business) return;

    // Check if adding from a different merchant
    if (merchantInfo && merchantInfo.id !== business.id) {
      if (window.confirm(
        `Your cart contains items from ${merchantInfo.business_name}. Adding items from ${business.business_name} will clear your current cart. Continue?`
      )) {
        switchMerchant(business.id);
      } else {
        return;
      }
    }

    // Prepare merchant info
    const currentMerchantInfo = {
      id: business.id,
      business_name: business.business_name,
      location: business.location,
      barter_percentage: business.barter_percentage
    };

    // Prepare cart item
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      merchant_id: business.user_id,
      merchant_name: business.business_name,
      image_url: product.image_url,
      stock_quantity: product.stock_quantity,
      barcode: product.barcode,
      sku: product.sku,
      category_name: product.category_name,
      is_barter_eligible: product.is_barter_eligible,
      restriction_reason: product.restriction_reason,
      pos_integration_id: product.pos_integration_id,
      external_product_id: product.external_product_id,
      external_variant_id: product.external_variant_id
    };

    // Add multiple quantities
    for (let i = 0; i < quantity; i++) {
      addToCart(cartItem, currentMerchantInfo);
    }

    toast({
      title: "Added to cart",
      description: `${quantity}x ${product.name} added to your cart.`
    });

    // Reset quantity
    setQuantity(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Product not found</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const totalPrice = product.price * quantity;
  const barterAmount = product.is_barter_eligible
    ? (totalPrice * (business?.barter_percentage || 0) / 100)
    : 0;
  const cashAmount = totalPrice - barterAmount;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                {/* Product Image */}
                <div className="w-full h-64 md:h-96 bg-gray-100 rounded-lg flex items-center justify-center mb-6 overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-24 w-24 text-gray-400" />
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h1 className="text-3xl font-bold">{product.name}</h1>
                      {product.is_barter_eligible ? (
                        <Badge className="bg-green-50 text-green-700 border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Barter Eligible
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Cash Only
                        </Badge>
                      )}
                    </div>

                    {product.category_name && (
                      <Badge variant="secondary" className="mb-2">
                        {product.category_name}
                      </Badge>
                    )}

                    {product.sku && (
                      <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-lg mb-2">Description</h3>
                    <p className="text-gray-700">
                      {product.description || 'No description available.'}
                    </p>
                  </div>

                  {!product.is_barter_eligible && product.restriction_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800">
                        <strong>Why cash only?</strong> {product.restriction_reason}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Business Info */}
            {business && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Sold by {business.business_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{business.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Coins className="h-4 w-4 text-gray-500" />
                      <span>{business.barter_percentage}% Barter accepted</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => navigate(`/listing/${business.id}`)}
                    >
                      View Store
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Purchase Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Purchase</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price */}
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    ${Number(product.price).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">per item</div>
                </div>

                {/* Stock Status */}
                {product.stock_quantity !== undefined && (
                  <div className={`text-center p-3 rounded-lg ${
                    product.stock_quantity === 0
                      ? 'bg-red-50 text-red-700'
                      : product.stock_quantity < 10
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-green-50 text-green-700'
                  }`}>
                    {product.stock_quantity === 0 ? (
                      <span className="font-semibold">Out of Stock</span>
                    ) : product.stock_quantity < 10 ? (
                      <span>Only {product.stock_quantity} left in stock!</span>
                    ) : (
                      <span>{product.stock_quantity} available</span>
                    )}
                  </div>
                )}

                {/* Quantity Selector */}
                <div>
                  <label className="block text-sm font-medium mb-2">Quantity</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      max={product.stock_quantity || 999}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.min((product.stock_quantity || 999), quantity + 1))}
                      disabled={quantity >= (product.stock_quantity || 999)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-semibold mb-3">Payment Breakdown</h4>

                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({quantity} items):</span>
                    <span className="font-semibold">${totalPrice.toFixed(2)}</span>
                  </div>

                  {product.is_barter_eligible && (
                    <>
                      <div className="flex justify-between text-sm text-green-700">
                        <span>Barter credits ({business?.barter_percentage || 0}%):</span>
                        <span className="font-semibold">-${barterAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Cash amount:</span>
                        <span className="font-semibold">${cashAmount.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* User Credits Info */}
                {product.is_barter_eligible && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex justify-between text-sm">
                      <span>Your barter credits:</span>
                      <span className="font-semibold">${userCredits.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>After purchase:</span>
                      <span className={`font-semibold ${
                        (userCredits - barterAmount) < 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ${(userCredits - barterAmount).toFixed(2)}
                      </span>
                    </div>
                    {(userCredits - barterAmount) < 0 && (
                      <p className="text-xs text-red-600 mt-2">
                        Insufficient credits. You'll need to reduce quantity or add more credits.
                      </p>
                    )}
                  </div>
                )}

                {/* Add to Cart Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={
                    product.stock_quantity === 0 ||
                    (product.is_barter_eligible && userCredits < barterAmount)
                  }
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
