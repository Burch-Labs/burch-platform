'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PaymentMethodCard } from './PaymentMethodCard';

interface CheckoutFlowProps {
  onComplete?: (data: any) => void;
  bookingId?: string;
  amount?: number;
  currency?: string;
  title?: string;
}

type Step = 'details' | 'payment' | 'confirm';

export function CheckoutFlow({
  onComplete,
  bookingId = 'booking-' + Date.now(),
  amount = 5000,
  currency = 'KES',
  title = 'Booking'
}: CheckoutFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('details');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleNextStep = async () => {
    if (currentStep === 'details') {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        setError('Please fill in all guest details');
        return;
      }
      setError(null);
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      setCurrentStep('confirm');
    } else if (currentStep === 'confirm') {
      await handleBookingComplete();
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'confirm') setCurrentStep('payment');
    else if (currentStep === 'payment') setCurrentStep('details');
    setError(null);
  };

  const handleBookingComplete = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          amount,
          currency,
          paymentMethod: selectedPayment,
          customerName: `${formData.firstName} ${formData.lastName}`,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          title,
          description: `Payment for ${title}`,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Payment initiation failed');
      }

      const result = await response.json();

      // Handle different payment methods
      if (result.method === 'mpesa') {
        router.push(`/checkout/complete?result=pending&booking=${bookingId}`);
      } else if (result.method === 'flutterwave') {
        window.location.href = result.paymentLink;
      } else if (result.method === 'stripe') {
        // For Stripe, redirect to payment confirmation page with clientSecret
        router.push(
          `/checkout/stripe-confirm?paymentIntentId=${result.paymentIntentId}&clientSecret=${result.clientSecret}&booking=${bookingId}`
        );
      }

      onComplete?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setIsProcessing(false);
    }
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

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex gap-2">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-red-900">{error}</p>
          </div>
        </div>
      )}

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
          disabled={currentStep === 'details' || isProcessing}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
            currentStep === 'details' || isProcessing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50'
          }`}
        >
          Back
        </button>
        <button
          onClick={handleNextStep}
          disabled={isProcessing}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-all ${
            isProcessing
              ? 'bg-orange-400 cursor-not-allowed'
              : 'bg-orange-600 hover:bg-orange-700'
          }`}
        >
          {isProcessing ? '⏳ Processing...' : currentStep === 'confirm' ? '✓ Complete Booking' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
