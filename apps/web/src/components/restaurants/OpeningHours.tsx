"use client";

import { cn } from "@/lib/utils";
import type { OpeningHours, OpeningHoursDay } from "@/types/restaurants";

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_SHORT: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun",
};

interface OpeningHoursProps {
  hours: OpeningHours;
}

function todayKey(): string {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[new Date().getDay()];
}

function isOpenNow(day: OpeningHoursDay): boolean {
  if (day.closed) return false;
  const now = new Date();
  const [oh, om] = day.open.split(":").map(Number);
  const [ch, cm] = day.close.split(":").map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = oh * 60 + om;
  const closeMinutes = ch * 60 + cm;
  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

export function OpeningHours({ hours }: OpeningHoursProps) {
  const today = todayKey();
  const todayHours = hours[today as keyof OpeningHours];
  const open = todayHours && !todayHours.closed && isOpenNow(todayHours);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Opening hours</h3>
        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", open ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600")}>
          {open ? "Open now" : "Closed"}
        </span>
      </div>
      <div className="space-y-2">
        {DAY_KEYS.map((key) => {
          const day = hours[key];
          const isToday = key === today;
          return (
            <div
              key={key}
              className={cn("flex items-center justify-between py-1.5 px-2 rounded-lg text-sm", isToday ? "bg-orange-50" : "")}
            >
              <span className={cn("font-medium w-10", isToday ? "text-orange-700" : "text-gray-700")}>
                {DAY_SHORT[key]}
              </span>
              {day.closed ? (
                <span className="text-gray-400">Closed</span>
              ) : (
                <span className={cn(isToday ? "text-orange-700 font-semibold" : "text-gray-600")}>
                  {day.open} – {day.close}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
