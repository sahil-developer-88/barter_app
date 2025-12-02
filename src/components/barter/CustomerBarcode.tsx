
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { QrCode, RefreshCw } from 'lucide-react';

const CustomerBarcode = () => {
  const { user } = useAuth();
  const [barcodeValue, setBarcodeValue] = useState('');

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch user credits
  const { data: credits, isLoading: creditsLoading } = useQuery({
    queryKey: ['userCredits', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Generate barcode value (user ID with timestamp for security)
  const generateBarcode = () => {
    if (user?.id) {
      const timestamp = Date.now();
      setBarcodeValue(`${user.id}-${timestamp}`);
    }
  };

  useEffect(() => {
    generateBarcode();
    // Refresh barcode every 5 minutes for security
    const interval = setInterval(generateBarcode, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

  if (profileLoading || creditsLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <QrCode className="w-6 h-6" />
            Your Barter Code
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {/* QR Code Display */}
          <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
            <div className="text-4xl font-mono break-all bg-gray-100 p-4 rounded">
              {barcodeValue}
            </div>
          </div>
          
          {/* User Info */}
          <div className="space-y-2">
            <p className="text-lg font-semibold">{profile?.full_name || profile?.email || 'User'}</p>
            <p className="text-2xl font-bold text-green-600">
              ${credits?.available_credits || 0} Credits
            </p>
          </div>

          {/* Refresh Button */}
          <Button 
            onClick={generateBarcode}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Code
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerBarcode;
