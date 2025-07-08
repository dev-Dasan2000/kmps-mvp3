import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
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

// Get employee by ID (used by payroll page)
router.get('/:id', async (req, res) => {
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

router.post('/employees', async (req, res) => {
  console.debug("employe post route called");
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

    // Check for valid gender value
    if (gender !== 'male' && gender !== 'female') {
      return res.status(400).json({ message: 'Gender must be either male or female' });
    }

    // Check for valid employment_status value
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

    // Create bank info if provided
    if (bank_info && bank_info.length > 0) {
      for (const bankAccount of bank_info) {
        await prisma.bank_info.create({
          data: {
            eid: newEmployee.eid,
            account_holder: bankAccount.account_holder,
            account_no: bankAccount.account_no,
            bank_name: bankAccount.bank_name,
            branch: bankAccount.branch,
            account_type: bankAccount.account_type
          }
        });
      }
    }

    // Create emergency contacts if provided
    if (emergency_contact && emergency_contact.length > 0) {
      for (const contact of emergency_contact) {
        await prisma.emergency_contact.create({
          data: {
            eid: newEmployee.eid,
            name: contact.name,
            relationship: contact.relationship,
            phone: contact.phone,
            email: contact.email
          }
        });
      }
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

router.put('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, dob, gender, email, phone, address, city, state, province,
      zip_code, job_title, employment_status, salary
    } = req.body;

    // Check if employee exists
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

    res.json(updatedEmployee);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
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

router.get('/employees/:id/bank-info', async (req, res) => {
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

router.post('/employees/:id/bank-info', async (req, res) => {
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

router.put('/employees/:id/bank-info/:account_no', async (req, res) => {
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

router.delete('/employees/:id/bank-info/:account_no', async (req, res) => {
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

router.get('/employees/:id/emergency-contacts', async (req, res) => {
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

router.post('/employees/:id/emergency-contacts', async (req, res) => {
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

router.put('/employees/:id/emergency-contacts/:phone', async (req, res) => {
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

router.delete('/employees/:id/emergency-contacts/:phone', async (req, res) => {
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