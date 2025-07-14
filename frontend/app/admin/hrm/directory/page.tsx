"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Mail, Eye, MessageCircle, Search, Phone, Calendar, Clock, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useMediaQuery } from "@/hooks/use-mobile"
import { toast } from "sonner"
import axios from "axios"

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

interface Employee {
    eid: number
    name: string
    job_title: string
    phone: string
    email: string
}

interface EmployeeStats {
    worked_days: number
    total_hours: number
    leaves_per_month: number
}

interface EmployeeAttendance {
    eid: number
    clock_in: string | null
    clock_out: string | null
}

const userRoles = [
    { value: "all", label: "All" },
    { value: "dentist", label: "Dentist" },
    { value: "receptionist", label: "Receptionist" },
    { value: "radiologist", label: "Radiologist" },
]

export default function DirectoryPage() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [availableCount, setAvailableCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedRole, setSelectedRole] = useState("all")
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [employeeStats, setEmployeeStats] = useState<EmployeeStats | null>(null)
    const [showStatsDialog, setShowStatsDialog] = useState(false)
    const isMobile = useMediaQuery("(max-width: 768px)")

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get today's date in YYYY-MM-DD format
                const today = new Date().toISOString().split('T')[0]
                
                // Fetch employees and attendance data in parallel using axios
                const [employeesRes, attendanceRes] = await Promise.all([
                    axios.get(`${backendUrl}/hr/employees`),
                    axios.get(`${backendUrl}/hr/attendance/daily/${today}`)
                ])
                
                const employeesData = employeesRes.data
                const attendanceData: EmployeeAttendance[] = attendanceRes.data
                
                setEmployees(employeesData)

                // Count employees who are clocked in but not clocked out
                const availableEmployees = attendanceData.filter(
                    (att) => att.clock_in && !att.clock_out
                ).length

                setAvailableCount(availableEmployees)
            } catch (error) {
                console.error('Error fetching data:', error)
                
                // More specific error handling for axios errors
                if (axios.isAxiosError(error)) {
                    if (error.response) {
                        toast.error(`Failed to fetch data: ${error.response.status}`)
                    } else if (error.request) {
                        toast.error('Network error. Please check your connection')
                    } else {
                        toast.error(`Error: ${error.message}`)
                    }
                } else {
                    toast.error('Failed to load employee data')
                }
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const filteredEmployees = employees.filter(employee => {
        const matchesSearch = employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            employee.phone.includes(searchQuery)
        
        const matchesRole = selectedRole === "all" || 
                          employee.job_title.toLowerCase() === selectedRole.toLowerCase()
        
        return matchesSearch && matchesRole
    })

    const stats = [
        { title: "Total Staff", value: employees.length.toString(), description: "Active employees" },
        { title: "Available Now", value: availableCount.toString(), description: "Ready for patients" },
    ]

    const handleViewStats = async (employee: Employee) => {
        try {
            // Start loading state
            setLoading(true)
            
            // Get the current month start and end dates
            const now = new Date()
            const currentMonth = now.getMonth()
            const currentYear = now.getFullYear()
            
            // Fetch attendance data and leave data in parallel using axios
            const [attendanceResponse, leavesResponse] = await Promise.all([
                axios.get(`${backendUrl}/hr/attendance/total/${employee.eid}`),
                axios.get(`${backendUrl}/hr/leaves/${employee.eid}`)
            ])
            
            // Extract response data
            const attendanceData = attendanceResponse.data
            const leavesData = leavesResponse.data
            
            // Ensure attendanceData is an array before processing it
            const attendanceArray = Array.isArray(attendanceData) ? attendanceData : []
            
            // Process attendance data to get worked days and hours
            const workedDays = attendanceArray.length
            
            // Calculate total hours worked (assuming each record has clock_in and clock_out)
            let totalHours = 0
            attendanceArray.forEach((record: any) => {
                if (record.clock_in && record.clock_out) {
                    const clockIn = new Date(record.clock_in)
                    const clockOut = new Date(record.clock_out)
                    const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)
                    totalHours += hoursWorked
                }
            })
            
            // Round hours to nearest whole number
            totalHours = Math.round(totalHours)
            
            // Calculate leaves in the current month
            const leavesThisMonth = leavesData.filter((leave: any) => {
                const fromDate = new Date(leave.from_date)
                const toDate = new Date(leave.to_date)
                const leaveMonth = fromDate.getMonth()
                const leaveYear = fromDate.getFullYear()
                
                return leaveMonth === currentMonth && leaveYear === currentYear
            }).length
            
            const stats: EmployeeStats = {
                worked_days: workedDays,
                total_hours: totalHours,
                leaves_per_month: leavesThisMonth
            }
            
            setEmployeeStats(stats)
            setSelectedEmployee(employee)
            setShowStatsDialog(true)
        } catch (error) {
            console.error('Error fetching employee stats:', error)
            
            // More specific error handling for axios errors
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    toast.error(`Failed to fetch data: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`)
                } else if (error.request) {
                    // The request was made but no response was received
                    toast.error('Server did not respond. Please check your connection')
                } else {
                    // Something happened in setting up the request
                    toast.error(`Error: ${error.message}`)
                }
            } else {
                // Generic error handling
                toast.error('Failed to fetch employee statistics')
            }
        } finally {
            setLoading(false)
        }
    }

    const StatsDialog = () => {
        if (!selectedEmployee || !employeeStats) return null

        return (
            <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold mb-4">
                            {selectedEmployee.name}'s Overview
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
                            <div className="p-2 bg-blue-50 rounded-full">
                                <Calendar className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Worked Days</p>
                                <p className="text-lg font-semibold text-gray-900">{employeeStats.worked_days} days</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
                            <div className="p-2 bg-green-50 rounded-full">
                                <Clock className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Hours</p>
                                <p className="text-lg font-semibold text-gray-900">{employeeStats.total_hours} hours</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
                            <div className="p-2 bg-purple-50 rounded-full">
                                <CalendarDays className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Leaves This Month</p>
                                <p className="text-lg font-semibold text-gray-900">{employeeStats.leaves_per_month} days</p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    const MobileCard = ({ employee }: { employee: Employee }) => (
        <Card className="mb-4">
            <CardContent className="p-4">
                <div className="space-y-4">
                    <div>
                        <h3 className="font-medium text-gray-900">{employee.name}</h3>
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-sm font-medium text-blue-700 mt-1">
                            {employee.job_title}
                        </span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {employee.phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-4 w-4 mr-2" />
                            {employee.email}
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 shadow-sm rounded-full transition"
                        >
                            <MessageCircle className="h-5 w-5" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon"
                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 shadow-sm rounded-full transition"
                            onClick={() => window.location.href = `mailto:${employee.email}`}
                        >
                            <Mail className="h-5 w-5" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon"
                            className="bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-700 shadow-sm rounded-full transition"
                            onClick={() => handleViewStats(employee)}
                        >
                            <Eye className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-0">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Staff Directory</h1>
                    <p className="mt-1 text-sm text-gray-500">Find contact information and current status of all staff members.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {stats.map((stat) => (
                        <Card key={stat.title}>
                            <CardContent className="flex flex-col items-start">
                                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                <p className="mt-2 text-3xl font-semibold text-gray-900">{stat.value}</p>
                                <p className="mt-1 text-sm text-gray-500">{stat.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Staff Directory Table/Cards */}
                <Card className="mt-6 overflow-hidden">
                    <CardHeader className="pb-0">
                        <div className="bg-white">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="relative flex-1 min-w-[240px]">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <Search className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <Input
                                        type="search"
                                        placeholder="Search staff..."
                                        className="pl-10"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Select
                                    value={selectedRole}
                                    onValueChange={setSelectedRole}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {userRoles.map((role) => (
                                            <SelectItem key={role.value} value={role.value}>
                                                {role.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className={isMobile ? "p-4" : "p-0"}>
                        {isMobile ? (
                            <div className="space-y-4">
                                {filteredEmployees.map((employee) => (
                                    <MobileCard key={employee.eid} employee={employee} />
                                ))}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                                        <TableHead className="w-[25%] py-4 text-left pl-6">Name</TableHead>
                                        <TableHead className="w-[20%] py-4 text-left pl-6">Role</TableHead>
                                        <TableHead className="w-[20%] py-4 text-left">Phone</TableHead>
                                        <TableHead className="w-[25%] py-4 text-left">Email</TableHead>
                                        <TableHead className="w-[10%] py-4 text-center pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredEmployees.map((employee) => (
                                        <TableRow 
                                            key={employee.eid}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <TableCell className="py-4 pl-6">
                                                <span className="font-medium text-gray-900">{employee.name}</span>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-0.5 text-sm font-medium text-blue-700">
                                                    {employee.job_title}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <span className="text-gray-600">{employee.phone}</span>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <span className="text-gray-600">{employee.email}</span>
                                            </TableCell>
                                            <TableCell className="py-4 pr-6">
                                                <div className="flex justify-center gap-3">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 shadow-sm rounded-full transition"
                                                    >
                                                        <MessageCircle className="h-5 w-5" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 shadow-sm rounded-full transition"
                                                        onClick={() => window.location.href = `mailto:${employee.email}`}
                                                    >
                                                        <Mail className="h-5 w-5" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        className="bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-700 shadow-sm rounded-full transition"
                                                        onClick={() => handleViewStats(employee)}
                                                    >
                                                        <Eye className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
            <StatsDialog />
        </div>
    )
}