import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface POSTransaction {
  id: string;
  merchant_id: string;
  external_transaction_id: string;
  pos_provider: string;
  total_amount: number;
  currency: string;
  barter_amount: number;
  barter_percentage: number;
  cash_amount: number;
  card_amount: number;
  items?: any;
  status: string;
  transaction_date: string;
  created_at: string;
}

/**
 * Hook for real-time POS transaction syncing
 * Listens to database changes and updates UI automatically
 */
export function usePOSTransactions() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<POSTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    fetchTransactions();

    // Set up real-time subscription
    const channel = supabase
      .channel('pos-transactions-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pos_transactions'
        },
        (payload) => {
          console.log('🔄 New transaction received:', payload.new);
          
          const newTransaction = payload.new as POSTransaction;
          setTransactions(prev => [newTransaction, ...prev]);
          
          // Show toast notification
          toast({
            title: '💰 New Transaction',
            description: `${newTransaction.pos_provider} transaction: $${newTransaction.total_amount}`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pos_transactions'
        },
        (payload) => {
          console.log('🔄 Transaction updated:', payload.new);
          
          setTransactions(prev =>
            prev.map(tx =>
              tx.id === payload.new.id ? (payload.new as POSTransaction) : tx
            )
          );
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchTransactions() {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error: fetchError } = await supabase
        .from('pos_transactions')
        .select('*')
        .eq('merchant_id', user.id)
        .order('transaction_date', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setTransactions(data || []);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions
  };
}

/**
 * Hook for POS integrations management
 */
export function usePOSIntegrations() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  async function fetchIntegrations() {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data } = await supabase
        .from('pos_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      setIntegrations(data || []);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function disconnectIntegration(id: string) {
    try {
      const { error } = await supabase
        .from('pos_integrations')
        .update({ status: 'inactive' })
        .eq('id', id);

      if (error) throw error;

      await fetchIntegrations();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  return {
    integrations,
    loading,
    refetch: fetchIntegrations,
    disconnect: disconnectIntegration
  };
}
