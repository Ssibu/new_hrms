import React from 'react';
import { useConfig } from '../context/ConfigContext';
import { getFilteredNavigation, hasPermission } from '../config/navigation';

const PermissionDebug = () => {
  const { user } = useConfig();
  const accessibleRoutes = getFilteredNavigation(user);

  if (!user) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">🔍 Permission Debug</h3>
      <div className="text-sm text-yellow-700 space-y-1">
        <div><strong>User:</strong> {user.name} ({user.role})</div>
        <div><strong>Permissions:</strong> {user.permissions?.join(', ') || 'None'}</div>
        <div><strong>Accessible Routes:</strong> {accessibleRoutes.length}</div>
        <div className="mt-2">
          <strong>Available Pages:</strong>
          <ul className="list-disc list-inside ml-2 mt-1">
            {accessibleRoutes.map(route => (
              <li key={route.to}>{route.label}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PermissionDebug; 