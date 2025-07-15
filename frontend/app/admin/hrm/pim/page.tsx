'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickActions } from '../../../../components/QuickActions';
import { StaffDirectory } from '../../../../components/StaffDirectort';
import { useEffect, useState, useCallback, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

//backend url
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

interface Employee {
  eid: number;
  name: string;
  job_title: string;
  employment_status: 'full time' | 'part time';
  email: string;
  phone: string;
  bank_info: any[];
  emergency_contact: any[];
}

interface StaffStats {
  totalStaff: number;
  fullTime: number;
  partTime: number;
  onLeave: number;
  byJobTitle: {
    [key: string]: number;
  };
}

export default function PIMPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {isLoadingAuth, isLoggedIn, user, accessToken} = useContext(AuthContext);
  const router = useRouter();


  const [staffStats, setStaffStats] = useState<StaffStats>({
    totalStaff: 0,
    fullTime: 0,
    partTime: 0,
    onLeave: 0,
    byJobTitle: {}
  });

  const calculateStats = (data: Employee[]) => {
    const stats: StaffStats = {
      totalStaff: data.length,
      fullTime: data.filter((emp: Employee) => emp.employment_status === 'full time').length,
      partTime: data.filter((emp: Employee) => emp.employment_status === 'part time').length,
      onLeave: 0,
      byJobTitle: {}
    };

    data.forEach((emp: Employee) => {
      if (emp.job_title) {
        stats.byJobTitle[emp.job_title] = (stats.byJobTitle[emp.job_title] || 0) + 1;
      }
    });

    return stats;
  };

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/hr/employees`);
      setEmployees(response.data);
      setStaffStats(calculateStats(response.data));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleEmployeeAdded = useCallback(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(()=>{
    if(isLoadingAuth) return;
    if(!isLoggedIn){
      toast.error("Login Error", {description:"Please Login"});
      router.push("/");
    }
    else if(user.role != "admin"){
      toast.error("Access Denied", {description:"You do not have admin priviledges"});
      router.push("/");
    }
  },[isLoadingAuth]);

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Personnel Information Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your human resources, employee information, and workforce operations.</p>
        </div>
      </div>

      {/* Quick Actions Section */}
      {/*<QuickActions />*/}

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
                <span className="font-semibold">{staffStats.totalStaff}</span>
              </div>
              {Object.entries(staffStats.byJobTitle).map(([title, count]) => (
                <div key={title} className="flex justify-between items-center">
                  <span className="text-gray-600">{title}:</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
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
                  {staffStats.fullTime}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Part-time:</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {staffStats.partTime}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">On Leave:</span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  {staffStats.onLeave}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Directory */}
      <StaffDirectory employees={employees} onEmployeeAdded={handleEmployeeAdded} />
    </div>
  );
}