import { Suspense } from "react";
import { NavBar } from "@/components/layout/NavBar";
import { SearchBar } from "@/components/events/SearchBar";
import { RestaurantsContent } from "./RestaurantsContent";

interface PageProps {
  searchParams: Promise<{ q?: string; city?: string; cuisine?: string; page?: string }>;
}

export default function RestaurantsPage(props: PageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Restaurants</h1>
          <p className="text-gray-500 mb-6">Discover the finest dining experiences across Kenya</p>
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>
      </div>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Suspense
          fallback={
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="w-full lg:w-56 h-24 lg:h-80 bg-white rounded-2xl border border-gray-100 animate-pulse flex-shrink-0" />
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                ))}
              </div>
            </div>
          }
        >
          <RestaurantsContent searchParams={props.searchParams} />
        </Suspense>
      </main>
    </div>
  );
}
