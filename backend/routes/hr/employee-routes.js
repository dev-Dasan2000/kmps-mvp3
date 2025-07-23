import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/authentication.js';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const employees = await prisma.employees.findMany({
      include: {
        bank_info: true,
        emergency_contact: true
      }
    });
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/new', authenticateToken, async (req, res) => {
  try {
    // Step 1: Get all employees
    const employees = await prisma.employees.findMany({
      select: { name: true, email: true },
    });

    // Step 2: Create Sets for fast lookup (case-insensitive)
    const employeeNamesSet = new Set(employees.map(emp => emp.name.toLowerCase()));
    const employeeEmailsSet = new Set(employees.map(emp => emp.email.toLowerCase()));

    // Step 3: Fetch all role-based users
    const dentistsRaw = await prisma.dentists.findMany({
      select: { dentist_id: true, name: true, email: true, phone_number: true },
    });

    const receptionistsRaw = await prisma.receptionists.findMany({
      select: { receptionist_id: true, name: true, email: true, phone_number: true },
    });

    const radiologistsRaw = await prisma.radiologists.findMany({
      select: { radiologist_id: true, name: true, email: true, phone_number: true },
    });

    // Step 4: Filter out entries if name OR email matches any employee
    const dentists = dentistsRaw.filter(
      d =>
        !employeeNamesSet.has(d.name.toLowerCase()) &&
        !employeeEmailsSet.has(d.email.toLowerCase())
    );

    const receptionists = receptionistsRaw.filter(
      r =>
        !employeeNamesSet.has(r.name.toLowerCase()) &&
        !employeeEmailsSet.has(r.email.toLowerCase())
    );

    const radiologists = radiologistsRaw.filter(
      r =>
        !employeeNamesSet.has(r.name.toLowerCase()) &&
        !employeeEmailsSet.has(r.email.toLowerCase())
    );

    // Step 5: Return filtered data
    res.json({
      dentists,
      receptionists,
      radiologists,
    });

  } catch (error) {
    console.error('Error fetching filtered data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/new/count', authenticateToken, async (req, res) => {
  try {
    const employees = await prisma.employees.findMany({
      select: { name: true, email: true },
    });

    const employeeKeySet = new Set(
      employees.map(emp => `${emp.name.toLowerCase()}|${emp.email.toLowerCase()}`)
    );

    const dentistsRaw = await prisma.dentists.findMany({
      select: { name: true, email: true },
    });

    const receptionistsRaw = await prisma.receptionists.findMany({
      select: { name: true, email: true },
    });

    const radiologistsRaw = await prisma.radiologists.findMany({
      select: { name: true, email: true },
    });

    const dentists = dentistsRaw.filter(
      d => !employeeKeySet.has(`${d.name.toLowerCase()}|${d.email.toLowerCase()}`)
    );

    const receptionists = receptionistsRaw.filter(
      r => !employeeKeySet.has(`${r.name.toLowerCase()}|${r.email.toLowerCase()}`)
    );

    const radiologists = radiologistsRaw.filter(
      r => !employeeKeySet.has(`${r.name.toLowerCase()}|${r.email.toLowerCase()}`)
    );

    const dentistCount = dentists.length;
    const receptionistCount = receptionists.length;
    const radiologistCount = radiologists.length;
    const totalCount = dentistCount + receptionistCount + radiologistCount;

    res.json({
      dentistCount,
      receptionistCount,
      radiologistCount,
      totalCount,
    });

  } catch (error) {
    console.error('Error fetching counts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get employee by ID (used by payroll page)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await prisma.employees.findUnique({
      where: { eid: parseInt(id) },
      include: {
        bank_info: true,
        emergency_contact: true
      }
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  console.debug("employee post route called");
  try {
    const {
      name, dob, gender, email, phone, address, city, state, province,
      zip_code, job_title, employment_status, salary,
      bank_info, emergency_contact
    } = req.body;

    // Validate required fields
    if (!name || !dob || !gender || !email || !phone || !employment_status) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate gender value
    if (gender !== 'male' && gender !== 'female') {
      return res.status(400).json({ message: 'Gender must be either male or female' });
    }

    // Validate employment_status value
    if (employment_status !== 'part time' && employment_status !== 'full time') {
      return res.status(400).json({ message: 'Employment status must be either part time or full time' });
    }

    // Create employee
    const newEmployee = await prisma.employees.create({
      data: {
        name,
        dob,
        gender,
        email,
        phone,
        address,
        city,
        state,
        province,
        zip_code,
        job_title,
        employment_status,
        salary
      }
    });

    // Create bank info if provided as object (not array)
    if (bank_info && Object.keys(bank_info).length > 0) {
      await prisma.bank_info.create({
        data: {
          eid: newEmployee.eid,
          account_holder: bank_info.account_holder,
          account_no: bank_info.account_no,
          bank_name: bank_info.bank_name,
          branch: bank_info.branch,
          account_type: bank_info.account_type
        }
      });
    }

    // Create emergency contact if provided as object (not array)
    if (emergency_contact && Object.keys(emergency_contact).length > 0) {
      await prisma.emergency_contact.create({
        data: {
          eid: newEmployee.eid,
          name: emergency_contact.name,
          relationship: emergency_contact.relationship,
          phone: emergency_contact.phone,
          email: emergency_contact.email
        }
      });
    }

    // Return the created employee with related data
    const employeeWithRelations = await prisma.employees.findUnique({
      where: { eid: newEmployee.eid },
      include: {
        bank_info: true,
        emergency_contact: true
      }
    });

    res.status(201).json(employeeWithRelations);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, dob, gender, email, phone, address, city, state, province,
      zip_code, job_title, employment_status, salary
    } = req.body;

    const { emergency_contact } = req.body;
    const { bank_info } = req.body;

    const existingEmployee = await prisma.employees.findUnique({
      where: { eid: parseInt(id) }
    });

    if (!existingEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Validate gender if provided
    if (gender && gender !== 'male' && gender !== 'female') {
      return res.status(400).json({ message: 'Gender must be either male or female' });
    }

    // Validate employment_status if provided
    if (employment_status && employment_status !== 'part time' && employment_status !== 'full time') {
      return res.status(400).json({ message: 'Employment status must be either part time or full time' });
    }

    // Update employee
    const updatedEmployee = await prisma.employees.update({
      where: { eid: parseInt(id) },
      data: {
        name,
        dob,
        gender,
        email,
        phone,
        address,
        city,
        state,
        province,
        zip_code,
        job_title,
        employment_status,
        salary
      }
    });

    const exists = await prisma.emergency_contact.findUnique({
      where: { eid: parseInt(id) }
    });

    const exists2 = await prisma.bank_info.findUnique({
      where: {
        eid: parseInt(id),
        account_no: bank_info.account_no
      }
    });
    let bankInfo = null;
    let emergencyContact = null;
    if (!exists) {
      const createdEmergencyContact = await prisma.emergency_contact.create({
        data: {
          eid: parseInt(id),
          name: emergency_contact.name,
          relationship: emergency_contact.relationship,
          phone: emergency_contact.phone,
          email: emergency_contact.email
        }
      });
      emergencyContact = createdEmergencyContact;
    }
    else {
      const updatedEmergencyContact = await prisma.emergency_contact.update({
        where: { eid: parseInt(id) },
        data: {
          name: emergency_contact.name,
          relationship: emergency_contact.relationship,
          phone: emergency_contact.phone,
          email: emergency_contact.email
        }
      });
      emergencyContact = updatedEmergencyContact;
    }

    if (!exists2) {
      const createdBankInfo = await prisma.bank_info.create({
        data: {
          eid: parseInt(id),
          account_holder: bank_info.account_holder,
          account_no: bank_info.account_no,
          bank_name: bank_info.bank_name,
          branch: bank_info.branch,
          account_type: bank_info.account_type
        }
      });
      bankInfo = createdBankInfo;
    } else {
      const updatedBankInfo = await prisma.bank_info.update({
        where: {
          eid_account_no: {
            eid: parseInt(id),
            account_no: bank_info.account_no
          }
        },
        data: {
          account_holder: bank_info.account_holder,
          bank_name: bank_info.bank_name,
          branch: bank_info.branch,
          account_type: bank_info.account_type
        }
      });
      bankInfo = updatedBankInfo;
    }

    res.json(updatedEmployee, emergencyContact, bankInfo);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if employee exists
    const existingEmployee = await prisma.employees.findUnique({
      where: { eid: parseInt(id) }
    });

    if (!existingEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Delete employee (bank_info and emergency_contact will be cascade deleted)
    await prisma.employees.delete({
      where: { eid: parseInt(id) }
    });

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ===================== BANK INFO ROUTES =====================

router.get('/:id/bank-info', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const bankAccounts = await prisma.bank_info.findMany({
      where: { eid: parseInt(id) }
    });

    res.json(bankAccounts);
  } catch (error) {
    console.error('Error fetching bank information:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/bank-info', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { account_holder, account_no, bank_name, branch, account_type } = req.body;

    // Check if employee exists
    const existingEmployee = await prisma.employees.findUnique({
      where: { eid: parseInt(id) }
    });

    if (!existingEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Validate required fields
    if (!account_holder || !account_no || !bank_name) {
      return res.status(400).json({ message: 'Please provide all required fields for bank account' });
    }

    // Create bank account
    const bankAccount = await prisma.bank_info.create({
      data: {
        eid: parseInt(id),
        account_holder,
        account_no,
        bank_name,
        branch,
        account_type
      }
    });

    res.status(201).json(bankAccount);
  } catch (error) {
    console.error('Error adding bank account:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id/bank-info/:account_no', authenticateToken, async (req, res) => {
  try {
    const { id, account_no } = req.params;
    const { account_holder, bank_name, branch, account_type } = req.body;

    // Check if bank account exists
    const existingAccount = await prisma.bank_info.findFirst({
      where: {
        eid: parseInt(id),
        account_no: account_no
      }
    });

    if (!existingAccount) {
      return res.status(404).json({ message: 'Bank account not found' });
    }

    // Update bank account
    const updatedAccount = await prisma.bank_info.update({
      where: {
        eid_account_no: {
          eid: parseInt(id),
          account_no: account_no
        }
      },
      data: {
        account_holder,
        bank_name,
        branch,
        account_type
      }
    });

    res.json(updatedAccount);
  } catch (error) {
    console.error('Error updating bank account:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id/bank-info/:account_no', authenticateToken, async (req, res) => {
  try {
    const { id, account_no } = req.params;

    // Check if bank account exists
    const existingAccount = await prisma.bank_info.findFirst({
      where: {
        eid: parseInt(id),
        account_no: account_no
      }
    });

    if (!existingAccount) {
      return res.status(404).json({ message: 'Bank account not found' });
    }

    // Delete bank account
    await prisma.bank_info.delete({
      where: {
        eid_account_no: {
          eid: parseInt(id),
          account_no: account_no
        }
      }
    });

    res.json({ message: 'Bank account deleted successfully' });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id/emergency-contacts', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const contacts = await prisma.emergency_contact.findMany({
      where: { eid: parseInt(id) }
    });

    res.json(contacts);
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/emergency-contacts', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, relationship, phone, email } = req.body;

    // Check if employee exists
    const existingEmployee = await prisma.employees.findUnique({
      where: { eid: parseInt(id) }
    });

    if (!existingEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Validate required fields
    if (!name || !relationship || !phone) {
      return res.status(400).json({ message: 'Please provide all required fields for emergency contact' });
    }

    // Create emergency contact
    const contact = await prisma.emergency_contact.create({
      data: {
        eid: parseInt(id),
        name,
        relationship,
        phone,
        email
      }
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id/emergency-contacts/:phone', authenticateToken, async (req, res) => {
  try {
    const { id, phone } = req.params;
    const { name, relationship, email } = req.body;

    // Check if emergency contact exists
    const existingContact = await prisma.emergency_contact.findFirst({
      where: {
        eid: parseInt(id),
        phone: phone
      }
    });

    if (!existingContact) {
      return res.status(404).json({ message: 'Emergency contact not found' });
    }

    // Update emergency contact
    const updatedContact = await prisma.emergency_contact.update({
      where: {
        eid_phone: {
          eid: parseInt(id),
          phone: phone
        }
      },
      data: {
        name,
        relationship,
        email
      }
    });

    res.json(updatedContact);
  } catch (error) {
    console.error('Error updating emergency contact:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id/emergency-contacts/:phone', authenticateToken, async (req, res) => {
  try {
    const { id, phone } = req.params;

    // Check if emergency contact exists
    const existingContact = await prisma.emergency_contact.findFirst({
      where: {
        eid: parseInt(id),
        phone: phone
      }
    });

    if (!existingContact) {
      return res.status(404).json({ message: 'Emergency contact not found' });
    }

    // Delete emergency contact
    await prisma.emergency_contact.delete({
      where: {
        eid_phone: {
          eid: parseInt(id),
          phone: phone
        }
      }
    });

    res.json({ message: 'Emergency contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;