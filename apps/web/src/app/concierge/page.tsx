import { NavBar } from "@/components/layout/NavBar";
import { ConciergeChat } from "@/components/concierge/ConciergeChat";

export const metadata = {
  title: "AI Concierge — dontbeboring",
  description: "Your personal AI guide to the best hotels, restaurants, events, and experiences across East Africa.",
};

export default function ConciergePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />

      {/* Hero header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-lg">
              ✦
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Concierge</h1>
              <p className="text-sm text-gray-500">Your personal guide to Africa&apos;s best experiences</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              { icon: "🏨", label: "Hotels" },
              { icon: "🍽️", label: "Restaurants" },
              { icon: "🎟️", label: "Events" },
              { icon: "🗺️", label: "Itineraries" },
              { icon: "✨", label: "Experiences" },
            ].map(({ icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                {icon} {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col" style={{ minHeight: "calc(100vh - 220px)" }}>
        <div className="flex-1 bg-gray-50 flex flex-col">
          <ConciergeChat />
        </div>
      </div>
    </div>
  );
}
