import { Router } from "express";
import {
  addEmployee,
  getCompanyEmployees,
  updateEmployeeRole,
  deleteEmployee,
  toggleEmployeeStatus,
  getCompanyCustomers,
  createCompanyCustomer,
} from "./user.controller.js";
import { userAuthMiddleware, authorizeRoles } from "../../middleware/auth.middleware.js";

const router = Router();

// Apply authentication middleware to all user/employee/customer endpoints
router.use(userAuthMiddleware);

router.get(
  "/customers",
  authorizeRoles("OWNER", "ADMIN", "SUPPORT_AGENT"),
  getCompanyCustomers
);

router.post(
  "/customers",
  authorizeRoles("OWNER", "ADMIN", "SUPPORT_AGENT"),
  createCompanyCustomer
);

/**
 * @route   POST /api/users/add-employee
 * @desc    Add a new employee to the company
 * @access  Private (OWNER and ADMIN only)
 */
router.post(
  "/add-employee",
  authorizeRoles("OWNER", "ADMIN"),
  addEmployee
);

/**
 * @route   GET /api/users/employees
 * @desc    Get all employees of the company (excluding CUSTOMERs)
 * @access  Private (OWNER, ADMIN, SUPPORT_AGENT)
 */
router.get(
  "/employees",
  authorizeRoles("OWNER", "ADMIN", "SUPPORT_AGENT"),
  getCompanyEmployees
);

/**
 * @route   PATCH /api/users/:id/role
 * @desc    Update employee role
 * @access  Private (OWNER only)
 */
router.patch(
  "/:id/role",
  authorizeRoles("OWNER"),
  updateEmployeeRole
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Soft delete (deactivate) an employee
 * @access  Private (OWNER and ADMIN only)
 */
router.delete(
  "/:id",
  authorizeRoles("OWNER", "ADMIN"),
  deleteEmployee
);

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Toggle employee active/inactive status
 * @access  Private (OWNER and ADMIN only)
 */
router.patch(
  "/:id/status",
  authorizeRoles("OWNER", "ADMIN"),
  toggleEmployeeStatus
);

export default router;
