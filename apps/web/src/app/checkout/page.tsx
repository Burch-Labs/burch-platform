import { CheckoutFlow } from '@/components/checkout/CheckoutFlow';
import { BookingSummary } from '@/components/checkout/BookingSummary';
import { NavBar } from '@/components/layout/NavBar';

interface CheckoutPageProps {
  searchParams: Promise<{
    bookingId?: string;
    type?: 'event' | 'hotel' | 'restaurant';
  }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { bookingId, type = 'event' } = await searchParams;

  // Mock booking data - in production, fetch from database using bookingId
  const bookingExamples = {
    event: {
      type: 'event' as const,
      title: 'Nairobi Jazz Festival 2026',
      imageUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&q=80',
      quantity: 2,
      unitPrice: 2500,
      currency: 'KES',
      taxes: 400,
      fees: 0,
    },
    hotel: {
      type: 'hotel' as const,
      title: 'Radisson Blu Nairobi - Deluxe Room',
      imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80',
      quantity: 1,
      unitPrice: 8500,
      currency: 'KES',
      taxes: 1275,
      fees: 500,
    },
    restaurant: {
      type: 'restaurant' as const,
      title: 'Carnivore Restaurant - 2 People',
      imageUrl: 'https://images.unsplash.com/photo-1504674900306-873d2c129c89?w=400&q=80',
      quantity: 2,
      unitPrice: 4000,
      currency: 'KES',
      taxes: 600,
      fees: 200,
    },
  };

  const mockBooking = bookingExamples[type as 'event' | 'hotel' | 'restaurant'] || bookingExamples.event;
  const totalAmount = (mockBooking.quantity * mockBooking.unitPrice) + mockBooking.taxes + mockBooking.fees;

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-gradient-to-b from-white to-orange-50">
        {/* Header */}
        <div className="bg-white border-b border-orange-100 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-orange-600">🎫 Checkout</h1>
              <p className="text-gray-600 text-sm mt-1">Complete your booking in 3 simple steps</p>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Booking Summary (Sidebar) */}
            <div className="md:col-span-1">
              <BookingSummary {...mockBooking} />
            </div>

            {/* Checkout Form */}
            <div className="md:col-span-2 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <CheckoutFlow
                bookingId={bookingId || `booking-${Date.now()}`}
                amount={totalAmount}
                currency={mockBooking.currency}
                title={mockBooking.title}
              />
            </div>
          </div>

          {/* Trust signals footer */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg py-6 mt-12">
            <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
              <div className="flex flex-col items-center gap-2">
                <span className="text-2xl">🔒</span>
                <span className="text-gray-700">SSL Secure</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-2xl">✓</span>
                <span className="text-gray-700">Verified</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-2xl">⚡</span>
                <span className="text-gray-700">Instant</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-2xl">💯</span>
                <span className="text-gray-700">Safe</span>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept M-Pesa, Flutterwave, Stripe, and international cards.',
                },
                {
                  q: 'Is my payment information secure?',
                  a: 'Yes! All payments are encrypted with SSL 256-bit security.',
                },
                {
                  q: 'Can I cancel my booking?',
                  a: 'Cancellations can be made up to 48 hours before the event for a full refund.',
                },
                {
                  q: 'How do I receive my ticket?',
                  a: 'A confirmation email with your digital ticket will be sent immediately after payment.',
                },
              ].map((item, idx) => (
                <details
                  key={idx}
                  className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-orange-300 transition-colors"
                >
                  <summary className="font-semibold text-gray-900 flex justify-between items-center">
                    {item.q}
                    <span className="text-orange-600">▼</span>
                  </summary>
                  <p className="text-gray-600 text-sm mt-3">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
