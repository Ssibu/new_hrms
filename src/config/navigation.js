import {
  HomeIcon,
  UsersIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

// Centralized navigation configuration
export const navigationConfig = [
  {
    to: '/layout',
    label: 'Dashboard',
    icon: HomeIcon,
    permission: null, // Always accessible
    blockForEmployee: false
  },
  {
    to: '/layout/employees',
    label: 'Employees',
    icon: UsersIcon,
    permission: 'employee:read',
    blockForEmployee: false
  },
  {
    to: '/layout/hr-policy',
    label: 'HR Policy',
    icon: DocumentTextIcon,
    permission: null,
    blockForEmployee: true
  },
  {
    to: '/layout/leave-policy',
    label: 'Leave Policy',
    icon: CalendarIcon,
    permission: 'leave:read',
    blockForEmployee: true
  },
  {
    to: '/layout/leave-requests',
    label: 'Leave Requests',
    icon: ClockIcon,
    permission: 'leave:update', // HR needs update permission to approve/reject
    blockForEmployee: true
  },
  {
    to: '/layout/leave-application',
    label: 'Leave Application',
    icon: CalendarIcon,
    permission: 'leave:create', // Employees need create permission to apply
    blockForEmployee: false
  },
  {
    to: '/layout/tasks',
    label: 'Tasks',
    icon: ClipboardDocumentListIcon,
    permission: 'task:read',
    blockForEmployee: true
  },
  {
    to: '/layout/task-status',
    label: 'Task Status',
    icon: CheckCircleIcon,
    permission: 'task:read',
    blockForEmployee: false
  },
  {
    to: '/layout/profile',
    label: 'Profile',
    icon: UserIcon,
    permission: null,
    blockForEmployee: false
  },
  {
    to: '/layout/users',
    label: 'User Management',
    icon: UserIcon,
    permission: 'admin:manage',
    blockForEmployee: true
  }
];

// Helper function to check if user has permission for a route
export const hasPermission = (user, requiredPermission) => {
  if (!user) return false;
  if (user.role === 'Admin') return true;
  if (!requiredPermission) return true;
  return user.permissions && user.permissions.includes(requiredPermission);
};

// Helper function to check if route should be blocked for employee
export const isBlockedForEmployee = (user, blockForEmployee) => {
  if (!user) return false;
  return blockForEmployee && user.role === 'Employee';
};

// Get filtered navigation items based on user permissions
export const getFilteredNavigation = (user) => {
  if (!user) return [];

  return navigationConfig.filter(item => {
    // Admin can see everything
    if (user.role === 'Admin') return true;
    
    // Check if blocked for employee
    if (isBlockedForEmployee(user, item.blockForEmployee)) return false;
    
    // Check permission
    return hasPermission(user, item.permission);
  });
}; 