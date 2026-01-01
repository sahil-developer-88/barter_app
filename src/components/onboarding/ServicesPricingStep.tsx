import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, DollarSign, Handshake, Search } from 'lucide-react';
import { OnboardingFormData } from '@/hooks/useOnboardingForm';

interface ServicesPricingStepProps {
  formData: OnboardingFormData;
  setFormData: React.Dispatch<React.SetStateAction<OnboardingFormData>>;
}

// Comprehensive suggested services for ALL categories
const suggestedServices = {
  'Professional Services': [
    'Consulting', 'Legal Services', 'Accounting', 'Business Planning',
    'Tax Preparation', 'Bookkeeping', 'Financial Planning', 'HR Consulting',
    'Real Estate Services', 'Insurance Services', 'Notary Services', 'Payroll Services'
  ],
  'Creative & Design': [
    'Logo Design', 'Web Design', 'Graphic Design', 'Photography', 'Video Production',
    'Branding', 'UI/UX Design', 'Illustration', 'Animation', 'Print Design',
    'Packaging Design', 'Product Photography', 'Event Photography', '3D Modeling'
  ],
  'Marketing & Advertising': [
    'Social Media Marketing', 'SEO', 'Content Writing', 'Email Marketing',
    'Google Ads', 'Facebook Ads', 'Influencer Marketing', 'PR Services',
    'Market Research', 'Brand Strategy', 'Copywriting', 'Video Marketing', 'PPC Campaigns'
  ],
  'Technology & IT': [
    'Web Development', 'App Development', 'IT Support', 'Software Development',
    'Cloud Services', 'Cybersecurity', 'Network Setup', 'Data Analytics',
    'E-commerce Setup', 'WordPress Development', 'Database Management', 'Tech Consulting'
  ],
  'Health & Wellness': [
    'Fitness Training', 'Nutrition Consulting', 'Massage Therapy', 'Life Coaching',
    'Yoga Classes', 'Physical Therapy', 'Mental Health Counseling', 'Acupuncture',
    'Chiropractic Care', 'Personal Training', 'Weight Loss Coaching', 'Meditation Classes'
  ],
  'Retail': [
    'Clothing Sales', 'Shoes & Footwear', 'Accessories', 'Jewelry', 'Electronics',
    'Home Goods', 'Furniture', 'Books & Magazines', 'Toys & Games', 'Sports Equipment',
    'Pet Supplies', 'Beauty Products', 'Gifts & Souvenirs', 'Art & Crafts Supplies'
  ],
  'Clothing & Fashion': [
    "Women's Clothing", "Men's Clothing", "Kids Clothing", "Baby Clothing",
    'Activewear', 'Formal Wear', 'Casual Wear', 'Vintage Clothing',
    'Plus Size Clothing', 'Maternity Wear', 'Swimwear', 'Outerwear',
    'Underwear & Lingerie', 'Shoes & Boots', 'Handbags & Purses',
    'Belts & Accessories', 'Hats & Caps', 'Scarves & Shawls', 'Sunglasses & Eyewear',
    'Custom Tailoring', 'Alterations & Repairs', 'Clothing Rental', 'Costume Rentals'
  ],
  'Food & Beverage': [
    'Restaurant Dining', 'Cafe & Coffee Shop', 'Bakery', 'Catering Services', 'Food Truck',
    'Bar & Cocktails', 'Nightclub', 'Meal Prep Services', 'Private Chef',
    'Cooking Classes', 'Grocery Delivery', 'Specialty Foods', 'Organic Products',
    'Food & Wine Pairing', 'Bartending Services'
  ],
  'Home Services': [
    'Cleaning Services', 'Landscaping & Lawn Care', 'Plumbing', 'Electrical Work', 'HVAC Services',
    'Painting & Decorating', 'Carpentry', 'Roofing', 'Pool Maintenance', 'Pest Control',
    'Moving & Storage', 'Handyman Services', 'Interior Design', 'Home Staging',
    'Window Cleaning', 'Gutter Cleaning', 'Pressure Washing'
  ],
  'Automotive': [
    'Auto Repair & Maintenance', 'Oil Changes', 'Tire Services', 'Car Detailing', 'Car Wash',
    'Body Work & Collision Repair', 'Towing Services', 'Mobile Mechanic', 'Paint & Bodywork',
    'Window Tinting', 'Brake Services', 'Transmission Repair', 'Engine Diagnostics'
  ],
  'Beauty & Personal Care': [
    'Hair Salon Services', 'Barbershop', 'Nail Salon & Manicures', 'Spa Services', 'Makeup Artist',
    'Skincare Treatments', 'Waxing & Hair Removal', 'Eyelash Extensions', 'Tattoo & Piercing',
    'Tanning Services', 'Facials', 'Body Treatments', 'Brow Services', 'Hair Color & Highlights'
  ],
  'Education & Training': [
    'Tutoring Services', 'Music Lessons', 'Art Classes', 'Dance Classes', 'Language Classes',
    'Test Prep & SAT/ACT', 'Career Coaching', 'Online Courses', 'Workshops & Seminars',
    'Professional Development', 'Computer Training', 'Public Speaking Coaching'
  ],
  'Entertainment & Events': [
    'Event Planning', 'DJ Services', 'Live Music & Bands', 'Photography & Videography',
    'Party Rentals', 'Event Catering', 'Venue Rental', 'Entertainment Booking',
    'Photo Booth Rental', 'Wedding Planning', 'Corporate Events', 'Kids Parties'
  ],
  'Construction & Trades': [
    'General Contracting', 'Remodeling', 'Kitchen & Bath Renovation', 'Flooring Installation',
    'Drywall & Painting', 'Tile Work', 'Concrete Work', 'Fencing', 'Deck Building',
    'Window Installation', 'Door Installation', 'Insulation Services'
  ],
  'Pet Services': [
    'Veterinary Care', 'Pet Grooming', 'Dog Walking', 'Pet Sitting', 'Pet Training',
    'Pet Boarding', 'Mobile Vet Services', 'Pet Photography', 'Pet Supplies'
  ]
};

const ServicesPricingStep: React.FC<ServicesPricingStepProps> = ({ formData, setFormData }) => {
  const [newService, setNewService] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = suggestedServices[formData.category as keyof typeof suggestedServices] || [];

  const addService = (service?: string) => {
    const serviceToAdd = service || newService.trim();
    if (serviceToAdd && !formData.servicesOffered.includes(serviceToAdd)) {
      setFormData(prev => ({
        ...prev,
        servicesOffered: [...prev.servicesOffered, serviceToAdd]
      }));
      setNewService('');
      setShowSuggestions(false);
    }
  };

  const removeService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      servicesOffered: prev.servicesOffered.filter(s => s !== service)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pb-4 border-b">
        <Handshake className="h-12 w-12 mx-auto mb-3 text-primary" />
        <h3 className="text-lg font-semibold">What do you offer and need?</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Define your services, barter terms, and what you're looking to trade for
        </p>
      </div>

      {/* Barter Percentage */}
      <div className="space-y-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <Label htmlFor="barterPercentage" className="text-base font-medium flex items-center gap-2">
          <Handshake className="h-4 w-4 text-blue-600" />
          Barter Percentage *
        </Label>
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Input
              id="barterPercentage"
              type="number"
              value={formData.barterPercentage || 100}
              onChange={(e) => {
                const value = Math.min(100, Math.max(10, Number(e.target.value)));
                setFormData(prev => ({ ...prev, barterPercentage: value }));
              }}
              placeholder="100"
              min="10"
              max="100"
              step="5"
              className="text-base w-32"
            />
            <span className="text-2xl font-bold text-blue-600">{formData.barterPercentage || 100}%</span>
            {formData.barterPercentage === 100 && (
              <Badge className="bg-green-600 hover:bg-green-700">
                Recommended
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            The percentage of each transaction you're willing to accept in barter instead of cash (10-100%).
            For example, 100% means full barter transactions, 50% means on a $100 sale, you'd accept $50 in barter points and $50 in cash.
          </p>
        </div>
      </div>

      {/* Services Offered */}
      <div className="space-y-3">
        <Label className="text-base font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Services You Offer *
        </Label>
        <div className="flex gap-2">
          <Input
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="e.g., Logo Design, SEO, Legal Consultation"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
            className="text-base"
          />
          <Button onClick={() => addService()} size="sm" type="button">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-medium text-blue-900 mb-2">💡 Suggested services:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <Badge
                  key={suggestion}
                  variant="outline"
                  className="cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => addService(suggestion)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {suggestion}
                </Badge>
              ))}
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-blue-100 transition-colors border-dashed"
                onClick={() => setShowSuggestions(false)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Other (type custom)
              </Badge>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {formData.servicesOffered.map((service) => (
            <Badge key={service} variant="secondary" className="pr-1 text-sm py-1">
              {service}
              <button
                onClick={() => removeService(service)}
                className="ml-2 hover:text-destructive transition-colors"
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        {formData.servicesOffered.length === 0 && (
          <p className="text-xs text-muted-foreground">Add at least one service you offer</p>
        )}
      </div>

    </div>
  );
};

export default ServicesPricingStep;
