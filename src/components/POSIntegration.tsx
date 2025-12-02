
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Link2, Store, Percent, CreditCard, Receipt } from 'lucide-react';

interface POSTransaction {
  id: string;
  items: Array<{
    barcode: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }>;
  subtotal: number;
  tax: number;
  taxRate: number;
  timestamp: string;
  storeId?: string;
  cashierInfo?: string;
}

interface POSIntegrationProps {
  onTransactionImport: (transaction: POSTransaction) => void;
  customerBarterBalance: number;
}

const POSIntegration = ({ onTransactionImport, customerBarterBalance }: POSIntegrationProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [barterPercentage, setBarterPercentage] = useState([0]);
  const [autoImport, setAutoImport] = useState(true);
  const [storeSystem, setStoreSystem] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');

  // Simulate POS system connection
  const connectToPOS = () => {
    setConnectionStatus('connecting');
    setTimeout(() => {
      setConnectionStatus('connected');
      setIsConnected(true);
      
      // Simulate receiving a transaction from POS
      if (autoImport) {
        setTimeout(() => {
          simulateIncomingTransaction();
        }, 2000);
      }
    }, 1500);
  };

  const simulateIncomingTransaction = () => {
    const mockTransaction: POSTransaction = {
      id: `pos_${Date.now()}`,
      items: [
        { barcode: '789123456789', name: 'Organic Bananas (1 lb)', price: 2.99, quantity: 2 },
        { barcode: '012345678901', name: 'Whole Milk (1 gallon)', price: 4.49, quantity: 1 },
        { barcode: '234567890123', name: 'Artisan Bread', price: 5.99, quantity: 1 },
      ],
      subtotal: 16.46,
      tax: 1.32,
      taxRate: 8.25,
      timestamp: new Date().toISOString(),
      storeId: 'STORE001',
      cashierInfo: 'Register 3 - Cashier: John D.'
    };
    
    onTransactionImport(mockTransaction);
  };

  const maxBarterAmount = Math.min(customerBarterBalance, 16.46); // Using mock subtotal
  const barterAmount = (maxBarterAmount * barterPercentage[0]) / 100;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Link2 className="w-5 h-5" />
          POS System Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Setup */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="storeSystem">Store System</Label>
              <Input
                id="storeSystem"
                placeholder="e.g., Square, Shopify POS, Toast"
                value={storeSystem}
                onChange={(e) => setStoreSystem(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="apiEndpoint">API Endpoint (Optional)</Label>
              <Input
                id="apiEndpoint"
                placeholder="https://api.yourstoresystem.com"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Store className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Connection Status:</span>
              <Badge 
                variant={connectionStatus === 'connected' ? 'default' : 'secondary'}
                className={connectionStatus === 'connected' ? 'bg-green-600' : ''}
              >
                {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
              </Badge>
            </div>
            
            {!isConnected && (
              <Button 
                onClick={connectToPOS}
                disabled={connectionStatus === 'connecting'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect to POS'}
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Barter Configuration */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Percent className="w-4 h-4" />
            Barter Payment Configuration
          </h4>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Auto-import transactions</span>
              <Switch
                checked={autoImport}
                onCheckedChange={setAutoImport}
              />
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Barter Credit Usage (%)</Label>
                  <span className="text-sm text-gray-600">
                    {barterPercentage[0]}% (${barterAmount.toFixed(2)})
                  </span>
                </div>
                <Slider
                  value={barterPercentage}
                  onValueChange={setBarterPercentage}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-gray-700">Available Balance</div>
                  <div className="text-lg font-bold text-green-600">
                    ${customerBarterBalance.toFixed(2)}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-gray-700">Using for Payment</div>
                  <div className="text-lg font-bold text-blue-600">
                    ${barterAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h5 className="font-semibold text-blue-800 mb-2">Integration Options:</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>API Integration:</strong> Connect via REST API for real-time sync</li>
            <li>• <strong>Webhook:</strong> Receive transaction data automatically</li>
            <li>• <strong>QR Code:</strong> Customer scans to import their receipt</li>
            <li>• <strong>Receipt Upload:</strong> Scan or upload receipt images</li>
          </ul>
        </div>

        {isConnected && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-4 h-4 text-green-600" />
              <span className="font-semibold text-green-800">Ready to Accept Transactions</span>
            </div>
            <p className="text-sm text-green-700">
              The system is now connected and ready to receive scanned items from your POS system.
              Transactions will be automatically imported with barter credits applied.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default POSIntegration;
