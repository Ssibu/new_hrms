import {
  RectangleGroupIcon,   // <-- NEW: For Dashboard
  UsersIcon,
  BookOpenIcon,         // <-- NEW: For HR Policy
  ScaleIcon,            // <-- NEW: For Leave Policy
  InboxArrowDownIcon,   // <-- NEW: For Leave Requests
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  UserIcon,
  UserGroupIcon,        // <-- NEW: For User Management
  CalendarIcon,
} from '@heroicons/react/24/outline';

// Centralized navigation configuration with improved icons for better distinction
export const navigationConfig = [
  {
    to: '/layout',
    label: 'Dashboard',
    icon: RectangleGroupIcon, // Changed from HomeIcon
    permission: null, // Always accessible
    blockForEmployee: false
  },
  {
    to: '/layout/employees',
    label: 'Employees',
    icon: UsersIcon, // Perfect match
    permission: 'employee:read',
    blockForEmployee: false
  },
  {
    to: '/layout/hr-policy',
    label: 'HR Policy',
    icon: BookOpenIcon, // Changed from DocumentTextIcon
    permission: null,
    blockForEmployee: true
  },
  {
    to: '/layout/leave-policy',
    label: 'Leave Policy',
    icon: ScaleIcon, // Changed from CalendarIcon to represent rules/balance
    permission: 'leave:read',
    blockForEmployee: true
  },
  {
    to: '/layout/leave-requests',
    label: 'Leave Requests',
    icon: InboxArrowDownIcon, // Changed from ClockIcon to represent incoming items
    permission: 'leave:update',
    blockForEmployee: true
  },
  {
    to: '/layout/leave-application',
    label: 'Leave Application',
    icon: CalendarIcon, // Perfect match for applying for dates
    permission: 'leave:create',
    blockForEmployee: false
  },
  {
    to: '/layout/tasks',
    label: 'Tasks',
    icon: ClipboardDocumentListIcon, // Perfect match
    permission: 'task:read',
    blockForEmployee: true
  },
  {
    to: '/layout/task-status',
    label: 'Task Status',
    icon: CheckCircleIcon, // Perfect match
    permission: 'task:read',
    blockForEmployee: false
  },
  {
    to: '/layout/profile',
    label: 'Profile',
    icon: UserIcon, // Perfect match for a single user's profile
    permission: null,
    blockForEmployee: false
  },
  {
    to: '/layout/users',
    label: 'User Management',
    icon: UserGroupIcon, // Changed from UserIcon to represent managing multiple users
    permission: 'admin:manage',
    blockForEmployee: true
  }
];

// Helper function to check if user has permission for a route
export const hasPermission = (user, requiredPermission) => {
  if (!user) return false;
  // Admin has all permissions
  if (user.role === 'Admin') return true;
  // If no permission is required, the route is public to logged-in users
  if (!requiredPermission) return true;
  // Check if the user's permissions array includes the required one
  return user.permissions && user.permissions.includes(requiredPermission);
};

// Helper function to check if a route should be blocked for the 'Employee' role
export const isBlockedForEmployee = (user, blockForEmployee) => {
  if (!user) return false;
  return blockForEmployee && user.role === 'Employee';
};

// Get filtered navigation items based on user role and permissions
export const getFilteredNavigation = (user) => {
  if (!user) return [];

  // Refactored for clarity: an item is shown if the user has permission AND it's not blocked for their role.
  return navigationConfig.filter(item => {
    return hasPermission(user, item.permission) && !isBlockedForEmployee(user, item.blockForEmployee);
  });
};