# HR Module API Documentation

This document provides detailed information about the HR module API endpoints for frontend developers.

## Base URL

All HR routes are prefixed with:
```
http://localhost:5000/hr
```

## Table of Contents

1. [Employee Management](#employee-management)
2. [Attendance Management](#attendance-management)
3. [Leave Management](#leave-management)

---

## Employee Management

Base path: `/employees`

### Get All Employees

Retrieves a list of all employees with their bank information and emergency contacts.

- **URL**: `/employees`
- **Method**: `GET`
- **Response**: Array of employee objects
  ```json
  [
    {
      "eid": 1,
      "name": "John Doe",
      "dob": "1990-01-01",
      "gender": "male",
      "email": "john.doe@example.com",
      "phone": "1234567890",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "province": null,
      "zip_code": "10001",
      "job_title": "Software Engineer",
      "employment_status": "full time",
      "salary": 75000,
      "bank_info": [
        {
          "eid": 1,
          "account_holder": "John Doe",
          "account_no": "1234567890",
          "bank_name": "ABC Bank",
          "branch": "Main Branch",
          "account_type": "Savings"
        }
      ],
      "emergency_contact": [
        {
          "eid": 1,
          "name": "Jane Doe",
          "relationship": "Spouse",
          "phone": "0987654321",
          "email": "jane.doe@example.com"
        }
      ]
    }
  ]
  ```

### Get Employee by ID

Retrieves a specific employee by their ID.

- **URL**: `/employees/:id`
- **Method**: `GET`
- **URL Parameters**: 
  - `id`: Employee ID
- **Response**: Employee object (same structure as in Get All Employees)
- **Error Responses**:
  - `404 Not Found`: Employee with the specified ID does not exist

### Create Employee

Creates a new employee record.

- **URL**: `/employees`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "dob": "1990-01-01",
    "gender": "male",
    "email": "john.doe@example.com",
    "phone": "1234567890",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "province": "",
    "zip_code": "10001",
    "job_title": "Software Engineer",
    "employment_status": "full time",
    "salary": 75000,
    "bank_info": [
      {
        "account_holder": "John Doe",
        "account_no": "1234567890",
        "bank_name": "ABC Bank",
        "branch": "Main Branch",
        "account_type": "Savings"
      }
    ],
    "emergency_contact": [
      {
        "name": "Jane Doe",
        "relationship": "Spouse",
        "phone": "0987654321",
        "email": "jane.doe@example.com"
      }
    ]
  }
  ```
- **Required Fields**: `name`, `dob`, `gender`, `email`, `phone`, `employment_status`
- **Validation**:
  - `gender` must be either "male" or "female"
  - `employment_status` must be either "part time" or "full time"
- **Response**: Created employee object with ID
- **Error Responses**:
  - `400 Bad Request`: Missing required fields or validation errors

### Update Employee

Updates an existing employee's information.

- **URL**: `/employees/:id`
- **Method**: `PUT`
- **URL Parameters**:
  - `id`: Employee ID
- **Request Body**: Same as Create Employee (partial updates allowed)
- **Response**: Updated employee object
- **Error Responses**:
  - `404 Not Found`: Employee with the specified ID does not exist

### Delete Employee

Deletes an employee record.

- **URL**: `/employees/:id`
- **Method**: `DELETE`
- **URL Parameters**:
  - `id`: Employee ID
- **Response**: Success message
  ```json
  {
    "message": "Employee deleted successfully"
  }
  ```
- **Error Responses**:
  - `404 Not Found`: Employee with the specified ID does not exist

### Bank Information Management

#### Get Bank Information

Retrieves all bank accounts for a specific employee.

- **URL**: `/employees/:id/bank-info`
- **Method**: `GET`
- **URL Parameters**:
  - `id`: Employee ID
- **Response**: Array of bank account objects
  ```json
  [
    {
      "eid": 1,
      "account_holder": "John Doe",
      "account_no": "1234567890",
      "bank_name": "ABC Bank",
      "branch": "Main Branch",
      "account_type": "Savings"
    }
  ]
  ```

#### Add Bank Information

Adds a new bank account for an employee.

- **URL**: `/employees/:id/bank-info`
- **Method**: `POST`
- **URL Parameters**:
  - `id`: Employee ID
- **Request Body**:
  ```json
  {
    "account_holder": "John Doe",
    "account_no": "9876543210",
    "bank_name": "XYZ Bank",
    "branch": "Downtown Branch",
    "account_type": "Checking"
  }
  ```
- **Required Fields**: `account_holder`, `account_no`, `bank_name`
- **Response**: Created bank account object
- **Error Responses**:
  - `404 Not Found`: Employee with the specified ID does not exist

#### Update Bank Information

Updates an existing bank account.

- **URL**: `/employees/:id/bank-info/:account_no`
- **Method**: `PUT`
- **URL Parameters**:
  - `id`: Employee ID
  - `account_no`: Account number
- **Request Body**:
  ```json
  {
    "account_holder": "John Doe",
    "bank_name": "XYZ Bank",
    "branch": "Uptown Branch",
    "account_type": "Checking"
  }
  ```
- **Response**: Updated bank account object
- **Error Responses**:
  - `404 Not Found`: Bank account not found

#### Delete Bank Information

Deletes a bank account.

- **URL**: `/employees/:id/bank-info/:account_no`
- **Method**: `DELETE`
- **URL Parameters**:
  - `id`: Employee ID
  - `account_no`: Account number
- **Response**: Success message
  ```json
  {
    "message": "Bank account deleted successfully"
  }
  ```
- **Error Responses**:
  - `404 Not Found`: Bank account not found

### Emergency Contact Management

#### Get Emergency Contacts

Retrieves all emergency contacts for a specific employee.

- **URL**: `/employees/:id/emergency-contacts`
- **Method**: `GET`
- **URL Parameters**:
  - `id`: Employee ID
- **Response**: Array of emergency contact objects
  ```json
  [
    {
      "eid": 1,
      "name": "Jane Doe",
      "relationship": "Spouse",
      "phone": "0987654321",
      "email": "jane.doe@example.com"
    }
  ]
  ```

#### Add Emergency Contact

Adds a new emergency contact for an employee.

- **URL**: `/employees/:id/emergency-contacts`
- **Method**: `POST`
- **URL Parameters**:
  - `id`: Employee ID
- **Request Body**:
  ```json
  {
    "name": "Robert Doe",
    "relationship": "Father",
    "phone": "5556667777",
    "email": "robert.doe@example.com"
  }
  ```
- **Required Fields**: `name`, `relationship`, `phone`
- **Response**: Created emergency contact object
- **Error Responses**:
  - `404 Not Found`: Employee with the specified ID does not exist

#### Update Emergency Contact

Updates an existing emergency contact.

- **URL**: `/employees/:id/emergency-contacts/:phone`
- **Method**: `PUT`
- **URL Parameters**:
  - `id`: Employee ID
  - `phone`: Contact phone number
- **Request Body**:
  ```json
  {
    "name": "Robert Doe",
    "relationship": "Father",
    "email": "robert.doe.updated@example.com"
  }
  ```
- **Response**: Updated emergency contact object
- **Error Responses**:
  - `404 Not Found`: Emergency contact not found

#### Delete Emergency Contact

Deletes an emergency contact.

- **URL**: `/employees/:id/emergency-contacts/:phone`
- **Method**: `DELETE`
- **URL Parameters**:
  - `id`: Employee ID
  - `phone`: Contact phone number
- **Response**: Success message
  ```json
  {
    "message": "Emergency contact deleted successfully"
  }
  ```
- **Error Responses**:
  - `404 Not Found`: Emergency contact not found

---

## Attendance Management

Base path: `/attendance`

### Get Employee Attendance

Retrieves attendance records for a specific employee for the current month.

- **URL**: `/attendance/:eid`
- **Method**: `GET`
- **URL Parameters**:
  - `eid`: Employee ID
- **Response**: Array of attendance records
  ```json
  [
    {
      "eid": 1,
      "name": "John Doe",
      "date": "2025-07-01",
      "clock_in": "09:00 AM",
      "clock_out": "05:00 PM"
    }
  ]
  ```
- **Error Responses**:
  - `404 Not Found`: Employee with the specified ID does not exist

### Get Total Attendance Days

Retrieves the total attendance days for a specific employee, including approved leave days.

- **URL**: `/attendance/total/:eid`
- **Method**: `GET`
- **URL Parameters**:
  - `eid`: Employee ID
- **Response**: Attendance summary
  ```json
  {
    "eid": 1,
    "name": "John Doe",
    "total_attendance_days": 20,
    "total_leave_days": 5,
    "effective_attendance": 25
  }
  ```
- **Error Responses**:
  - `404 Not Found`: Employee with the specified ID does not exist

### Get Attendance with Leave Information

Retrieves attendance and leave information for a specific employee.

- **URL**: `/attendance/with-leaves/:eid`
- **Method**: `GET`
- **URL Parameters**:
  - `eid`: Employee ID
- **Response**: Attendance with leave information
  ```json
  {
    "eid": 1,
    "name": "John Doe",
    "total_days_present": 20,
    "total_leave_days": 5,
    "effective_attendance": 25,
    "leaves": [
      {
        "from_date": "2025-07-10",
        "to_date": "2025-07-15",
        "type": "Annual Leave",
        "days": 6
      }
    ]
  }
  ```
- **Error Responses**:
  - `404 Not Found`: Employee with the specified ID does not exist

### Get Weekly Attendance

Retrieves weekly attendance for all employees, including leave information.

- **URL**: `/attendance/weekly/all`
- **Method**: `GET`
- **Response**: Array of weekly attendance records
  ```json
  [
    {
      "eid": 1,
      "name": "John Doe",
      "weekly_attendance": {
        "Sunday": {
          "attendance": [],
          "leave": false,
          "leave_type": null
        },
        "Monday": {
          "attendance": [
            {
              "clock_in": "09:00 AM",
              "clock_out": "05:00 PM"
            }
          ],
          "leave": false,
          "leave_type": null
        },
        "Tuesday": {
          "attendance": [],
          "leave": true,
          "leave_type": "Sick Leave"
        },
        "Wednesday": {
          "attendance": [],
          "leave": true,
          "leave_type": "Sick Leave"
        },
        "Thursday": {
          "attendance": [
            {
              "clock_in": "09:00 AM",
              "clock_out": "05:00 PM"
            }
          ],
          "leave": false,
          "leave_type": null
        },
        "Friday": {
          "attendance": [
            {
              "clock_in": "09:00 AM",
              "clock_out": "05:00 PM"
            }
          ],
          "leave": false,
          "leave_type": null
        },
        "Saturday": {
          "attendance": [],
          "leave": false,
          "leave_type": null
        }
      },
      "total_days_present": 3,
      "total_days_on_leave": 2,
      "effective_attendance": 5,
      "week_range": {
        "start": "2025-07-06",
        "end": "2025-07-12"
      }
    }
  ]
  ```

### Record Clock In

Records a clock-in event for an employee.

- **URL**: `/attendance/clock-in`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "eid": 1
  }
  ```
- **Required Fields**: `eid`
- **Response**: Clock-in record
  ```json
  {
    "message": "Clock in recorded successfully",
    "attendance": {
      "eid": 1,
      "name": "John Doe",
      "clock_in": "09:00 AM",
      "date": "2025-07-07"
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: Employee with the specified ID does not exist
  - `400 Bad Request`: Employee is already clocked in today

### Record Clock Out

Records a clock-out event for an employee.

- **URL**: `/attendance/clock-out`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "eid": 1
  }
  ```
- **Required Fields**: `eid`
- **Response**: Clock-out record
  ```json
  {
    "message": "Clock out recorded successfully",
    "attendance": {
      "eid": 1,
      "name": "John Doe",
      "clock_in": "09:00 AM",
      "clock_out": "05:00 PM",
      "date": "2025-07-07"
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: Employee with the specified ID does not exist
  - `400 Bad Request`: No active clock in found for today

---

## Leave Management

Base path: `/leaves`

### Get All Leave Requests

Retrieves all leave requests across all employees.

- **URL**: `/leaves`
- **Method**: `GET`
- **Response**: Array of leave requests
  ```json
  [
    {
      "eid": 1,
      "employee_name": "John Doe",
      "from_date": "2025-07-10",
      "to_date": "2025-07-15",
      "type": "Annual Leave",
      "status": "Approved",
      "job_title": "Software Engineer",
      "employment_status": "full time"
    }
  ]
  ```

### Get Leaves for Specific Employee

Retrieves all leave requests for a specific employee.

- **URL**: `/leaves/:eid`
- **Method**: `GET`
- **URL Parameters**:
  - `eid`: Employee ID
- **Response**: Array of leave requests
  ```json
  [
    {
      "eid": 1,
      "employee_name": "John Doe",
      "from_date": "2025-07-10",
      "to_date": "2025-07-15",
      "type": "Annual Leave",
      "status": "Approved",
      "duration": 6
    }
  ]
  ```
- **Error Responses**:
  - `404 Not Found`: Employee with the specified ID does not exist

### Apply for Leave

Creates a new leave request.

- **URL**: `/leaves`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "eid": 1,
    "from_date": "2025-07-10",
    "to_date": "2025-07-15",
    "type": "Annual Leave"
  }
  ```
- **Required Fields**: `eid`, `from_date`, `to_date`, `type`
- **Response**: Created leave request
  ```json
  {
    "message": "Leave request submitted successfully",
    "leave": {
      "eid": 1,
      "from_date": "2025-07-10",
      "to_date": "2025-07-15",
      "type": "Annual Leave",
      "status": "Pending"
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: Employee with the specified ID does not exist
  - `400 Bad Request`: End date cannot be before start date
  - `409 Conflict`: Overlapping leave request exists

### Update Leave Status

Updates the status of a leave request (approve, reject, or cancel).

- **URL**: `/leaves/:eid/:fromDate/:toDate/status`
- **Method**: `PUT`
- **URL Parameters**:
  - `eid`: Employee ID
  - `fromDate`: Start date (YYYY-MM-DD)
  - `toDate`: End date (YYYY-MM-DD)
- **Request Body**:
  ```json
  {
    "status": "Approved"
  }
  ```
- **Required Fields**: `status` (must be one of: "Approved", "Rejected", "Cancelled")
- **Response**: Updated leave request
  ```json
  {
    "message": "Leave request approved successfully",
    "leave": {
      "eid": 1,
      "from_date": "2025-07-10",
      "to_date": "2025-07-15",
      "type": "Annual Leave",
      "status": "Approved"
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: Leave request not found
  - `400 Bad Request`: Invalid status

### Delete Leave Request

Deletes a leave request.

- **URL**: `/leaves/:eid/:fromDate/:toDate`
- **Method**: `DELETE`
- **URL Parameters**:
  - `eid`: Employee ID
  - `fromDate`: Start date (YYYY-MM-DD)
  - `toDate`: End date (YYYY-MM-DD)
- **Response**: Success message
  ```json
  {
    "message": "Leave request deleted successfully"
  }
  ```
- **Error Responses**:
  - `404 Not Found`: Leave request not found

### Get Leave Summary

Retrieves a summary of approved leaves by type for a specific employee.

- **URL**: `/leaves/summary/:eid`
- **Method**: `GET`
- **URL Parameters**:
  - `eid`: Employee ID
- **Response**: Leave summary
  ```json
  {
    "eid": 1,
    "name": "John Doe",
    "summary": {
      "Annual Leave": {
        "total_days": 15,
        "count": 2
      },
      "Sick Leave": {
        "total_days": 5,
        "count": 1
      }
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: Employee with the specified ID does not exist
