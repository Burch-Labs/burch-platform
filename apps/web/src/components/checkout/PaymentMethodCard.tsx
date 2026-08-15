'use client';

import { ReactNode } from 'react';

interface PaymentMethodCardProps {
  id: string;
  icon: ReactNode;
  name: string;
  description: string;
  processingTime: string;
  fee?: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function PaymentMethodCard({
  id,
  icon,
  name,
  description,
  processingTime,
  fee,
  isSelected,
  onSelect,
}: PaymentMethodCardProps) {
  return (
    <button
      onClick={() => onSelect(id)}
      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
        isSelected
          ? 'border-orange-500 bg-orange-50'
          : 'border-gray-200 bg-white hover:border-orange-300'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Selection radio */}
        <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          isSelected
            ? 'border-orange-500 bg-orange-500'
            : 'border-gray-300'
        }`}>
          {isSelected && (
            <div className="w-2 h-2 bg-white rounded-full" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{icon}</span>
            <h3 className="font-semibold text-gray-900">{name}</h3>
          </div>
          <p className="text-sm text-gray-600 mb-2">{description}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>⚡ {processingTime}</span>
            {fee && <span>💳 {fee}</span>}
          </div>
        </div>
      </div>
    </button>
  );
}
