import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OnboardingFormData } from '@/hooks/useOnboardingForm';
import { Building2, Tag, FileText } from 'lucide-react';

interface BusinessProfileStepProps {
  formData: OnboardingFormData;
  setFormData: React.Dispatch<React.SetStateAction<OnboardingFormData>>;
}

const categories = [
  'Professional Services',
  'Creative & Design',
  'Marketing & Advertising',
  'Technology & IT',
  'Health & Wellness',
  'Education & Training',
  'Construction & Trades',
  'Food & Beverage',
  'Retail',
  'Other'
];

const BusinessProfileStep: React.FC<BusinessProfileStepProps> = ({ formData, setFormData }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pb-4 border-b">
        <Building2 className="h-12 w-12 mx-auto mb-3 text-primary" />
        <h3 className="text-lg font-semibold">Tell us about your business</h3>
        <p className="text-sm text-muted-foreground mt-1">
          This information will be displayed on your public profile
        </p>
      </div>

      {/* Business Name */}
      <div className="space-y-2">
        <Label htmlFor="businessName" className="text-base font-medium flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Business Name *
        </Label>
        <Input
          id="businessName"
          value={formData.businessName}
          onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
          placeholder="Enter your business name"
          className="text-base"
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground">
          {formData.businessName.length}/100 characters
        </p>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category" className="text-base font-medium flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Business Category *
        </Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
        >
          <SelectTrigger className="text-base">
            <SelectValue placeholder="Select your business category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Choose the category that best describes your business
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-base font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Business Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe what makes your business unique and what services you provide..."
          rows={4}
          className="text-base resize-none"
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">
          {formData.description.length}/500 characters • Optional but recommended
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> A clear description helps other businesses understand what you offer and increases your chances of finding great trading partners.
        </p>
      </div>
    </div>
  );
};

export default BusinessProfileStep;
