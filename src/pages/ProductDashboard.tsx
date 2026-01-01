import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/hooks/useProducts';
import { useProductSync } from '@/hooks/useProductSync';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, Package, Search, Filter, AlertCircle, ShoppingCart, Plus, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import CategorySettings from '@/components/categories/CategorySettings';
import { Progress } from '@/components/ui/progress';

export default function ProductDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart, cartCount } = useCart();
  const [user, setUser] = useState<any>(null);
  const [posIntegrations, setPosIntegrations] = useState<any[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [barterFilter, setBarterFilter] = useState<string>('all');

  const { products, isLoading, refetch, subscribeToProducts } = useProducts(
    selectedIntegration === 'all' ? undefined : selectedIntegration
  );
  const { syncProducts, isSyncing, progress, subscribeToProgress } = useProductSync();

  // Subscribe to sync progress updates when integration is selected
  useEffect(() => {
    if (selectedIntegration && selectedIntegration !== 'all') {
      const unsubscribe = subscribeToProgress(selectedIntegration);
      return unsubscribe;
    }
  }, [selectedIntegration, subscribeToProgress]);

  // Check authentication
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);
    });
  }, [navigate]);

  // Fetch POS integrations
  useEffect(() => {
    if (!user) return;

    const fetchIntegrations = async () => {
      const { data, error } = await supabase
        .from('pos_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching integrations:', error);
        return;
      }

      setPosIntegrations(data || []);

      // Auto-select first integration if only one exists
      if (data && data.length === 1) {
        setSelectedIntegration(data[0].id);
      }
    };

    fetchIntegrations();
  }, [user]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToProducts();
    return unsubscribe;
  }, [subscribeToProducts]);

  // Handle sync products
  const handleSync = async () => {
    if (selectedIntegration === 'all') {
      toast({
        title: 'Select POS System',
        description: 'Please select a specific POS integration to sync products',
        variant: 'destructive'
      });
      return;
    }

    const result = await syncProducts(selectedIntegration);
    if (result.success) {
      refetch(); // Refresh products list
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    // Search filter
    const matchesSearch = searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase());

    // Barter filter
    const matchesBarter = barterFilter === 'all' ||
      (barterFilter === 'enabled' && product.barter_enabled) ||
      (barterFilter === 'disabled' && !product.barter_enabled);

    return matchesSearch && matchesBarter;
  });

  // Calculate stats
  const stats = {
    total: products.length,
    barterEnabled: products.filter(p => p.barter_enabled).length,
    restricted: products.filter(p => !p.barter_enabled && p.category_is_restricted).length,
    outOfStock: products.filter(p => p.stock_quantity === 0).length
  };

  if (!user) return null;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Product Inventory</h1>
          <p className="text-muted-foreground">
            Manage products synced from your POS systems
          </p>
        </div>
        {cartCount > 0 && (
          <Button
            onClick={() => navigate('/checkout')}
            size="lg"
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            <ShoppingCart className="h-5 w-5" />
            Go to Checkout ({cartCount} items)
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Products</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Barter Enabled</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.barterEnabled}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Restricted</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{stats.restricted}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Out of Stock</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.outOfStock}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* No POS Integration Alert */}
      {posIntegrations.length === 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <CardTitle className="text-orange-900 mb-1">No POS Integration Found</CardTitle>
                <CardDescription className="text-orange-700">
                  You need to connect a POS system (Square, Shopify, etc.) before you can sync products.
                  Go to your POS settings to connect one.
                </CardDescription>
                <Button
                  variant="outline"
                  className="mt-3 border-orange-300 text-orange-700 hover:bg-orange-100"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardHeader>
          {selectedIntegration === 'all' && posIntegrations.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-700">
                Select a specific POS system from the dropdown to sync products
              </p>
            </div>
          )}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1 w-full md:w-auto">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={barterFilter} onValueChange={setBarterFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Barter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="enabled">Barter Enabled</SelectItem>
                    <SelectItem value="disabled">Barter Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <Select value={selectedIntegration} onValueChange={setSelectedIntegration}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select POS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All POS Systems</SelectItem>
                  {posIntegrations.map(integration => (
                    <SelectItem key={integration.id} value={integration.id}>
                      {integration.provider.charAt(0).toUpperCase() + integration.provider.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handleSync}
                disabled={isSyncing || selectedIntegration === 'all' || posIntegrations.length === 0}
                className="gap-2"
                title={
                  posIntegrations.length === 0
                    ? 'No POS integrations found. Please connect a POS system first.'
                    : selectedIntegration === 'all'
                    ? 'Please select a specific POS system to sync'
                    : ''
                }
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Products'}
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Sync Progress Indicator */}
        {isSyncing && progress && (
          <CardContent className="pt-0">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  <span className="font-medium text-blue-900">
                    {progress.status === 'in_progress' ? 'Syncing Products...' : 'Sync Complete'}
                  </span>
                </div>
                <span className="text-sm text-blue-700 font-semibold">
                  {progress.total_items > 0
                    ? `${progress.processed_items}/${progress.total_items} products`
                    : 'Initializing...'}
                </span>
              </div>

              {progress.total_items > 0 && (
                <Progress
                  value={(progress.processed_items / progress.total_items) * 100}
                  className="h-2"
                />
              )}

              {progress.current_step && (
                <p className="text-sm text-blue-700">
                  {progress.current_step}
                </p>
              )}

              {progress.current_item_name && (
                <p className="text-xs text-blue-600">
                  Current: {progress.current_item_name}
                </p>
              )}

              <div className="flex gap-4 text-sm">
                <span className="text-green-700">
                  ✓ Synced: <strong>{progress.synced_items || 0}</strong>
                </span>
                <span className="text-orange-700">
                  ⊘ Skipped: <strong>{progress.skipped_items || 0}</strong>
                </span>
                {progress.error_items > 0 && (
                  <span className="text-red-700">
                    ✗ Errors: <strong>{progress.error_items}</strong>
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Products ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
              <p className="text-muted-foreground mb-4">
                {products.length === 0
                  ? 'Sync products from your POS system to get started'
                  : 'Try adjusting your search or filters'}
              </p>
              {products.length === 0 && posIntegrations.length > 0 && (
                <Button onClick={handleSync} disabled={selectedIntegration === 'all'}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Products
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Barter</TableHead>
                    <TableHead>POS</TableHead>
                    <TableHead>Last Sync</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map(product => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate">
                        {product.name}
                      </TableCell>
                      <TableCell>
                        ${product.price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span className={product.stock_quantity === 0 ? 'text-red-600 font-semibold' : ''}>
                          {product.stock_quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.sku || '-'}
                      </TableCell>
                      <TableCell>
                        {product.category_name || 'Uncategorized'}
                      </TableCell>
                      <TableCell>
                        {product.barter_enabled ? (
                          <Badge variant="default" className="bg-green-600">
                            ✓ {product.effective_barter_percentage}%
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Disabled
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="capitalize">
                        {product.pos_provider || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {product.last_synced_at
                          ? new Date(product.last_synced_at).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            addToCart({
                              id: product.id,
                              name: product.name,
                              price: product.price,
                              barcode: product.barcode,
                              sku: product.sku,
                              category_name: product.category_name,
                              is_barter_eligible: product.barter_enabled,
                              restriction_reason: product.category_is_restricted
                                ? `Restricted category: ${product.category_name}`
                                : undefined,
                              pos_integration_id: product.pos_integration_id,
                              external_product_id: product.external_product_id,
                              external_variant_id: product.external_variant_id,
                            });
                            toast({
                              title: 'Added to Cart',
                              description: `${product.name} added to cart`,
                            });
                          }}
                          className="bg-green-600 hover:bg-green-700 gap-1"
                          disabled={product.stock_quantity === 0}
                        >
                          <Plus className="h-4 w-4" />
                          Add to Cart
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Barter Settings */}
      <div className="mt-8">
        <CategorySettings />
      </div>
    </div>
  );
}
