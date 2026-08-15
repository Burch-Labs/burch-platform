'use client';

interface BookingSummaryProps {
  type: 'event' | 'hotel' | 'restaurant';
  title: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  currency?: string;
  taxes?: number;
  fees?: number;
}

export function BookingSummary({
  type,
  title,
  imageUrl,
  quantity,
  unitPrice,
  currency = 'KES',
  taxes = 0,
  fees = 0,
}: BookingSummaryProps) {
  const subtotal = quantity * unitPrice;
  const total = subtotal + taxes + fees;

  const typeLabel = {
    event: '🎫 Event Ticket',
    hotel: '🏨 Hotel Room',
    restaurant: '🍽️ Restaurant',
  }[type];

  return (
    <div className="bg-white rounded-lg border border-orange-200 overflow-hidden shadow-sm">
      {/* Image */}
      {imageUrl && (
        <div className="w-full h-40 bg-gray-200 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <p className="text-xs font-semibold text-orange-600 mb-1">{typeLabel}</p>
        <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>

        {/* Price breakdown */}
        <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {quantity} × {currency} {unitPrice.toLocaleString()}
            </span>
            <span className="font-medium text-gray-900">
              {currency} {subtotal.toLocaleString()}
            </span>
          </div>

          {taxes > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Taxes</span>
              <span className="text-gray-900">{currency} {taxes.toLocaleString()}</span>
            </div>
          )}

          {fees > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Processing Fee</span>
              <span className="text-gray-900">{currency} {fees.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-gray-700 font-semibold">Total</span>
          <div className="text-right">
            <p className="text-sm text-gray-500">{currency}</p>
            <p className="text-2xl font-bold text-orange-600">
              {total.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Trust signals */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
          <span className="text-xs text-gray-600 flex items-center gap-1">
            🔒 Secure
          </span>
          <span className="text-xs text-gray-600 flex items-center gap-1">
            ✓ Verified
          </span>
        </div>
      </div>
    </div>
  );
}
