// app/radiologist/workspace/page.tsx

import React, { Suspense } from 'react';
import ReportEditor from './ReportEditorPage';

export const dynamic = 'force-dynamic';

const Page = () => {
  return (
    <Suspense fallback={<div>Loading workspace...</div>}>
      <ReportEditor />
    </Suspense>
  );
};

export default Page;
