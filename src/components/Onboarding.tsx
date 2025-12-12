import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOnboardingForm } from '@/hooks/useOnboardingForm';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import OnboardingProgress from './onboarding/OnboardingProgress';
import BusinessProfileStep from './onboarding/BusinessProfileStep';
import ServicesPricingStep from './onboarding/ServicesPricingStep';
import ContactReviewStep from './onboarding/ContactReviewStep';
import W9Form from './tax/W9Form';
import W9PdfForm from './tax/W9PdfForm';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';

interface OnboardingProps {
  onComplete?: () => void;
}

// Validation schemas
const businessBasicsSchema = z.object({
  businessName: z.string().min(1, "Business name is required").max(100),
  category: z.string().min(1, "Category is required"),
  description: z.string().max(500).optional(),
});

const servicesSchema = z.object({
  servicesOffered: z.array(z.string()).min(1, "At least one service is required"),
  wantingInReturn: z.array(z.string()).min(1, "At least one service wanted is required"),
  estimatedValue: z.string().min(1, "Estimated value is required"),
});

const contactLocationSchema = z.object({
  location: z.string().min(1, "Location is required").max(200),
  contactMethod: z.string().min(1, "Contact method is required").max(200),
});

const stepTitles = [
  "Business Profile",
  "Services & Pricing", 
  "Contact & Review",
  "Tax Information"
];

const steps = [
  "Profile",
  "Services", 
  "Contact",
  "Tax"
];

const ONBOARDING_BACKUP_KEY = 'barterex_onboarding_backup';

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileChecked, setProfileChecked] = useState(false);
  const { formData, setFormData } = useOnboardingForm();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Check auth state and profile on mount
  useEffect(() => {
    const checkAuthAndProfile = async () => {
      if (authLoading) return;

      if (!user) {
        console.log('No user found, redirecting to auth');
        toast({
          title: "Authentication required",
          description: "Please sign in to continue",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      // Check if profile exists
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, onboarding_completed')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile check error:', profileError);
          setError('Failed to load profile. Please refresh the page.');
          return;
        }

        if (!profile) {
          console.error('Profile not found for user:', user.id);
          setError('Profile not found. Please sign out and sign in again.');
          return;
        }

        if (profile.onboarding_completed) {
          console.log('Onboarding already completed, redirecting to dashboard');
          navigate('/dashboard');
          return;
        }

        setProfileChecked(true);

        // Try to restore from backup
        const backup = localStorage.getItem(ONBOARDING_BACKUP_KEY);
        if (backup) {
          try {
            const backupData = JSON.parse(backup);
            setFormData(prev => ({ ...prev, ...backupData }));
            toast({
              title: "Progress restored",
              description: "We've restored your previous onboarding data.",
            });
          } catch (e) {
            console.error('Failed to restore backup:', e);
          }
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        setError('Failed to verify profile. Please try again.');
      }
    };

    checkAuthAndProfile();
  }, [user, authLoading, navigate, setFormData]);

  // Auto-save form data to localStorage
  useEffect(() => {
    if (profileChecked && user) {
      try {
        localStorage.setItem(ONBOARDING_BACKUP_KEY, JSON.stringify(formData));
      } catch (e) {
        console.error('Failed to backup form data:', e);
      }
    }
  }, [formData, profileChecked, user]);

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const validateStep = (stepNum: number): { valid: boolean; error?: string } => {
    try {
      switch (stepNum) {
        case 1:
          businessBasicsSchema.parse(formData);
          return { valid: true };
        case 2:
          servicesSchema.parse(formData);
          return { valid: true };
        case 3:
          contactLocationSchema.parse(formData);
          return { valid: true };
        case 4:
          return { valid: true }; // W9 is optional
        default:
          return { valid: false, error: 'Invalid step' };
      }
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return { valid: false, error: validationError.errors[0].message };
      }
      return { valid: false, error: 'Validation failed' };
    }
  };

  const handleW9Submit = async (w9Data: any) => {
    if (!user) return;
    
    try {
      console.log('Saving W-9 data:', w9Data);
      
      const { error: w9Error } = await supabase
        .from('tax_info')
        .insert({
          user_id: user.id,
          legal_name: w9Data.legalName,
          business_name: w9Data.businessName,
          business_type: w9Data.businessType,
          other_business_type: w9Data.otherBusinessType,
          tax_id: w9Data.taxId,
          tax_id_type: w9Data.taxIdType,
          address: w9Data.address,
          city: w9Data.city,
          state: w9Data.state,
          zip_code: w9Data.zipCode,
          account_number: w9Data.accountNumber,
          exempt_from_backup_withholding: w9Data.exemptFromBackupWithholding,
          certification_agreed: w9Data.certificationAgreed,
          signature: w9Data.signature,
          signature_date: w9Data.signatureDate
        });

      if (w9Error) {
        console.error('W-9 save error:', w9Error);
        throw new Error(`Failed to save W-9 information: ${w9Error.message}`);
      }

      console.log('W-9 saved successfully');
      completeOnboarding();
    } catch (error: any) {
      console.error('Error saving W-9:', error);
      setError(error.message || 'Failed to save W-9 information');
      toast({
        title: "Error saving W-9",
        description: error.message || 'Failed to save W-9 information',
        variant: "destructive"
      });
    }
  };

  const completeOnboarding = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Starting onboarding completion for user:', user.id);

      // Final validation
      const validation = validateStep(3); // Validate up to contact step
      if (!validation.valid) {
        throw new Error(validation.error || 'Please complete all required fields');
      }

      // Create business listing
      const listingData = {
        user_id: user.id,
        business_name: formData.businessName,
        category: formData.category,
        description: formData.description || '',
        services_offered: formData.servicesOffered,
        wanting_in_return: formData.wantingInReturn,
        estimated_value: parseFloat(formData.estimatedValue) || 0,
        location: formData.location,
        contact_method: formData.contactMethod,
        barter_percentage: formData.barterPercentage || 20,
        status: 'active'
      };

      console.log('Creating business listing...');

      const { error: listingError } = await supabase
        .from('businesses')
        .insert(listingData);

      if (listingError) {
        console.error('Business listing error:', listingError);
        throw new Error(`Failed to create business listing: ${listingError.message}`);
      }

      console.log('Business listing created successfully');

      // Update profile to mark onboarding as complete
      const profileData = {
        onboarding_completed: true,
        business_name: formData.businessName,
        location: formData.location,
        website: formData.website || null,
        barter_percentage: formData.barterPercentage || 20,
        business_verified: formData.businessVerificationStatus === 'verified'
      };

      console.log('Updating profile...');

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }

      // Log the onboarding completion
      try {
        await supabase
          .from('audit_logs')
          .insert({
            user_id: user.id,
            action: 'onboarding_completed',
            table_name: 'profiles',
            record_id: user.id,
            new_data: profileData
          });
      } catch (logError) {
        console.error('Audit log failed:', logError);
        // Don't fail onboarding if logging fails
      }

      console.log('Onboarding completed successfully');
      
      // Clear backup
      localStorage.removeItem(ONBOARDING_BACKUP_KEY);

      toast({
        title: "Welcome to BarterEx!",
        description: "Your business profile is now active.",
      });
      
      if (onComplete) {
        onComplete();
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      setError(error.message || 'Failed to complete onboarding. Please try again.');
      
      toast({
        title: "Onboarding failed",
        description: error.message || 'Please try again or contact support if the issue persists.',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    const validation = validateStep(step);
    return validation.valid;
  };

  const handleNextStep = () => {
    const validation = validateStep(step);
    if (!validation.valid) {
      setError(validation.error || 'Please complete all required fields');
      toast({
        title: "Validation error",
        description: validation.error || 'Please complete all required fields',
        variant: "destructive"
      });
      return;
    }
    setError('');
    nextStep();
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return <BusinessProfileStep formData={formData} setFormData={setFormData} />;
      case 2:
        return <ServicesPricingStep formData={formData} setFormData={setFormData} />;
      case 3:
        return <ContactReviewStep formData={formData} setFormData={setFormData} />;
      case 4:
        // Feature flag: Use PDF W-9 form (set to false to use HTML form)
        const USE_PDF_W9 = false;
        const W9Component = USE_PDF_W9 ? W9PdfForm : W9Form;

        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-blue-800 text-sm">
                <strong>Optional:</strong> You can complete your W-9 tax information now or skip and do it later from your dashboard. This information is required for tax reporting if you earn income through the platform.
              </p>
            </div>
            <W9Component
              onSubmit={handleW9Submit}
              onSkip={completeOnboarding}
              isRequired={false}
            />
            
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={loading}
              >
                Previous
              </Button>
              
              <Button
                onClick={completeOnboarding}
                disabled={loading}
              >
                {loading ? 'Completing...' : 'Skip & Complete Setup'}
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!profileChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="space-y-4">
          <OnboardingProgress currentStep={step} totalSteps={4} steps={steps} />
          <div>
            <CardTitle className="text-2xl">{stepTitles[step - 1]}</CardTitle>
            <CardDescription className="text-base mt-2">
              {step === 1 && "Tell us about your business to get started"}
              {step === 2 && "Define what you offer and what you're looking to trade"}
              {step === 3 && "Add contact details and review your profile"}
              {step === 4 && "Optional tax information for compliance"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-md p-4">
              <p className="text-destructive text-sm font-medium">{error}</p>
            </div>
          )}

          {renderStepContent()}

          {step < 4 && (
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={step === 1 || loading}
                size="lg"
              >
                Previous
              </Button>
              
              <Button
                onClick={handleNextStep}
                disabled={!isStepValid() || loading}
                size="lg"
              >
                {loading ? 'Saving...' : step === 3 ? 'Continue to Tax Info' : 'Next'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
