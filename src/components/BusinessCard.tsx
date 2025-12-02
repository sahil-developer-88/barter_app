
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Mail, CheckCircle, Coins, ExternalLink, Globe } from "lucide-react";

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
  website?: string;
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    linkedin?: string;
  };
  pricedItems?: Array<{ name: string; price: number; points: number }>;
  barterPercentage?: number;
}

interface BusinessCardProps {
  business: Business;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business }) => {
  const getSocialIcon = (platform: string) => {
    // Using external link icon for all social platforms for simplicity
    return <ExternalLink className="h-3 w-3" />;
  };

  const getSocialUrl = (platform: string, handle: string) => {
    const baseUrls = {
      instagram: 'https://instagram.com/',
      twitter: 'https://twitter.com/',
      facebook: 'https://facebook.com/',
      linkedin: 'https://linkedin.com/in/'
    };
    
    const cleanHandle = handle.replace('@', '');
    return `${baseUrls[platform as keyof typeof baseUrls]}${cleanHandle}`;
  };

  // Get barter percentage with fallback
  const barterPercentage = business.barterPercentage ?? 20;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Link to={`/listing/${business.id}`}>
                <CardTitle className="text-lg hover:text-blue-600 transition-colors cursor-pointer">
                  {business.businessName}
                </CardTitle>
              </Link>
              {business.verified && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">
                {business.category}
              </Badge>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                {barterPercentage}% Barter
              </Badge>
            </div>
            
            {/* Social Media Links */}
            {business.socialMedia && (
              <div className="flex gap-2 mb-2">
                {business.website && (
                  <a 
                    href={business.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                )}
                {Object.entries(business.socialMedia).map(([platform, handle]) => 
                  handle ? (
                    <a 
                      key={platform}
                      href={getSocialUrl(platform, handle)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-blue-600 transition-colors"
                      title={`${platform}: ${handle}`}
                    >
                      {getSocialIcon(platform)}
                    </a>
                  ) : null
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Coins className="h-4 w-4" />
            <span>{business.points} pts</span>
          </div>
        </div>
        
        <CardDescription className="text-sm">
          {business.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Priced Items */}
        {business.pricedItems && business.pricedItems.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Available for Purchase:</h4>
            <div className="space-y-1">
              {business.pricedItems.slice(0, 2).map((item, index) => (
                <div key={index} className="flex justify-between items-center text-xs bg-green-50 p-2 rounded">
                  <span className="font-medium">{item.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-green-600">{item.points} pts</span>
                    <span className="text-gray-500">(${item.price})</span>
                  </div>
                </div>
              ))}
              {business.pricedItems.length > 2 && (
                <div className="text-xs text-gray-500 text-center">
                  +{business.pricedItems.length - 2} more items
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <h4 className="font-medium text-sm mb-2">Services Offered:</h4>
          <div className="flex flex-wrap gap-1">
            {business.servicesOffered.slice(0, 3).map((service, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {service}
              </Badge>
            ))}
            {business.servicesOffered.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{business.servicesOffered.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-sm mb-2">Looking For:</h4>
          <div className="flex flex-wrap gap-1">
            {business.wantingInReturn.map((want, index) => (
              <Badge key={index} variant="outline" className="text-xs bg-blue-50">
                {want}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{business.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{business.rating}</span>
            <span>({business.reviews})</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium">Value: </span>
            <span className="text-green-600">${business.estimatedValue}</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Mail className="h-4 w-4 mr-1" />
              Contact
            </Button>
            <Button size="sm" asChild>
              <Link to={`/listing/${business.id}`}>
                View Details
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessCard;
