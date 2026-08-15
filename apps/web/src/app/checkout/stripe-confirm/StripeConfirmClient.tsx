'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface StripeConfirmClientProps {
  paymentIntentId?: string;
  clientSecret?: string;
  bookingId?: string;
}

export default function StripeConfirmClient({
  paymentIntentId,
  clientSecret,
  bookingId,
}: StripeConfirmClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In production, use @stripe/react-stripe-js to embed the payment element
  // For demo, we'll show a simulated payment form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // In production: use Stripe.js to confirm the payment
      // For now, simulate successful payment
      setTimeout(() => {
        router.push(`/checkout/complete?result=success&booking=${bookingId}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setLoading(false);
    }
  };

  if (!clientSecret) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-900 font-semibold">Invalid payment session</p>
        <p className="text-red-800 text-sm mt-1">Missing payment credentials</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Details</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card Fields - In production, use Stripe Elements */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Number
            </label>
            <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm">
              •••• •••• •••• 4242
            </div>
            <p className="text-xs text-gray-500 mt-1">
              In production, use Stripe Elements to collect card details securely
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry
              </label>
              <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm">
                12/25
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CVC
              </label>
              <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm">
                •••
              </div>
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            🔒 Your payment details are encrypted and secure. This is a demo using test card 4242 4242 4242 4242.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-red-900">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full px-4 py-3 rounded-lg font-semibold text-white transition-all ${
            loading
              ? 'bg-orange-400 cursor-not-allowed'
              : 'bg-orange-600 hover:bg-orange-700'
          }`}
        >
          {loading ? '⏳ Processing...' : '✓ Pay Now'}
        </button>
      </form>

      {/* Test Card Info */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <p className="text-xs text-gray-600 font-semibold mb-2">TEST CARD (Demo Only)</p>
        <div className="bg-gray-50 p-3 rounded text-xs text-gray-600 font-mono">
          Card: 4242 4242 4242 4242<br />
          Expiry: Any future date<br />
          CVC: Any 3 digits
        </div>
      </div>
    </div>
  );
}
