import React from 'react';
import { STEPS_CONFIG } from '../constants';

interface StepIndicatorProps {
  currentStepIndex: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStepIndex }) => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {STEPS_CONFIG.map((step, stepIdx) => (
          <li key={step.title} className={`relative ${stepIdx !== STEPS_CONFIG.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
            {stepIdx < currentStepIndex ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-qwen-primary" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center bg-qwen-primary rounded-full">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
                  </svg>
                   <span className="absolute top-10 text-center w-24 text-xs text-qwen-primary font-semibold">{step.title}</span>
                </div>
              </>
            ) : stepIdx === currentStepIndex ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-qwen-border" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center bg-qwen-panel rounded-full border-2 border-qwen-secondary">
                   <span className="h-2.5 w-2.5 bg-qwen-secondary rounded-full" aria-hidden="true" />
                   <span className="absolute top-10 text-center w-24 text-xs text-qwen-secondary font-bold">{step.title}</span>
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-qwen-border" />
                </div>
                <div className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-qwen-border bg-qwen-panel">
                   <span className="h-2.5 w-2.5 bg-transparent rounded-full" aria-hidden="true" />
                   <span className="absolute top-10 text-center w-24 text-xs text-qwen-text-secondary font-medium">{step.title}</span>
                </div>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};


export default StepIndicator;