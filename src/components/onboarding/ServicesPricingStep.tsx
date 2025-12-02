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

// Suggested services for quick adding
const suggestedServices = {
  'Professional Services': ['Consulting', 'Legal Services', 'Accounting', 'Business Planning'],
  'Creative & Design': ['Logo Design', 'Web Design', 'Graphic Design', 'Photography', 'Video Production'],
  'Marketing & Advertising': ['Social Media Marketing', 'SEO', 'Content Writing', 'Email Marketing'],
  'Technology & IT': ['Web Development', 'App Development', 'IT Support', 'Software Development'],
  'Health & Wellness': ['Fitness Training', 'Nutrition Consulting', 'Massage Therapy', 'Life Coaching'],
};

const ServicesPricingStep: React.FC<ServicesPricingStepProps> = ({ formData, setFormData }) => {
  const [newService, setNewService] = useState('');
  const [newWant, setNewWant] = useState('');
  const [newItem, setNewItem] = useState({ name: '', price: '' });
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

  const addWant = () => {
    if (newWant.trim() && !formData.wantingInReturn.includes(newWant.trim())) {
      setFormData(prev => ({
        ...prev,
        wantingInReturn: [...prev.wantingInReturn, newWant.trim()]
      }));
      setNewWant('');
    }
  };

  const removeWant = (want: string) => {
    setFormData(prev => ({
      ...prev,
      wantingInReturn: prev.wantingInReturn.filter(w => w !== want)
    }));
  };

  const addPricedItem = () => {
    if (newItem.name.trim() && newItem.price) {
      const price = Number(newItem.price);
      const points = Math.round(price / 10);
      setFormData(prev => ({
        ...prev,
        pricedItems: [...prev.pricedItems, { 
          name: newItem.name.trim(), 
          price, 
          points 
        }]
      }));
      setNewItem({ name: '', price: '' });
    }
  };

  const removePricedItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      pricedItems: prev.pricedItems.filter((_, i) => i !== index)
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
              value={formData.barterPercentage || 20}
              onChange={(e) => {
                const value = Math.min(100, Math.max(0, Number(e.target.value)));
                setFormData(prev => ({ ...prev, barterPercentage: value }));
              }}
              placeholder="20"
              min="0"
              max="100"
              step="5"
              className="text-base w-32"
            />
            <span className="text-2xl font-bold text-blue-600">{formData.barterPercentage || 20}%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            The percentage of each transaction you're willing to accept in barter instead of cash. 
            For example, 20% means on a $100 sale, you'd accept $20 in barter points and $80 in cash.
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

      {/* Services Wanted */}
      <div className="space-y-3">
        <Label className="text-base font-medium flex items-center gap-2">
          <Search className="h-4 w-4" />
          What You're Looking For *
        </Label>
        <div className="flex gap-2">
          <Input
            value={newWant}
            onChange={(e) => setNewWant(e.target.value)}
            placeholder="e.g., Marketing Services, Accounting, Photography"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addWant())}
            className="text-base"
          />
          <Button onClick={addWant} size="sm" type="button">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.wantingInReturn.map((want) => (
            <Badge key={want} variant="outline" className="pr-1 text-sm py-1">
              {want}
              <button
                onClick={() => removeWant(want)}
                className="ml-2 hover:text-destructive transition-colors"
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        {formData.wantingInReturn.length === 0 && (
          <p className="text-xs text-muted-foreground">Add at least one service you're looking for</p>
        )}
      </div>

      {/* Estimated Value */}
      <div className="space-y-2">
        <Label htmlFor="estimatedValue" className="text-base font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Estimated Monthly Value (USD) *
        </Label>
        <Input
          id="estimatedValue"
          type="number"
          value={formData.estimatedValue}
          onChange={(e) => setFormData(prev => ({ ...prev, estimatedValue: e.target.value }))}
          placeholder="500"
          min="0"
          step="50"
          className="text-base"
        />
        <p className="text-xs text-muted-foreground">
          Approximate monthly value of services you can provide (helps with matching)
        </p>
      </div>

      {/* Priced Items - Optional */}
      <div className="space-y-3 pt-4 border-t">
        <div>
          <Label className="text-base font-medium">Priced Items/Services (Optional)</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Add specific items with prices for barter point purchases (1 point = $10)
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Input
            value={newItem.name}
            onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Item/Service name"
          />
          <div className="flex gap-2">
            <Input
              type="number"
              value={newItem.price}
              onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
              placeholder="Price ($)"
              min="0"
            />
            <Button onClick={addPricedItem} size="sm" type="button">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {formData.pricedItems.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {formData.pricedItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div>
                  <span className="font-medium text-sm">{item.name}</span>
                  <div className="text-xs text-muted-foreground">
                    ${item.price} • {item.points} points
                  </div>
                </div>
                <button
                  onClick={() => removePricedItem(index)}
                  className="text-destructive hover:text-destructive/80 transition-colors"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesPricingStep;
