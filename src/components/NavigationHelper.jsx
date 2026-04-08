import React from 'react';
import { useNavigate } from 'react-router-dom';

// Helper component for consistent navigation across the app
export const useNavigationHelper = () => {
  const navigate = useNavigate();

  const navigateToGroup = (groupId, tab = 'overview') => {
    const path = tab === 'overview' ? `/group/${groupId}` : `/group/${groupId}/${tab}`;
    navigate(path);
  };

  const navigateToLeaderDashboard = (groupId, tab = 'overview') => {
    const path = tab === 'overview' ? '/leader/group' : `/leader/${tab}`;
    if (groupId) {
      navigate(`/leader/group?groupId=${groupId}`);
    } else {
      navigate(path);
    }
  };

  const navigateToAuditorDashboard = (tab = 'overview') => {
    const path = tab === 'overview' ? `/auditor` : `/auditor/${tab}`;
    navigate(path);
  };

  const navigateToAdminDashboard = (tab = 'overview') => {
    const path = tab === 'overview' ? `/admin/communities` : `/admin/${tab}`;
    navigate(path);
  };

  const navigateToSuperAdmin = (tab = 'overview') => {
    navigate(`/super-admin`);
  };

  const navigateToBankDashboard = () => {
    navigate('/bank-dashboard');
  };

  return {
    navigateToGroup,
    navigateToLeaderDashboard,
    navigateToAuditorDashboard,
    navigateToAdminDashboard,
    navigateToSuperAdmin,
    navigateToBankDashboard
  };
};

// Route constants for consistency
export const ROUTES = {
  PUBLIC: {
    HOME: '/',
    LOGIN: '/login',
    SIGNUP: '/signup'
  },
  PROTECTED: {
    DASHBOARD: '/dashboard',
    WALLET: '/wallet',
    GROUPS: '/groups',
    MARKETPLACE: '/marketplace',
    SETTINGS: '/settings',
    MESSAGES: '/messages',
    NOTIFICATIONS: '/notifications'
  },
  GROUP: {
    OVERVIEW: (groupId) => `/group/${groupId}`,
    MEMBERS: (groupId) => `/group/${groupId}/members`,
    CONTRIBUTIONS: (groupId) => `/group/${groupId}/contributions`,
    ROTATION: (groupId) => `/group/${groupId}/rotation`,
    LOANS: (groupId) => `/group/${groupId}/loans`,
    MEETINGS: (groupId) => `/group/${groupId}/meetings`,
    AUDIT: (groupId) => `/group/${groupId}/audit`,
    REPORTS: (groupId) => `/group/${groupId}/reports`
  },
  LEADER: {
    DASHBOARD: '/leader',
    GROUP: '/leader/group',
    MEMBERS: '/leader/members',
    CONTRIBUTIONS: '/leader/contributions',
    SCHEDULE: '/leader/schedule',
    ROTATION: '/leader/rotation',
    DISBURSEMENTS: '/leader/disbursements',
    LOAN_REQUESTS: '/leader/loan-requests',
    LOAN_TRACKING: '/leader/loan-tracking',
    ANNOUNCEMENTS: '/leader/announcements',
    NOTIFICATIONS: '/leader/notifications',
    REPORTS: '/leader/reports',
    SETTINGS: '/leader/settings'
  },
  AUDITOR: {
    DASHBOARD: '/auditor',
    TRANSACTIONS: '/auditor/transactions',
    CONTRIBUTIONS: '/auditor/contributions',
    PAYOUTS: '/auditor/payouts',
    AUDIT: '/auditor/audit',
    DISCREPANCIES: '/auditor/discrepancies',
    FRAUD: '/auditor/fraud'
  },
  ADMIN: {
    COMMUNITIES: '/admin/communities',
    USERS: '/admin/users',
    AI_RISK_SCORES: '/admin/ai-risk-scores',
    TRANSACTIONS: '/admin/transactions',
    PAYMENTS: '/admin/payments',
    LOANS: '/admin/loans',
    REPORTS: '/admin/reports',
    AUDIT: '/admin/audit',
    FRAUD: '/admin/fraud',
    SETTINGS: '/admin/settings',
    INTEGRATIONS: '/admin/integrations',
    ALERTS: '/admin/alerts'
  },
  SUPER_ADMIN: {
    DASHBOARD: '/super-admin',
    ALTERNATE: '/superadmin'
  },
  BANK: {
    DASHBOARD: '/bank-dashboard'
  },
  SUPPORT: {
    DASHBOARD: '/support'
  },
  INVESTOR: {
    DASHBOARD: '/investor'
  },
  UTILITIES: {
    SETUP_ADMIN: '/setup-admin',
    PARTNERS: '/partners'
  }
};

export default useNavigationHelper;
