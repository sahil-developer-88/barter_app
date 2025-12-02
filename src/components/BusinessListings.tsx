
import React from 'react';
import BusinessCard from '@/components/BusinessCard';

interface Business {
  id: number;
  businessName: string;
  category: string;
  servicesOffered: string[];
  wantingInReturn: string[];
  estimatedValue: number;
  location: string;
  contactMethod: string;
  rating: number;
  reviews: number;
  verified: boolean;
  points: number;
  image: string;
  description: string;
}

interface BusinessListingsProps {
  businesses: Business[];
}

const BusinessListings: React.FC<BusinessListingsProps> = ({ businesses }) => {
  return (
    <div className="mb-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        Available Services ({businesses.length})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businesses.map((business) => (
          <BusinessCard key={business.id} business={business} />
        ))}
      </div>
      
      {businesses.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No businesses found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search criteria or filters
          </p>
        </div>
      )}
    </div>
  );
};

export default BusinessListings;
