import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useHasRole } from '@/hooks/useHasRole';
// import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { MessageSquare, Settings } from 'lucide-react';
import HeroSection from '@/components/HeroSection';
import SearchSection from '@/components/SearchSection';
import BusinessListings from '@/components/BusinessListings';
import AIChatbar from '@/components/AIChatbar';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import { usePWA } from '@/hooks/usePWA';
import { categories } from '@/data/mockBusinesses';

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [locationFilter, setLocationFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showInstallPromptState, setShowInstallPromptState] = useState(true);
  const { isInstallable, isInstalled } = usePWA();
  const { user, loading: authLoading } = useAuth();
  const { hasRole: isAdmin } = useHasRole('admin');
  // const { isAdmin } = useAdminAccess();
  const navigate = useNavigate();

  // Allow logged-in users to browse store listings
  // (Removed redirect to dashboard - users can access via Profile button)

  // Fetch real businesses from database
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform database format to component format
        const transformedBusinesses = (data || []).map(business => ({
          id: business.id,
          businessName: business.business_name,
          category: business.category,
          servicesOffered: business.services_offered || [],
          wantingInReturn: business.wanting_in_return || [],
          estimatedValue: Number(business.estimated_value) || 0,
          location: business.location,
          contactMethod: business.contact_method,
          rating: 4.5, // Default until we have reviews
          reviews: 0,
          verified: false,
          points: Math.round((Number(business.estimated_value) || 0) / 10),
          image: '/placeholder.svg',
          description: business.description || '',
          barterPercentage: Number(business.barter_percentage) || 20
        }));

        setBusinesses(transformedBusinesses);
      } catch (error) {
        console.error('Error fetching businesses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();

    // Set up real-time subscription
    const subscription = supabase
      .channel('businesses_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'businesses'
        },
        () => {
          fetchBusinesses();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Filter businesses based on search criteria
  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = searchTerm === '' || 
      business.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.servicesOffered.some((service: string) => 
        service.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      business.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All Categories' || business.category === selectedCategory;
    const matchesLocation = locationFilter === '' || 
      business.location.toLowerCase().includes(locationFilter.toLowerCase());
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const handleAISearch = (query: string) => {
    setSearchTerm(query);
    setShowAIChat(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mobile-container">
        <HeroSection />
      </div>

      <main id="search" className="mobile-container py-4 sm:py-8">
        <SearchSection
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          locationFilter={locationFilter}
          setLocationFilter={setLocationFilter}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          categories={categories}
        />

        {showAIChat && (
          <div className="mb-4 sm:mb-6">
            <AIChatbar 
              onSearch={handleAISearch}
              onClose={() => setShowAIChat(false)}
            />
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading businesses...</p>
          </div>
        ) : (
          <BusinessListings businesses={filteredBusinesses} />
        )}
      </main>

      {/* PWA Install Prompt */}
      {isInstallable && showInstallPromptState && !isInstalled && (
        <PWAInstallPrompt 
          onDismiss={() => setShowInstallPromptState(false)}
        />
      )}

      {/* Admin Panel Access - Only show if user is admin */}
      {user && isAdmin && (
        <div className="fixed bottom-20 left-4 z-40">
          <Button
            onClick={() => navigate('/admin')}
            className="rounded-full w-12 h-12 bg-gray-800 hover:bg-gray-900 shadow-lg"
            title="Admin Panel"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* AI Chat Toggle Button */}
      <Button
        onClick={() => setShowAIChat(!showAIChat)}
        className="fixed bottom-4 right-4 rounded-full w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg z-50"
      >
        <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
      </Button>
    </div>
  );
};

export default Index;
