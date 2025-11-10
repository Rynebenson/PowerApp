'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: (data: {
    name: string;
    email?: string;
    phone?: string;
  }) => Promise<void>;
  onClose?: () => void;
}

export default function OnboardingWizard({ onComplete, onClose }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Workspace name
  const [name, setName] = useState('');

  // Step 2: Contact details
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await onComplete({
        name,
        email: email || undefined,
        phone: phone || undefined,
      });
    } catch (error) {
      console.error('Onboarding error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return true; // Optional fields
    return false;
  };

  const stepTitles = ['Workspace name', 'Contact details'];

  return (
    <div className="fixed inset-0 w-full h-full bg-background dark:bg-zinc-900 flex flex-col" style={{ zIndex: 9999 }}>
      <div className="flex items-center justify-between p-8 pb-6">
        <h2 className="text-2xl font-semibold">Create a workspace</h2>
        {onClose ? (
          <button className="text-muted-foreground hover:text-foreground" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        ) : (
          <button className="text-muted-foreground hover:text-foreground" disabled>
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="md:hidden mx-8 mb-4 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="font-medium">{stepTitles[step - 1]}</span>
          <span className="text-sm text-muted-foreground">{step} of 2</span>
        </div>
      </div>

      <div className="flex-1 flex gap-12 max-w-4xl mx-auto w-full px-8 md:pt-8 overflow-y-auto">
        <div className="hidden md:flex flex-col items-center w-32 shrink-0">
          <div className="flex flex-col items-center">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium ${
              step === 1 ? 'border-foreground bg-foreground text-background' : 
              step > 1 ? 'border-foreground text-foreground' : 
              'border-border text-muted-foreground'
            }`}>
              1
            </div>
            <div className="text-sm mt-2 text-center">
              Workspace name
            </div>
            <div className={`w-px h-16 my-4 ${
              step > 1 ? 'bg-foreground' : 'bg-border'
            }`} />
          </div>
          
          <div className="flex flex-col items-center">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium ${
              step === 2 ? 'border-foreground bg-foreground text-background' : 
              'border-border text-muted-foreground'
            }`}>
              2
            </div>
            <div className="text-sm mt-2 text-center">
              Contact details
            </div>
          </div>
        </div>

        {/* Right content area */}
        <div className="flex-1 w-full">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Workspace name</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a name for your workspace
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Workspace name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Acme Inc, My Company"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                  />
                  <p className="text-xs text-muted-foreground">
                    {name.length} of 80 characters
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Contact details</h3>
                  <p className="text-sm text-muted-foreground">
                    Add your workspace contact information (optional)
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contact@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Footer with navigation buttons */}
      <div className="px-8 py-6 border-t mt-auto">
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between items-stretch sm:items-center max-w-4xl mx-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1 || loading}
            className="w-full sm:w-auto"
          >
            Back
          </Button>
          
          {step < 2 ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid() || loading}
              className="bg-blue-600 hover:bg-blue-500 text-white w-full sm:w-auto"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!isStepValid() || loading}
              className="bg-blue-600 hover:bg-blue-500 text-white w-full sm:w-auto"
            >
              {loading ? 'Creating...' : 'Create Workspace'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
