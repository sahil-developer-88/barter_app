
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, Handshake, Store, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const HeroSection = () => {
  const [stats, setStats] = useState({
    activeBusinesses: 0,
    totalTransactions: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get count of active businesses
        const { count: businessCount } = await supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Get count of transactions
        const { count: transactionCount } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true });

        setStats({
          activeBusinesses: businessCount || 0,
          totalTransactions: transactionCount || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const formatValue = (transactions: number) => {
    // Estimate average transaction value
    const estimatedValue = transactions * 150;
    if (estimatedValue >= 1000000) {
      return `$${(estimatedValue / 1000000).toFixed(1)}M`;
    } else if (estimatedValue >= 1000) {
      return `$${(estimatedValue / 1000).toFixed(0)}K`;
    }
    return `$${estimatedValue}`;
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Trade Services, Not Just Cash
        </h1>
        <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
          Join local businesses exchanging services with flexible barter percentages. 
          Save cash while growing your network.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 flex-1" asChild>
            <Link to="/onboarding">
              <Store className="w-5 h-5 mr-2" />
              Join as Merchant
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="flex-1" asChild>
            <Link to="/#search">
              <Search className="w-5 h-5 mr-2" />
              Browse Services
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-12 w-12 text-blue-600 mr-4" />
            <div>
              <h3 className="text-2xl font-bold">{stats.activeBusinesses}</h3>
              <p className="text-gray-600">Active Merchants</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <TrendingUp className="h-12 w-12 text-green-600 mr-4" />
            <div>
              <h3 className="text-2xl font-bold">{formatValue(stats.totalTransactions)}</h3>
              <p className="text-gray-600">Value Exchanged</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Handshake className="h-12 w-12 text-purple-600 mr-4" />
            <div>
              <h3 className="text-2xl font-bold">{stats.totalTransactions}</h3>
              <p className="text-gray-600">Successful Trades</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HeroSection;
