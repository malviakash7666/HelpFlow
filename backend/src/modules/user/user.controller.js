import bcrypt from "bcrypt";
import { Op } from "sequelize";
import db from "../../database/models/index.js";

const { User } = db;

/**
 * Helper to validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * @desc    Add a new employee (ADMIN or SUPPORT_AGENT)
 * @route   POST /api/users/add-employee
 * @access  Private (OWNER, ADMIN only)
 */
export const addEmployee = async (req, res) => {
  try {
    const { name, email } = req.body;
    const { companyId } = req.user;

    // 1. Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required.",
        data: null,
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
        data: null,
      });
    }

    // 2. Employees are strictly assigned the SUPPORT_AGENT role
    const role = "SUPPORT_AGENT";

    // 3. Check for duplicate email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email address already exists.",
        data: null,
      });
    }

    // 4. Generate random temporary password and hash it
    const tempPassword = Math.random().toString(36).slice(-8) + "A1!";
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

    // 5. Create employee
    const newEmployee = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      companyId,
      isActive: true,
    });

    // 6. Return response (never return password)
    const employeeData = newEmployee.toJSON();
    delete employeeData.password;

    return res.status(201).json({
      success: true,
      message: "Employee added successfully.",
      data: {
        employee: employeeData,
        temporaryPassword: tempPassword, // Return so admin/owner can share it with the new employee
      },
    });
  } catch (error) {
    console.error("Add Employee Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while adding employee.",
      data: null,
    });
  }
};

/**
 * @desc    Get all employees belonging to the company (excluding CUSTOMER role)
 * @route   GET /api/users/employees
 * @access  Private (OWNER, ADMIN, SUPPORT_AGENT)
 */
export const getCompanyEmployees = async (req, res) => {
  try {
    const { companyId } = req.user;

    const employees = await User.findAll({
      where: {
        companyId,
        role: {
          [Op.ne]: "CUSTOMER",
        },
      },
      attributes: ["id", "name", "email", "role", "isActive"],
      order: [["createdAt", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Employees fetched successfully.",
      data: employees,
    });
  } catch (error) {
    console.error("Get Company Employees Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching employees.",
      data: null,
    });
  }
};

/**
 * @desc    Update employee role
 * @route   PATCH /api/users/:id/role
 * @access  Private (OWNER only)
 */
export const updateEmployeeRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const { companyId } = req.user;

    // 1. Validate role input
    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required.",
        data: null,
      });
    }

    const allowedRoles = ["OWNER", "ADMIN", "SUPPORT_AGENT"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role assigned.",
        data: null,
      });
    }

    // 2. Find the employee and ensure they belong to the same company
    const employee = await User.findOne({
      where: {
        id,
        companyId,
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found or does not belong to your company.",
        data: null,
      });
    }

    // 3. Update the role
    employee.role = role;
    await employee.save();

    const employeeData = employee.toJSON();
    delete employeeData.password;

    return res.status(200).json({
      success: true,
      message: "Employee role updated successfully.",
      data: employeeData,
    });
  } catch (error) {
    console.error("Update Employee Role Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating employee role.",
      data: null,
    });
  }
};

/**
 * @desc    Soft delete employee (set isActive=false)
 * @route   DELETE /api/users/:id
 * @access  Private (OWNER, ADMIN only)
 */
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    // 1. Find employee and ensure they belong to the same company
    const employee = await User.findOne({
      where: {
        id,
        companyId,
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found or does not belong to your company.",
        data: null,
      });
    }

    // Prevent OWNER from soft deleting themselves (crucial safeguard)
    if (employee.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete/deactivate your own account.",
        data: null,
      });
    }

    // 2. Soft delete (set isActive to false)
    employee.isActive = false;
    await employee.save();

    const employeeData = employee.toJSON();
    delete employeeData.password;

    return res.status(200).json({
      success: true,
      message: "Employee deactivated successfully.",
      data: employeeData,
    });
  } catch (error) {
    console.error("Delete Employee Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deactivating employee.",
      data: null,
    });
  }
};

/**
 * @desc    Toggle employee status (Activate / Deactivate)
 * @route   PATCH /api/users/:id/status
 * @access  Private (OWNER, ADMIN only)
 */
export const toggleEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const employee = await User.findOne({
      where: { id, companyId },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found or does not belong to your company.",
        data: null,
      });
    }

    if (employee.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own account status.",
        data: null,
      });
    }

    employee.isActive = !employee.isActive;
    await employee.save();

    const employeeData = employee.toJSON();
    delete employeeData.password;

    return res.status(200).json({
      success: true,
      message: `Employee ${employee.isActive ? "activated" : "deactivated"} successfully.`,
      data: employeeData,
    });
  } catch (error) {
    console.error("Toggle Employee Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while toggling employee status.",
      data: null,
    });
  }
};

/**
 * @desc    Get all customers for the company (role = 'CUSTOMER')
 * @route   GET /api/users/customers
 * @access  Private (OWNER, ADMIN, SUPPORT_AGENT)
 */
export const getCompanyCustomers = async (req, res) => {
  try {
    const { companyId } = req.user;
    const customers = await User.findAll({
      where: { companyId, role: "CUSTOMER" },
      attributes: ["id", "name", "email", "phone", "location", "isActive", "createdAt", "updatedAt"],
      order: [["createdAt", "DESC"]],
    });

    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const ticketCount = await db.Ticket.count({
          where: { customerId: customer.id }
        });

        const lastTicket = await db.Ticket.findOne({
          where: { customerId: customer.id },
          order: [["updatedAt", "DESC"]],
          attributes: ["updatedAt"]
        });

        return {
          ...customer.toJSON(),
          totalTickets: ticketCount,
          lastActive: lastTicket ? lastTicket.updatedAt : customer.updatedAt,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Customers retrieved successfully.",
      data: customersWithStats,
    });
  } catch (error) {
    console.error("Get Company Customers Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while retrieving customers.",
      data: null,
    });
  }
};

/**
 * @desc    Create/update customer manually
 * @route   POST /api/users/customers
 * @access  Private (OWNER, ADMIN, SUPPORT_AGENT)
 */
export const createCompanyCustomer = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { name, email, phone, location } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Customer name and email are required.",
        data: null,
      });
    }

    let customer = await User.findOne({
      where: { email, companyId }
    });

    if (customer) {
      customer.name = name;
      if (phone !== undefined) customer.phone = phone;
      if (location !== undefined) customer.location = location;
      await customer.save();
    } else {
      const dummyPassword = await bcrypt.hash("customer_temp_pass_123!", 10);
      customer = await User.create({
        name,
        email,
        phone: phone || null,
        location: location || null,
        role: "CUSTOMER",
        companyId,
        password: dummyPassword,
        isActive: true,
      });
    }

    const customerData = customer.toJSON();
    delete customerData.password;

    return res.status(200).json({
      success: true,
      message: "Customer profile processed successfully.",
      data: customerData,
    });
  } catch (error) {
    console.error("Create Customer Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating customer profile.",
      data: null,
    });
  }
};
