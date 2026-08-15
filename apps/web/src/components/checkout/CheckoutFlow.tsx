'use client';

import { useState } from 'react';
import { PaymentMethodCard } from './PaymentMethodCard';

interface CheckoutFlowProps {
  onComplete?: (data: any) => void;
}

type Step = 'details' | 'payment' | 'confirm';

export function CheckoutFlow({ onComplete }: CheckoutFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>('details');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [selectedPayment, setSelectedPayment] = useState<string>('mpesa');

  const PAYMENT_METHODS = [
    {
      id: 'mpesa',
      icon: '📱',
      name: 'M-Pesa',
      description: 'Mobile money via SMS prompt',
      processingTime: '< 30 seconds',
      fee: 'No fee',
    },
    {
      id: 'flutterwave',
      icon: '💳',
      name: 'Flutterwave',
      description: 'Card, mobile money, bank transfer',
      processingTime: '1-2 minutes',
      fee: 'No fee',
    },
    {
      id: 'stripe',
      icon: '💰',
      name: 'Stripe',
      description: 'International cards & wallets',
      processingTime: 'Instant',
      fee: 'No fee',
    },
  ];

  const steps = [
    { id: 'details', label: 'Guest Details', number: 1 },
    { id: 'payment', label: 'Payment', number: 2 },
    { id: 'confirm', label: 'Confirm', number: 3 },
  ];

  const currentStepNumber = steps.findIndex(s => s.id === currentStep) + 1;
  const progressPercent = (currentStepNumber / steps.length) * 100;

  const handleNextStep = () => {
    if (currentStep === 'details') setCurrentStep('payment');
    else if (currentStep === 'payment') setCurrentStep('confirm');
  };

  const handlePrevStep = () => {
    if (currentStep === 'confirm') setCurrentStep('payment');
    else if (currentStep === 'payment') setCurrentStep('details');
  };

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all ${
                  idx < currentStepNumber
                    ? 'bg-orange-600 text-white'
                    : idx === currentStepNumber - 1
                    ? 'bg-orange-600 text-white border-2 border-orange-300'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {idx < currentStepNumber - 1 ? '✓' : step.number}
              </div>
              <span className="text-xs text-center text-gray-700">{step.label}</span>
            </div>
          ))}
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="min-h-80">
        {/* Step 1: Guest Details */}
        {currentStep === 'details' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Guest Information</h2>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-300 text-sm"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-300 text-sm"
              />
            </div>
            <input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-300 text-sm"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-300 text-sm"
            />
          </div>
        )}

        {/* Step 2: Payment Method */}
        {currentStep === 'payment' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Choose Payment Method</h2>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <PaymentMethodCard
                  key={method.id}
                  {...method}
                  isSelected={selectedPayment === method.id}
                  onSelect={setSelectedPayment}
                />
              ))}
            </div>
            <p className="text-xs text-gray-600 flex items-center gap-2">
              🔒 All payments are encrypted and secure
            </p>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 'confirm' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Review & Confirm</h2>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Guest Name</p>
                  <p className="font-semibold text-gray-900">
                    {formData.firstName} {formData.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{formData.email}</p>
                </div>
                <div>
                  <p className="text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-900">{formData.phone}</p>
                </div>
                <div>
                  <p className="text-gray-600">Payment Method</p>
                  <p className="font-semibold text-gray-900">
                    {PAYMENT_METHODS.find(m => m.id === selectedPayment)?.name}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex gap-2">
              <span className="text-lg">✓</span>
              <div>
                <p className="text-sm font-semibold text-green-900">Ready to book!</p>
                <p className="text-xs text-green-800">Click continue to complete your booking</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={handlePrevStep}
          disabled={currentStep === 'details'}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
            currentStep === 'details'
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50'
          }`}
        >
          Back
        </button>
        <button
          onClick={handleNextStep}
          disabled={currentStep === 'confirm'}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-all ${
            currentStep === 'confirm'
              ? 'bg-orange-600 hover:bg-orange-700 cursor-pointer'
              : 'bg-orange-600 hover:bg-orange-700'
          }`}
        >
          {currentStep === 'confirm' ? '✓ Complete Booking' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
