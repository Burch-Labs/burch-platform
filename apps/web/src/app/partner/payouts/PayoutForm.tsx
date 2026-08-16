"use client";

import { useActionState, useState } from "react";
import { savePayoutDetails, type PayoutFormState } from "./actions";

interface PayoutFormProps {
  defaults: {
    legalName: string;
    taxId: string;
    idNumber: string;
    mpesaNumber: string;
    bankName: string;
    bankAccount: string;
  };
}

const initial: PayoutFormState = {};

export function PayoutForm({ defaults }: PayoutFormProps) {
  const [state, action, pending] = useActionState(savePayoutDetails, initial);

  // Controlled rather than uncontrolled with defaultValue: React resets a form
  // after a server action completes, so on a validation error an uncontrolled
  // form would hand back an empty page and make the partner retype their KRA
  // PIN to fix a missing phone number.
  const [values, setValues] = useState(defaults);
  const bind = (name: keyof typeof defaults) => ({
    value: values[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [name]: e.target.value })),
  });

  return (
    <form action={action} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
      <Field
        name="legalName"
        label="Name on your ID or certificate"
        {...bind("legalName")}
        placeholder="Wanjiru Events Ltd"
        required
      />
      <Field
        name="taxId"
        label="KRA PIN"
        {...bind("taxId")}
        placeholder="A012345678X"
        required
      />
      <Field
        name="idNumber"
        label="National ID or business registration number"
        {...bind("idNumber")}
        placeholder="12345678"
        required
      />

      <div className="pt-2 border-t border-gray-100">
        <p className="text-sm font-medium text-gray-700 mb-1">Where should we send money?</p>
        <p className="text-xs text-gray-400 mb-4">
          M-Pesa is enough on its own. Give bank details instead if you would rather be
          paid that way.
        </p>

        <Field
          name="mpesaNumber"
          label="M-Pesa number"
          {...bind("mpesaNumber")}
          placeholder="0712 345 678"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Field name="bankName" label="Bank" {...bind("bankName")} placeholder="Equity Bank" />
          <Field
            name="bankAccount"
            label="Account number"
            {...bind("bankAccount")}
            placeholder="0123456789"
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          Submitted. We will review these and let you know.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-orange-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-orange-700 transition disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Submit for review"}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Reviewed by a person, usually within a working day.
      </p>
    </form>
  );
}

function Field({
  name,
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {!required && <span className="text-gray-400 font-normal"> — optional</span>}
      </label>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>
  );
}
