import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OnboardingFormData } from '@/hooks/useOnboardingForm';
import { MapPin, Mail, Globe, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

interface ContactReviewStepProps {
  formData: OnboardingFormData;
  setFormData: React.Dispatch<React.SetStateAction<OnboardingFormData>>;
}

const ContactReviewStep: React.FC<ContactReviewStepProps> = ({ formData, setFormData }) => {
  const [showOnlinePresence, setShowOnlinePresence] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pb-4 border-b">
        <Mail className="h-12 w-12 mx-auto mb-3 text-primary" />
        <h3 className="text-lg font-semibold">How can people reach you?</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Provide your contact details and review your profile
        </p>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="location" className="text-base font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location *
          </Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="City, State or Region"
            className="text-base"
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">
            Where is your business located? (e.g., "San Francisco, CA")
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactMethod" className="text-base font-medium flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Preferred Contact Method *
          </Label>
          <Input
            id="contactMethod"
            value={formData.contactMethod}
            onChange={(e) => setFormData(prev => ({ ...prev, contactMethod: e.target.value }))}
            placeholder="Email or phone number"
            className="text-base"
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">
            How should people contact you? (e.g., email@example.com or (555) 123-4567)
          </p>
        </div>
      </div>

      {/* Optional Online Presence */}
      <div className="space-y-3 pt-2">
        <Button
          variant="outline"
          onClick={() => setShowOnlinePresence(!showOnlinePresence)}
          className="w-full justify-between"
          type="button"
        >
          <span className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Online Presence (Optional)
          </span>
          {showOnlinePresence ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {showOnlinePresence && (
          <div className="space-y-4 pl-4 border-l-2 border-border">
            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://yourwebsite.com"
                type="url"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="instagram" className="text-sm">Instagram</Label>
                <Input
                  id="instagram"
                  value={formData.socialMedia.instagram}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                  }))}
                  placeholder="@username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook" className="text-sm">Facebook</Label>
                <Input
                  id="facebook"
                  value={formData.socialMedia.facebook}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    socialMedia: { ...prev.socialMedia, facebook: e.target.value }
                  }))}
                  placeholder="@username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter" className="text-sm">Twitter/X</Label>
                <Input
                  id="twitter"
                  value={formData.socialMedia.twitter}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    socialMedia: { ...prev.socialMedia, twitter: e.target.value }
                  }))}
                  placeholder="@username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="text-sm">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={formData.socialMedia.linkedin}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    socialMedia: { ...prev.socialMedia, linkedin: e.target.value }
                  }))}
                  placeholder="@username"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator className="my-6" />

      {/* Review Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-base">Review Your Profile</h4>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Business Info */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Business Name</p>
              <p className="text-base font-semibold">{formData.businessName || '—'}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Category</p>
              <p className="text-base">{formData.category || '—'}</p>
            </div>

            {formData.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm text-foreground/80">{formData.description}</p>
              </div>
            )}

            <Separator />

            {/* Services */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Services Offered</p>
              <div className="flex flex-wrap gap-2">
                {formData.servicesOffered.length > 0 ? (
                  formData.servicesOffered.map((service) => (
                    <span key={service} className="px-2 py-1 bg-secondary text-xs rounded-md">
                      {service}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Looking For</p>
              <div className="flex flex-wrap gap-2">
                {formData.wantingInReturn.length > 0 ? (
                  formData.wantingInReturn.map((want) => (
                    <span key={want} className="px-2 py-1 bg-blue-50 text-xs rounded-md border border-blue-200">
                      {want}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Estimated Monthly Value</p>
              <p className="text-base font-semibold">${formData.estimatedValue || '—'}</p>
            </div>

            {formData.pricedItems.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Priced Items</p>
                <div className="space-y-1">
                  {formData.pricedItems.map((item, idx) => (
                    <div key={idx} className="text-sm">
                      {item.name} - ${item.price} ({item.points} points)
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Contact */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Location</p>
              <p className="text-base">{formData.location || '—'}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Contact Method</p>
              <p className="text-base">{formData.contactMethod || '—'}</p>
            </div>

            {formData.website && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Website</p>
                <p className="text-sm text-blue-600 hover:underline">
                  <a href={formData.website} target="_blank" rel="noopener noreferrer">
                    {formData.website}
                  </a>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <strong>✓ Looking good!</strong> Review your information above. You can go back to edit any section if needed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactReviewStep;
