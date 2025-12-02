import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Star, Mail, CheckCircle, Coins, User, Globe, ExternalLink, MessageSquare, ShoppingCart } from "lucide-react";
import InquiryModal from "@/components/merchant/InquiryModal";

// Mock data - in real app this would come from Supabase
const mockBusiness = {
  id: 1,
  businessName: "Digital Marketing Solutions",
  category: "Marketing",
  servicesOffered: ["Social Media Management", "SEO", "Content Creation", "PPC Advertising", "Email Marketing"],
  wantingInReturn: ["Legal Services", "Accounting", "Web Development"],
  estimatedValue: 500,
  location: "San Francisco, CA",
  contactMethod: "contact@digitalmarketing.com",
  rating: 4.8,
  reviews: 23,
  verified: true,
  points: 150,
  image: "photo-1460925895917-afdab827c52f",
  description: "Professional digital marketing services to help grow your online presence and reach your target audience effectively.",
  fullDescription: "We are a full-service digital marketing agency with over 5 years of experience helping businesses of all sizes achieve their online marketing goals. Our team of certified professionals specializes in creating comprehensive marketing strategies that drive real results.",
  owner: "Sarah Johnson",
  memberSince: "January 2023",
  completedTrades: 12,
  responseTime: "Within 2 hours",
  website: "https://digitalmarketing.com",
  socialMedia: {
    instagram: "@digitalmarketing",
    twitter: "@digmarketing",
    facebook: "digitalmarketingsolutions",
    linkedin: "company/digital-marketing-solutions"
  },
  pricedItems: [
    { name: "Logo Design Package", price: 200, points: 20 },
    { name: "SEO Audit", price: 150, points: 15 },
    { name: "Social Media Setup", price: 100, points: 10 },
    { name: "Content Strategy", price: 250, points: 25 }
  ]
};

const ListingDetail = () => {
  const { id } = useParams();
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to listings
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-2xl">{mockBusiness.businessName}</CardTitle>
                      {mockBusiness.verified && (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      )}
                    </div>
                    <Badge variant="secondary" className="mb-4">
                      {mockBusiness.category}
                    </Badge>
                    
                    {/* Website and Social Media */}
                    <div className="flex gap-3 mb-4">
                      {mockBusiness.website && (
                        <a 
                          href={mockBusiness.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <Globe className="h-4 w-4" />
                          Visit Website
                        </a>
                      )}
                      {Object.entries(mockBusiness.socialMedia).map(([platform, handle]) => 
                        handle ? (
                          <a 
                            key={platform}
                            href={getSocialUrl(platform, handle)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-gray-600 hover:text-blue-600 text-sm capitalize"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {platform}
                          </a>
                        ) : null
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-lg font-semibold text-green-600">
                    <Coins className="h-5 w-5" />
                    <span>{mockBusiness.points} pts</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{mockBusiness.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{mockBusiness.rating}</span>
                    <span>({mockBusiness.reviews} reviews)</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">About this business</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {mockBusiness.fullDescription}
                  </p>
                </div>

                {/* Priced Items */}
                {mockBusiness.pricedItems && mockBusiness.pricedItems.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Available for Purchase</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {mockBusiness.pricedItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-600">${item.price}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">{item.points} pts</div>
                            <Button size="sm" className="mt-1">Buy Now</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-lg mb-3">Services Offered</h3>
                  <div className="flex flex-wrap gap-2">
                    {mockBusiness.servicesOffered.map((service, index) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Looking For</h3>
                  <div className="flex flex-wrap gap-2">
                    {mockBusiness.wantingInReturn.map((want, index) => (
                      <Badge key={index} variant="outline" className="text-sm bg-blue-50">
                        {want}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact & Trade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    ${mockBusiness.estimatedValue}
                  </div>
                  <div className="text-sm text-gray-600">Estimated Value</div>
                </div>

                <div className="space-y-3">
                  <Button className="w-full" size="lg">
                    Request Trade
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setIsInquiryModalOpen(true)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Inquire or Purchase
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Directly
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Business Owner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium">{mockBusiness.owner}</div>
                    <div className="text-sm text-gray-600">
                      Member since {mockBusiness.memberSince}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                  <div className="text-center">
                    <div className="font-semibold">{mockBusiness.completedTrades}</div>
                    <div className="text-xs text-gray-600">Completed Trades</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{mockBusiness.responseTime}</div>
                    <div className="text-xs text-gray-600">Response Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="border-b pb-3 last:border-b-0">
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-700">
                      "Excellent service! Very professional and delivered exactly what was promised."
                    </p>
                    <p className="text-xs text-gray-500 mt-1">- Mike R.</p>
                  </div>
                  <div className="border-b pb-3 last:border-b-0">
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-700">
                      "Great communication and quick turnaround. Highly recommend!"
                    </p>
                    <p className="text-xs text-gray-500 mt-1">- Lisa K.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  View All Reviews
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <InquiryModal
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
        merchantName={mockBusiness.owner}
        businessName={mockBusiness.businessName}
        availableServices={mockBusiness.servicesOffered}
        pricedItems={mockBusiness.pricedItems}
      />
    </div>
  );
};

export default ListingDetail;
