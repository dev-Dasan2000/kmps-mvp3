'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/admin/hrm' },
  { name: 'PIM', href: '/admin/hrm/pim' },
  { name: 'Leave', href: '/admin/hrm/leave' },
  { name: 'Time', href: '/admin/hrm/time' },
  { name: 'Directory', href: '/admin/hrm/directory' },
];

export default function HrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-none bg-gray-50">
        {/* Header Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-6 pb-6">
          <h1 className="text-2xl font-semibold text-gray-900">HR Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your human resources, employee information, and workforce operations.
          </p>
        </div>

        {/* Navigation Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'pb-2 px-1 border-b-2 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden -mx-4 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <div className="flex px-4 space-x-4 py-3">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium',
                      pathname === item.href
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <main className="flex-1 bg-gray-50 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 w-full py-4 md:py-6">
          {children}
        </div>
      </main>
    </div>
  );
}