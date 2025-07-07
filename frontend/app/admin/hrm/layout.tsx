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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Horizontal Navigation - Hidden on mobile, shown on md and up */}
      <div className="hidden md:block bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center h-16">
            <div className="flex items-center">
              <div className="flex space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                      pathname === item.href
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
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
      
      {/* Mobile Navigation - Shown on mobile, hidden on md and up */}
      <div className="md:hidden bg-white shadow-sm sticky top-0 z-20">
        <div className="overflow-x-auto pt-16">
          <div className="flex px-4 space-x-4 pb-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium',
                  pathname === item.href
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 py-4 md:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 w-full">
          {children}
        </div>
      </div>
    </div>
  );
}