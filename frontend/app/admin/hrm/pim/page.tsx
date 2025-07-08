import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickActions } from '../components/QuickActions';
import { StaffDirectory } from '../components/StaffDirectort';

export const metadata: Metadata = {
  title: 'PIM - HRM',
  description: 'Manage employee information, job titles, and departments.',
};

const staffOverview = {
  totalStaff: 25,
  dentists: 8,
  assistants: 12,
  supportStaff: 5,
};

const scheduleStats = {
  fullTime: 18,
  partTime: 5,
  onLeave: 2,
};

export default function PIMPage() {
  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Personnel Information Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your human resources, employee information, and workforce operations.</p>
        </div>
      </div>

      {/* Quick Actions Section */}
      <QuickActions />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Staff Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Staff:</span>
                <span className="font-semibold">{staffOverview.totalStaff}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Dentists:</span>
                <span className="font-semibold">{staffOverview.dentists}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Assistants:</span>
                <span className="font-semibold">{staffOverview.assistants}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Support Staff:</span>
                <span className="font-semibold">{staffOverview.supportStaff}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Full-time:</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  {scheduleStats.fullTime}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Part-time:</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {scheduleStats.partTime}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">On Leave:</span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  {scheduleStats.onLeave}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Directory */}
      <StaffDirectory />
    </div>
  );
}