
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Shield, AlertTriangle } from "lucide-react";

interface W9FormData {
  legalName: string;
  businessName: string;
  businessType: 'individual' | 'soleProprietor' | 'llc' | 'corporation' | 'partnership' | 'other';
  otherBusinessType: string;
  taxId: string;
  taxIdType: 'ssn' | 'ein';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  accountNumber: string;
  exemptFromBackupWithholding: boolean;
  certificationAgreed: boolean;
}

interface W9FormProps {
  onSubmit: (data: W9FormData) => void;
  onSkip: () => void;
  isRequired?: boolean;
}

const W9Form: React.FC<W9FormProps> = ({ onSubmit, onSkip, isRequired = true }) => {
  const [formData, setFormData] = useState<W9FormData>({
    legalName: '',
    businessName: '',
    businessType: 'individual',
    otherBusinessType: '',
    taxId: '',
    taxIdType: 'ssn',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    accountNumber: '',
    exemptFromBackupWithholding: false,
    certificationAgreed: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.legalName.trim()) {
      newErrors.legalName = 'Legal name is required';
    }

    if (!formData.taxId.trim()) {
      newErrors.taxId = 'Tax ID is required';
    } else {
      const taxIdClean = formData.taxId.replace(/\D/g, '');
      if (taxIdClean.length !== 9) {
        newErrors.taxId = 'Tax ID must be 9 digits';
      }
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    }

    if (!formData.certificationAgreed) {
      newErrors.certificationAgreed = 'You must agree to the certification';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setLoading(true);
      try {
        await onSubmit(formData);
      } catch (error) {
        console.error('Error submitting W-9:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSkip = () => {
    setLoading(true);
    onSkip();
  };

  const formatTaxId = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (formData.taxIdType === 'ein' && cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '-' + cleaned.slice(2, 9);
    }
    if (formData.taxIdType === 'ssn' && cleaned.length >= 3) {
      let formatted = cleaned.slice(0, 3);
      if (cleaned.length >= 5) {
        formatted += '-' + cleaned.slice(3, 5);
        if (cleaned.length >= 9) {
          formatted += '-' + cleaned.slice(5, 9);
        } else if (cleaned.length > 5) {
          formatted += '-' + cleaned.slice(5);
        }
      } else if (cleaned.length > 3) {
        formatted += '-' + cleaned.slice(3);
      }
      return formatted;
    }
    return cleaned;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          W-9 Tax Information Form
        </CardTitle>
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            This information is required for IRS tax reporting. All data is encrypted and stored securely.
          </AlertDescription>
        </Alert>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Legal Disclosure */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important Tax Notice:</strong> All barter transactions are considered taxable income and are reportable to the IRS. 
              By using this platform, you agree to receive IRS Form 1099-B at year-end if your total barter income exceeds $600.
              You are responsible for reporting all barter income on your tax return.
            </AlertDescription>
          </Alert>

          {/* Name Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="legalName">Legal Name (First, Middle, Last) *</Label>
              <Input
                id="legalName"
                value={formData.legalName}
                onChange={(e) => setFormData(prev => ({ ...prev, legalName: e.target.value }))}
                placeholder="John Doe"
              />
              {errors.legalName && <p className="text-sm text-red-600 mt-1">{errors.legalName}</p>}
            </div>

            <div>
              <Label htmlFor="businessName">Business Name (if different)</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                placeholder="ABC Services LLC"
              />
            </div>
          </div>

          {/* Business Classification */}
          <div>
            <Label>Federal Tax Classification</Label>
            <RadioGroup 
              value={formData.businessType} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, businessType: value as any }))}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual">Individual/sole proprietor</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="soleProprietor" id="soleProprietor" />
                <Label htmlFor="soleProprietor">Single-member LLC</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="llc" id="llc" />
                <Label htmlFor="llc">LLC (multi-member)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="corporation" id="corporation" />
                <Label htmlFor="corporation">Corporation</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partnership" id="partnership" />
                <Label htmlFor="partnership">Partnership</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Other</Label>
              </div>
            </RadioGroup>
            
            {formData.businessType === 'other' && (
              <Input
                className="mt-2"
                value={formData.otherBusinessType}
                onChange={(e) => setFormData(prev => ({ ...prev, otherBusinessType: e.target.value }))}
                placeholder="Specify other business type"
              />
            )}
          </div>

          {/* Tax ID Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tax ID Type *</Label>
              <RadioGroup 
                value={formData.taxIdType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, taxIdType: value as any, taxId: '' }))}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ssn" id="ssn" />
                  <Label htmlFor="ssn">Social Security Number</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ein" id="ein" />
                  <Label htmlFor="ein">Employer Identification Number</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="taxId">
                {formData.taxIdType === 'ssn' ? 'Social Security Number' : 'Employer ID Number'} *
              </Label>
              <Input
                id="taxId"
                value={formData.taxId}
                onChange={(e) => setFormData(prev => ({ ...prev, taxId: formatTaxId(e.target.value) }))}
                placeholder={formData.taxIdType === 'ssn' ? 'XXX-XX-XXXX' : 'XX-XXXXXXX'}
                maxLength={formData.taxIdType === 'ssn' ? 11 : 10}
              />
              {errors.taxId && <p className="text-sm text-red-600 mt-1">{errors.taxId}</p>}
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="123 Main Street"
              />
              {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="New York"
                />
                {errors.city && <p className="text-sm text-red-600 mt-1">{errors.city}</p>}
              </div>

              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="NY"
                  maxLength={2}
                />
                {errors.state && <p className="text-sm text-red-600 mt-1">{errors.state}</p>}
              </div>

              <div>
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                  placeholder="10001"
                />
                {errors.zipCode && <p className="text-sm text-red-600 mt-1">{errors.zipCode}</p>}
              </div>
            </div>
          </div>

          {/* Account Number */}
          <div>
            <Label htmlFor="accountNumber">Account Number (Optional)</Label>
            <Input
              id="accountNumber"
              value={formData.accountNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
              placeholder="Optional account number for your records"
            />
          </div>

          {/* Backup Withholding */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="exemptFromBackupWithholding"
              checked={formData.exemptFromBackupWithholding}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, exemptFromBackupWithholding: !!checked }))
              }
            />
            <Label htmlFor="exemptFromBackupWithholding">
              I am exempt from backup withholding
            </Label>
          </div>

          {/* Certification */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="certificationAgreed"
                checked={formData.certificationAgreed}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, certificationAgreed: !!checked }))
                }
              />
              <Label htmlFor="certificationAgreed" className="text-sm leading-relaxed">
                I certify that: (1) The number shown on this form is my correct taxpayer identification number, 
                (2) I am not subject to backup withholding because: (a) I am exempt from backup withholding, 
                or (b) I have not been notified by the IRS that I am subject to backup withholding, 
                (3) I am a U.S. citizen or other U.S. person, and (4) The FATCA code(s) entered on this form 
                (if any) indicating that I am exempt from FATCA reporting is correct. *
              </Label>
            </div>
            {errors.certificationAgreed && (
              <p className="text-sm text-red-600">{errors.certificationAgreed}</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-between pt-6">
            {!isRequired && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleSkip}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Skip for Now'}
              </Button>
            )}
            <Button 
              type="submit" 
              className="ml-auto"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit W-9 Information'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default W9Form;
