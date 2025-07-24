// app/admin/studies/workspace/page.tsx

import React, { Suspense } from 'react';
import AdminOpenStudies from './AdminOpenStudies';

export const dynamic = 'force-dynamic';

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[70vh]">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500 mb-6"></div>
    <h3 className="text-xl font-medium text-gray-700">Loading study workspace...</h3>
    <p className="text-gray-500 mt-2">Please wait while we prepare the study details.</p>
  </div>
);

const Page = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AdminOpenStudies />
    </Suspense>
  );
};

export default Page;
