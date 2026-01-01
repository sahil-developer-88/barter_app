import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, Star, Mail, CheckCircle, Coins, User, Globe, ExternalLink, MessageSquare, ShoppingCart, Package, Search } from "lucide-react";
import InquiryModal from "@/components/merchant/InquiryModal";
import ProductCard from "@/components/products/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart, merchantInfo, switchMerchant } = useCart();
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [business, setBusiness] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Fetch business details
  useEffect(() => {
    const fetchBusiness = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setBusiness(data);
      } catch (error: any) {
        console.error('Error fetching business:', error);
        toast({
          title: "Error",
          description: "Failed to load business details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [id, toast]);

  // Fetch products for this business
  useEffect(() => {
    const fetchProducts = async () => {
      if (!id) return;

      try {
        setProductsLoading(true);
        const { data, error } = await supabase
          .from('products_with_eligibility')
          .select('*')
          .eq('business_id', id)
          .eq('is_active', true)
          .gt('stock_quantity', 0)
          .order('name');

        if (error) throw error;
        setProducts(data || []);
      } catch (error: any) {
        console.error('Error fetching products:', error);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();

    // Set up real-time subscription for products
    const subscription = supabase
      .channel(`products_business_${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `business_id=eq.${id}`
        },
        (payload) => {
          console.log('Product change detected:', payload);
          // Refetch products when any change occurs
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id]);

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category_name === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from products
  const categories = Array.from(new Set(products.map(p => p.category_name).filter(Boolean)));

  // Handle add to cart
  const handleAddToCart = (product: any) => {
    if (!business) return;

    // Check if adding from a different merchant
    if (merchantInfo && merchantInfo.id !== business.id) {
      // Show confirmation dialog
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

    addToCart(cartItem, currentMerchantInfo);

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`
    });
  };

  const getSocialUrl = (platform: string, handle: string) => {
    const baseUrls = {
      instagram: 'https://instagram.com/',
      twitter: 'https://twitter.com/',
      facebook: 'https://facebook.com/',
      linkedin: 'https://linkedin.com/in/'
    };

    const cleanHandle = handle.replace('@', '');
    return `${baseUrls[platform as keyof typeof baseUrls]}${cleanHandle}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Business not found</h2>
          <Button onClick={() => navigate('/')}>Back to Stores</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to listings
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-2xl">{business.business_name}</CardTitle>
                      {business.verified && (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      )}
                    </div>
                    <Badge variant="secondary" className="mb-4">
                      {business.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-lg font-semibold text-green-600">
                    <Coins className="h-5 w-5" />
                    <span>{business.barter_percentage}% Barter</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{business.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>4.5</span>
                    <span>(0 reviews)</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">About this business</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {business.description || 'No description available.'}
                  </p>
                </div>

                {business.services_offered && business.services_offered.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Services Offered</h3>
                    <div className="flex flex-wrap gap-2">
                      {business.services_offered.map((service: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-sm">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {business.wanting_in_return && business.wanting_in_return.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Looking For</h3>
                    <div className="flex flex-wrap gap-2">
                      {business.wanting_in_return.map((want: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-sm bg-blue-50">
                          {want}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Catalog Section */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Available Products</h3>
                    <Badge variant="secondary">{filteredProducts.length} items</Badge>
                  </div>

                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search products by name or SKU..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Products Grid */}
                  {productsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No products available</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {productSearch || categoryFilter !== 'all'
                          ? 'Try adjusting your filters'
                          : 'This store hasn\'t added any products yet'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          merchantBarterPercentage={business.barter_percentage}
                          onAddToCart={handleAddToCart}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact & Trade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    ${Number(business.estimated_value || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Estimated Value</div>
                </div>

                <div className="space-y-3">
                  <Button className="w-full" size="lg">
                    Request Trade
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsInquiryModalOpen(true)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Inquire or Purchase
                  </Button>
                  {business.contact_method && (
                    <Button variant="outline" className="w-full">
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Directly
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Business Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium">{business.business_name}</div>
                    <div className="text-sm text-gray-600">
                      Member since {new Date(business.created_at).getFullYear()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                  <div className="text-center">
                    <div className="font-semibold">0</div>
                    <div className="text-xs text-gray-600">Completed Trades</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">-</div>
                    <div className="text-xs text-gray-600">Response Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="border-b pb-3 last:border-b-0">
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-700">
                      "Excellent service! Very professional and delivered exactly what was promised."
                    </p>
                    <p className="text-xs text-gray-500 mt-1">- Mike R.</p>
                  </div>
                  <div className="border-b pb-3 last:border-b-0">
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-700">
                      "Great communication and quick turnaround. Highly recommend!"
                    </p>
                    <p className="text-xs text-gray-500 mt-1">- Lisa K.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  View All Reviews
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <InquiryModal
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
        merchantName={business.business_name}
        businessName={business.business_name}
        availableServices={business.services_offered || []}
        pricedItems={[]}
      />
    </div>
  );
};

export default ListingDetail;
