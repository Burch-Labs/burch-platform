import { Suspense } from 'react';
import StripeConfirmClient from './StripeConfirmClient';
import { NavBar } from '@/components/layout/NavBar';

interface StripeConfirmPageProps {
  searchParams: Promise<{
    paymentIntentId?: string;
    clientSecret?: string;
    booking?: string;
  }>;
}

export default async function StripeConfirmPage({
  searchParams,
}: StripeConfirmPageProps) {
  const { paymentIntentId, clientSecret, booking } = await searchParams;

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-gradient-to-b from-white to-orange-50">
        <div className="bg-white border-b border-orange-100 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-orange-600">💳 Complete Payment</h1>
            <p className="text-gray-600 text-sm mt-1">Secure payment with Stripe</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <Suspense fallback={<div className="text-center text-gray-500">Loading payment form...</div>}>
            <StripeConfirmClient
              paymentIntentId={paymentIntentId}
              clientSecret={clientSecret}
              bookingId={booking}
            />
          </Suspense>
        </div>
      </main>
    </>
  );
}
