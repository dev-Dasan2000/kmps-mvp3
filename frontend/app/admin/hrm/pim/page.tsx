import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PIM - HRM',
  description: 'Manage employee information, job titles, and departments.',
};

export default function PIMPage() {
  return (
    <div className="pt-0 pb-2">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">PIM Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Manage employee information, job titles, and departments.</p>
      </div>
      {/* Add your PIM content here */}
    </div>
  );
}