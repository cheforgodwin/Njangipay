// User Role Routing Configuration
export const USER_ROUTES = {
  // Super Admin - System oversight
  'super-admin': {
    path: '/super-admin',
    component: 'SuperAdminDashboard',
    description: 'System administration and oversight',
    permissions: ['all_access', 'user_management', 'system_config']
  },
  
  // Bank Admin - Banking operations
  'bank-admin': {
    path: '/bank-dashboard',
    component: 'BankDashboard',
    description: 'Bank partnership and liquidity management',
    permissions: ['bank_operations', 'transaction_monitoring', 'compliance']
  },
  
  // System Admin - Community management
  'admin': {
    path: '/admin/communities',
    component: 'SuperAdminDashboard',
    description: 'Community administration and user management',
    permissions: ['community_management', 'user_moderation', 'content_management']
  },
  
  // Community Representative - Group creation and management
  'community': {
    path: '/groups',
    component: 'GroupsPage',
    description: 'Create and manage savings communities',
    permissions: ['group_creation', 'community_management', 'member_invitation']
  },
  
  // Community Admin - Community oversight and management
  'community-admin': {
    path: '/admin/communities',
    component: 'SuperAdminDashboard',
    description: 'Community administration and oversight',
    permissions: ['community_management', 'user_moderation', 'group_oversight']
  },
  
  // Group Leader - Group-specific management
  'leader': {
    path: '/leader',
    component: 'GroupDashboard',
    description: 'Lead and manage specific savings groups',
    permissions: ['group_leadership', 'payout_management', 'member_management']
  },
  
  // Auditor - Compliance and audit
  'auditor': {
    path: '/auditor',
    component: 'GroupDashboard',
    description: 'Audit transactions and ensure compliance',
    permissions: ['audit_access', 'transaction_review', 'compliance_check']
  },
  
  // Regular User - Basic participation
  'user': {
    path: '/dashboard',
    component: 'UserDashboard',
    description: 'Personal dashboard and group participation',
    permissions: ['group_participation', 'contribution_management', 'loan_application']
  }
};

// Account Type to Role Mapping
export const ACCOUNT_TYPE_TO_ROLE = {
  'community': 'community',
  'bank': 'bank-admin',
  'admin': 'admin',
  'community-admin': 'community-admin',
  'leader': 'leader',
  'auditor': 'auditor',
  'user': 'user'
};

// Role-based access control helper
export const getRolePermissions = (role) => {
  return USER_ROUTES[role]?.permissions || [];
};

// Route validation helper
export const canAccessRoute = (userRole, targetRoute) => {
  const userRoute = USER_ROUTES[userRole];
  if (!userRoute) return false;
  
  // Super admin can access everything
  if (userRole === 'super-admin') return true;
  
  // Check exact route match
  if (userRoute.path === targetRoute) return true;
  
  // Check route prefixes for nested access
  if (targetRoute.startsWith(userRoute.path)) return true;
  
  return false;
};

export default USER_ROUTES;
