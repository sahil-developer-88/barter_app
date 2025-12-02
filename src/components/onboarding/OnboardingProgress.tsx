
import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({ currentStep, totalSteps, steps }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center">
              {index + 1 < currentStep ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : index + 1 === currentStep ? (
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{index + 1}</span>
                </div>
              ) : (
                <Circle className="h-8 w-8 text-gray-300" />
              )}
              <span className={`text-xs mt-2 text-center max-w-20 ${
                index + 1 <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-400'
              }`}>
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`h-0.5 w-16 mx-2 ${
                index + 1 < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
      <p className="text-sm text-gray-600 mt-2">
        Step {currentStep} of {totalSteps} - {Math.round((currentStep / totalSteps) * 100)}% complete
      </p>
    </div>
  );
};

export default OnboardingProgress;
