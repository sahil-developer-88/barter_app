
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Scan, User, DollarSign, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import CameraBarcodeScanner from '@/components/CameraBarcodeScanner';

interface CustomerInfo {
  id: string;
  full_name: string;
  available_credits: number;
}

const MerchantScanner = () => {
  const { user } = useAuth();
  const [scannedCode, setScannedCode] = useState('');
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [totalAmount, setTotalAmount] = useState('');
  const [barterAmount, setBarterAmount] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showScanner, setShowScanner] = useState(false);

  // Check if current user is a merchant (simplified check)
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch customer info after scanning using secure function
  const fetchCustomer = async (code: string) => {
    const customerId = code.split('-')[0]; // Extract user ID from barcode
    
    // Get profile info using secure function
    const { data: profileData, error: profileError } = await supabase
      .rpc('get_public_profile_info', { profile_user_id: customerId });
    
    if (profileError || !profileData || profileData.length === 0) {
      throw new Error('Customer not found');
    }

    // Get credits info
    const { data: creditsData, error: creditsError } = await supabase
      .from('user_credits')
      .select('available_credits')
      .eq('user_id', customerId)
      .single();
    
    if (creditsError) throw new Error('Customer credits not found');
    
    return {
      id: profileData[0].id,
      full_name: profileData[0].full_name || 'Customer',
      available_credits: creditsData.available_credits || 0
    };
  };

  // Process transaction mutation using direct database updates
  const processTransaction = useMutation({
    mutationFn: async ({ customerId, total, barter }: {
      customerId: string;
      total: number;
      barter: number;
    }) => {
      // First check customer balance
      const { data: creditsData, error: creditsError } = await supabase
        .from('user_credits')
        .select('available_credits')
        .eq('user_id', customerId)
        .single();

      if (creditsError) throw new Error('Customer not found');
      
      if (creditsData.available_credits < barter) {
        throw new Error('Insufficient barter credits');
      }

      // Update customer balance
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({ 
          available_credits: creditsData.available_credits - barter,
          total_spent: creditsData.available_credits - barter
        })
        .eq('user_id', customerId);

      if (updateError) throw updateError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          from_user_id: customerId,
          to_user_id: user?.id,
          points_amount: barter,
          status: 'completed',
          notes: `Barter payment: $${barter} barter, $${(total - barter).toFixed(2)} cash, Total: $${total}`
        });

      if (transactionError) throw transactionError;
    },
    onSuccess: () => {
      setMessage('Transaction completed successfully!');
      setMessageType('success');
      setCustomer(null);
      setScannedCode('');
      setTotalAmount('');
      setBarterAmount('');
    },
    onError: (error: any) => {
      setMessage(error.message || 'Transaction failed');
      setMessageType('error');
    }
  });

  const handleScan = async () => {
    if (!scannedCode) return;
    
    try {
      const customerData = await fetchCustomer(scannedCode);
      setCustomer(customerData);
      setMessage('');
    } catch (error: any) {
      setMessage(error.message);
      setMessageType('error');
      setCustomer(null);
    }
  };

  const handleCameraScan = (barcode: string) => {
    setScannedCode(barcode);
    setShowScanner(false);
    // Auto-fetch customer after camera scan
    setTimeout(() => {
      fetchCustomer(barcode).then(customerData => {
        setCustomer(customerData);
        setMessage('');
      }).catch(error => {
        setMessage(error.message);
        setMessageType('error');
        setCustomer(null);
      });
    }, 100);
  };

  const handleTransaction = () => {
    if (!customer || !totalAmount || !barterAmount) return;
    
    const total = parseFloat(totalAmount);
    const barter = parseFloat(barterAmount);
    
    if (barter > customer.available_credits) {
      setMessage('Insufficient barter credits');
      setMessageType('error');
      return;
    }
    
    if (barter > total) {
      setMessage('Barter amount cannot exceed total amount');
      setMessageType('error');
      return;
    }
    
    processTransaction.mutate({
      customerId: customer.id,
      total,
      barter
    });
  };

  if (!userProfile) {
    return (
      <div className="max-w-md mx-auto p-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Loading merchant verification...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (showScanner) {
    return (
      <CameraBarcodeScanner
        onClose={() => setShowScanner(false)}
        onScan={handleCameraScan}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="w-6 h-6" />
            Scan Customer Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="barcode">Customer Barcode</Label>
            <div className="flex gap-2">
              <Input
                id="barcode"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                placeholder="Scan or enter customer code"
              />
              <Button onClick={handleScan}>
                <Scan className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowScanner(true)}
            variant="outline"
            className="w-full"
          >
            <Camera className="w-4 h-4 mr-2" />
            Use Camera Scanner
          </Button>
        </CardContent>
      </Card>

      {customer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-6 h-6" />
              Customer Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold">{customer.full_name}</p>
              <p className="text-lg text-green-600">
                Available Credits: ${customer.available_credits}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="total">Total Sale Amount ($)</Label>
                <Input
                  id="total"
                  type="number"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="barter">Barter Payment Amount ($)</Label>
                <Input
                  id="barter"
                  type="number"
                  step="0.01"
                  value={barterAmount}
                  onChange={(e) => setBarterAmount(e.target.value)}
                  placeholder="0.00"
                  max={Math.min(parseFloat(totalAmount) || 0, customer.available_credits || 0)}
                />
              </div>
              
              {totalAmount && barterAmount && (
                <div className="p-3 bg-gray-50 rounded">
                  <p>Barter Payment: ${barterAmount}</p>
                  <p>Cash Payment: ${(parseFloat(totalAmount) - parseFloat(barterAmount)).toFixed(2)}</p>
                </div>
              )}
              
              <Button 
                onClick={handleTransaction}
                disabled={!totalAmount || !barterAmount || processTransaction.isPending}
                className="w-full"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                {processTransaction.isPending ? 'Processing...' : 'Process Payment'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {message && (
        <Alert className={messageType === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {messageType === 'success' ? 
            <CheckCircle className="h-4 w-4 text-green-600" /> : 
            <AlertCircle className="h-4 w-4 text-red-600" />
          }
          <AlertDescription className={messageType === 'success' ? 'text-green-700' : 'text-red-700'}>
            {message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default MerchantScanner;
