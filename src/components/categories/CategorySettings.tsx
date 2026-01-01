import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Lock, Check, Settings } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  is_restricted: boolean;
  barter_enabled: boolean;
  restriction_reason?: string;
  description?: string;
}

export default function CategorySettings() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('is_restricted', { ascending: false })
        .order('name');

      if (error) throw error;

      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleBarterEnabled = async (categoryId: string, currentValue: boolean, isRestricted: boolean) => {
    // Restricted categories cannot be enabled
    if (isRestricted && !currentValue) {
      toast({
        title: 'Cannot Enable',
        description: 'Restricted categories (alcohol, tobacco, etc.) cannot accept barter for legal compliance.',
        variant: 'destructive'
      });
      return;
    }

    setUpdating(categoryId);

    try {
      const newValue = !currentValue;

      const { error } = await supabase
        .from('product_categories')
        .update({ barter_enabled: newValue })
        .eq('id', categoryId);

      if (error) throw error;

      // Update local state
      setCategories(categories.map(cat =>
        cat.id === categoryId ? { ...cat, barter_enabled: newValue } : cat
      ));

      toast({
        title: 'Category Updated',
        description: `Barter ${newValue ? 'enabled' : 'disabled'} for this category`,
      });
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update category',
        variant: 'destructive'
      });
    } finally {
      setUpdating(null);
    }
  };

  const restrictedCategories = categories.filter(c => c.is_restricted);
  const nonRestrictedCategories = categories.filter(c => !c.is_restricted);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-muted-foreground">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <Settings className="h-6 w-6" />
          Category Barter Settings
        </h2>
        <p className="text-muted-foreground">
          Control which product categories can accept barter payments
        </p>
      </div>

      {/* Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>How it works:</strong> When you disable barter for a category, ALL products in that category will automatically reject barter payments, regardless of individual product settings.
        </AlertDescription>
      </Alert>

      {/* Restricted Categories */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900">
            <Lock className="h-5 w-5" />
            Restricted Categories (Always Disabled)
          </CardTitle>
          <CardDescription>
            These categories cannot accept barter for legal compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {restrictedCategories.map(category => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-red-900">{category.name}</h3>
                    <Badge variant="destructive" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Locked
                    </Badge>
                  </div>
                  {category.restriction_reason && (
                    <p className="text-sm text-red-700">{category.restriction_reason}</p>
                  )}
                  {category.description && (
                    <p className="text-xs text-red-600 mt-1">{category.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={false}
                    disabled={true}
                    className="opacity-50"
                  />
                  <span className="text-sm font-medium text-red-700">Disabled</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Non-Restricted Categories */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Check className="h-5 w-5" />
            Standard Categories (Toggleable)
          </CardTitle>
          <CardDescription>
            Toggle barter on/off for these categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {nonRestrictedCategories.map(category => (
              <div
                key={category.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                  category.barter_enabled
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold ${category.barter_enabled ? 'text-green-900' : 'text-gray-700'}`}>
                      {category.name}
                    </h3>
                    <Badge
                      variant={category.barter_enabled ? 'default' : 'secondary'}
                      className={category.barter_enabled ? 'bg-green-600' : ''}
                    >
                      {category.barter_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  {category.description && (
                    <p className="text-sm text-gray-600">{category.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">
                    {category.barter_enabled ? 'Accepts Barter' : 'Cash Only'}
                  </span>
                  <Switch
                    checked={category.barter_enabled}
                    onCheckedChange={() => toggleBarterEnabled(category.id, category.barter_enabled, category.is_restricted)}
                    disabled={updating === category.id}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
