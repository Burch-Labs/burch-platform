import { Suspense } from "react";
import { NavBar } from "@/components/layout/NavBar";
import { BookingConfirm } from "./BookingConfirm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Confirm Booking — dontbeboringKE",
};

export default async function BookPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        }
      >
        <BookingConfirm hotelId={id} />
      </Suspense>
    </div>
  );
}
