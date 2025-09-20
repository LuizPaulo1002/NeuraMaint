'use client';

import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute, LogoutButton } from '@/components/auth';

// Example usage of the authentication system
export function AuthTestComponent() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    isAdmin, 
    isGestor, 
    isTecnico,
    canManageUsers,
    canViewReports,
    canResolveAlerts 
  } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div className=\"p-6 bg-white rounded-lg shadow\">
      <h2 className=\"text-xl font-bold mb-4\">Authentication Status</h2>
      
      <div className=\"space-y-2\">
        <p><strong>User:</strong> {user?.nome} ({user?.email})</p>
        <p><strong>Role:</strong> {user?.role}</p>
        <p><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
        <p><strong>Is Gestor:</strong> {isGestor ? 'Yes' : 'No'}</p>
        <p><strong>Is Tecnico:</strong> {isTecnico ? 'Yes' : 'No'}</p>
        <p><strong>Can Manage Users:</strong> {canManageUsers ? 'Yes' : 'No'}</p>
        <p><strong>Can View Reports:</strong> {canViewReports ? 'Yes' : 'No'}</p>
        <p><strong>Can Resolve Alerts:</strong> {canResolveAlerts ? 'Yes' : 'No'}</p>
      </div>

      <div className=\"mt-4\">
        <LogoutButton />
      </div>
    </div>
  );
}

// Example of protected route usage
export function AdminOnlyComponent() {
  return (
    <ProtectedRoute requiredRole=\"admin\">
      <div className=\"p-4 bg-red-50 border border-red-200 rounded-lg\">
        <h3 className=\"font-bold text-red-800\">Admin Only Content</h3>
        <p className=\"text-red-600\">This content is only visible to administrators.</p>
      </div>
    </ProtectedRoute>
  );
}

// Example of multi-role protection
export function ManagerTechnicianComponent() {
  return (
    <ProtectedRoute requireAnyRole={['gestor', 'tecnico']}>
      <div className=\"p-4 bg-blue-50 border border-blue-200 rounded-lg\">
        <h3 className=\"font-bold text-blue-800\">Manager/Technician Content</h3>
        <p className=\"text-blue-600\">This content is visible to managers and technicians.</p>
      </div>
    </ProtectedRoute>
  );
}