
import { useState } from 'react';

export interface OnboardingFormData {
  businessName: string;
  category: string;
  servicesOffered: string[];
  wantingInReturn: string[];
  estimatedValue: string;
  location: string;
  contactMethod: string;
  description: string;
  website: string;
  socialMedia: {
    instagram: string;
    twitter: string;
    facebook: string;
    linkedin: string;
  };
  pricedItems: Array<{ name: string; price: number; points: number }>;
  barterPercentage: number;
  businessEIN?: string;
  businessLicense?: string;
  businessVerificationStatus?: 'pending' | 'verified' | 'rejected';
}

export const useOnboardingForm = () => {
  const [formData, setFormData] = useState<OnboardingFormData>({
    businessName: '',
    category: '',
    servicesOffered: [],
    wantingInReturn: [],
    estimatedValue: '',
    location: '',
    contactMethod: '',
    description: '',
    website: '',
    socialMedia: {
      instagram: '',
      twitter: '',
      facebook: '',
      linkedin: ''
    },
    pricedItems: [],
    barterPercentage: 20,
    businessVerificationStatus: 'pending'
  });

  return { formData, setFormData };
};
