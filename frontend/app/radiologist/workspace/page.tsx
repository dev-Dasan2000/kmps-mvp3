// app/radiologist/workspace/page.tsx

import React, { Suspense } from 'react';
import RadiologistWorkspace from './RadiologistWorkspace';

export const dynamic = 'force-dynamic';

const Page = () => {
  return (
    <Suspense fallback={<div>Loading workspace...</div>}>
      <RadiologistWorkspace />
    </Suspense>
  );
};

export default Page;
