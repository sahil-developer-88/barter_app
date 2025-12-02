
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, Settings, BarChart3, CreditCard, Plus, Trash2 } from 'lucide-react';
import { POSConnectionWizard } from './POSConnectionWizard';
import { usePOSTransactions, usePOSIntegrations } from '@/hooks/usePOSTransactions';
import { format } from 'date-fns';

const MerchantDashboard = () => {
  const [wizardOpen, setWizardOpen] = useState(false);
  const { transactions, loading: txLoading } = usePOSTransactions();
  const { integrations, loading: intLoading, disconnect } = usePOSIntegrations();

  const totalBarterToday = transactions
    .filter(tx => {
      const txDate = new Date(tx.transaction_date);
      const today = new Date();
      return txDate.toDateString() === today.toDateString();
    })
    .reduce((sum, tx) => sum + tx.barter_amount, 0);

  const todayTransactionCount = transactions.filter(tx => {
    const txDate = new Date(tx.transaction_date);
    const today = new Date();
    return txDate.toDateString() === today.toDateString();
  }).length;

  const avgBarterPercentage = transactions.length > 0
    ? transactions.reduce((sum, tx) => sum + tx.barter_percentage, 0) / transactions.length
    : 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Store className="w-8 h-8 text-primary" />
            Merchant Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">Real-time POS integration with automatic barter transaction detection</p>
        </div>
        <Badge variant={integrations.length > 0 ? "default" : "secondary"}>
          {integrations.length} POS Connected
        </Badge>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Today's Barter Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalBarterToday.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Real-time synced</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Transactions Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayTransactionCount}</div>
                <p className="text-xs text-muted-foreground">Auto-detected from POS</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Barter %</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgBarterPercentage.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Across all transactions</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <p className="text-center text-muted-foreground py-8">Loading transactions...</p>
              ) : transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions yet. Connect your POS to start syncing.</p>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">${tx.total_amount.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(tx.transaction_date), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{tx.pos_provider}</Badge>
                        <p className="text-sm text-green-600">${tx.barter_amount.toFixed(2)} barter</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Connected POS Systems</CardTitle>
                <Button onClick={() => setWizardOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Connect POS
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {intLoading ? (
                <p className="text-center text-muted-foreground py-8">Loading integrations...</p>
              ) : integrations.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No POS systems connected yet.</p>
                  <Button onClick={() => setWizardOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Connect Your First POS
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {integrations.map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold capitalize">{integration.provider}</h4>
                        <p className="text-sm text-muted-foreground">Store: {integration.store_id}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Connected {format(new Date(integration.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => disconnect(integration.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Disconnect
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <p className="text-center text-muted-foreground py-8">Loading...</p>
              ) : transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No transactions to display.</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">${tx.total_amount.toFixed(2)} {tx.currency}</p>
                          <p className="text-sm text-muted-foreground capitalize">{tx.pos_provider} • {tx.status}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(tx.transaction_date), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Barter:</span>{' '}
                          <span className="font-medium text-green-600">${tx.barter_amount.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Card:</span>{' '}
                          <span className="font-medium">${tx.card_amount.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">%:</span>{' '}
                          <span className="font-medium">{tx.barter_percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <POSConnectionWizard 
        open={wizardOpen} 
        onOpenChange={setWizardOpen}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
};

export default MerchantDashboard;
