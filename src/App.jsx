
import React, { useState, useEffect } from 'react';

// --- ROLES and RBAC Configuration ---
const ROLES = {
  ADMIN: {
    name: 'Admin',
    canView: ['DASHBOARD', 'CLAIM_DETAIL', 'CLAIM_FORM', 'USERS', 'REPORTS'],
    canEdit: true,
    canApprove: true,
    canReject: true,
    canEscalate: true,
    canManageUsers: true,
    canAccessAuditLogs: true,
  },
  CLAIMS_OFFICER: {
    name: 'Claims Officer',
    canView: ['DASHBOARD', 'CLAIM_DETAIL', 'CLAIM_FORM'],
    canEdit: true,
    canApprove: true,
    canReject: true,
    canEscalate: false,
    canAccessAuditLogs: true,
  },
  FINANCE_TEAM: {
    name: 'Finance Team',
    canView: ['DASHBOARD', 'CLAIM_DETAIL', 'REPORTS'],
    canEdit: false,
    canApprove: false, // They might "settle" but not "approve" in this context
    canReject: false,
    canEscalate: false,
    canAccessAuditLogs: true,
  },
  POLICYHOLDER: {
    name: 'Policyholder',
    canView: ['DASHBOARD', 'CLAIM_DETAIL', 'CLAIM_FORM'],
    canEdit: false, // Can edit their own DRAFT claims, but not others
    canApprove: false,
    canReject: false,
    canEscalate: false,
    canAccessAuditLogs: false,
  },
};

// --- Standardized Status Keys and UI Mapping ---
const STATUS_MAPPING = {
  SUBMITTED: { label: 'Submitted', className: 'submitted', colorVar: '--status-submitted' },
  PENDING: { label: 'Pending Review', className: 'pending', colorVar: '--status-pending' },
  IN_REVIEW: { label: 'In Review', className: 'in-review', colorVar: '--status-in-review' },
  APPROVED: { label: 'Approved', className: 'approved', colorVar: '--status-approved' },
  REJECTED: { label: 'Rejected', className: 'rejected', colorVar: '--status-rejected' },
  SETTLED: { label: 'Settled', className: 'settled', colorVar: '--status-settled' },
  ESCALATED: { label: 'Escalated', className: 'escalated', colorVar: '--status-escalated' },
  DRAFT: { label: 'Draft', className: 'draft', colorVar: '--status-draft' },
};

const CLAIM_STATUSES = Object.keys(STATUS_MAPPING);

// --- Dummy Data ---
const MOCK_USERS = [
  { id: 'u1', username: 'admin@example.com', role: ROLES.ADMIN, name: 'Admin User' },
  { id: 'u2', username: 'officer@example.com', role: ROLES.CLAIMS_OFFICER, name: 'Ava Claims' },
  { id: 'u3', username: 'finance@example.com', role: ROLES.FINANCE_TEAM, name: 'Finley Fox' },
  { id: 'u4', username: 'policy@example.com', role: ROLES.POLICYHOLDER, name: 'Patty Policy' },
];

const MOCK_CLAIMS = [
  {
    id: 'CL001',
    policyNumber: 'POL-001-AUTO',
    claimType: 'Vehicle Damage',
    submittedDate: '2023-10-26',
    status: 'APPROVED',
    amount: 1500.75,
    policyHolder: { id: 'ph1', name: 'Patty Policy', email: 'patty.policy@example.com', phone: '555-1234' },
    description: 'Minor collision damage to front bumper.',
    documents: [
      { id: 'doc1', name: 'Accident Report.pdf', url: '/docs/CL001_report.pdf', uploadedBy: 'Patty Policy', uploadedDate: '2023-10-26' },
      { id: 'doc2', name: 'Repair Quote.pdf', url: '/docs/CL001_quote.pdf', uploadedBy: 'Auto Shop', uploadedDate: '2023-10-27' },
    ],
    workflowStages: [
      { stage: 'Submitted', date: '2023-10-26', completedBy: 'System', slaDue: '2023-10-28', status: 'completed' },
      { stage: 'Initial Review', date: '2023-10-27', completedBy: 'Ava Claims', slaDue: '2023-10-29', status: 'completed' },
      { stage: 'Verification', date: '2023-10-28', completedBy: 'Ava Claims', slaDue: '2023-10-30', status: 'completed' },
      { stage: 'Approval', date: '2023-10-29', completedBy: 'Admin User', slaDue: '2023-10-31', status: 'completed' },
      { stage: 'Settlement', date: null, completedBy: null, slaDue: '2023-11-02', status: 'upcoming' },
    ],
    auditTrail: [
      { timestamp: '2023-10-26 10:00', user: 'System', action: 'Claim submitted', details: 'Initial submission by policyholder' },
      { timestamp: '2023-10-27 09:15', user: 'Ava Claims', action: 'Status changed', details: 'From SUBMITTED to IN_REVIEW' },
      { timestamp: '2023-10-28 14:30', user: 'Ava Claims', action: 'Documents verified', details: 'All supporting documents checked' },
      { timestamp: '2023-10-29 11:00', user: 'Admin User', action: 'Claim approved', details: 'Approved for 1500.75 USD' },
    ],
  },
  {
    id: 'CL002',
    policyNumber: 'POL-002-HOME',
    claimType: 'Fire Damage',
    submittedDate: '2023-11-01',
    status: 'ESCALATED',
    amount: 50000.00,
    policyHolder: { id: 'ph2', name: 'Robert Homeowner', email: 'robert.h@example.com', phone: '555-5678' },
    description: 'Extensive fire damage to kitchen area.',
    documents: [
      { id: 'doc3', name: 'Police Report.pdf', url: '/docs/CL002_police.pdf', uploadedBy: 'Robert Homeowner', uploadedDate: '2023-11-01' },
      { id: 'doc4', name: 'Fire Department Report.pdf', url: '/docs/CL002_fire.pdf', uploadedBy: 'Fire Dept.', uploadedDate: '2023-11-02' },
      { id: 'doc5', name: 'Contractor Estimate.pdf', url: '/docs/CL002_estimate.pdf', uploadedBy: 'Contractor', uploadedDate: '2023-11-03' },
    ],
    workflowStages: [
      { stage: 'Submitted', date: '2023-11-01', completedBy: 'System', slaDue: '2023-11-03', status: 'completed' },
      { stage: 'Initial Review', date: '2023-11-02', completedBy: 'Ava Claims', slaDue: '2023-11-04', status: 'completed' },
      { stage: 'Verification', date: '2023-11-03', completedBy: 'Ava Claims', slaDue: '2023-11-05', status: 'completed' },
      { stage: 'Approval', date: null, completedBy: null, slaDue: '2023-11-07', status: 'active', slaBreached: true },
      { stage: 'Settlement', date: null, completedBy: null, slaDue: '2023-11-10', status: 'upcoming' },
    ],
    auditTrail: [
      { timestamp: '2023-11-01 11:30', user: 'System', action: 'Claim submitted', details: 'Policyholder submitted claim' },
      { timestamp: '2023-11-02 10:00', user: 'Ava Claims', action: 'Status changed', details: 'From SUBMITTED to IN_REVIEW' },
      { timestamp: '2023-11-03 16:00', user: 'Ava Claims', action: 'Documents verified', details: 'Police and Fire Dept. reports attached' },
      { timestamp: '2023-11-04 10:00', user: 'Ava Claims', action: 'Status changed', details: 'From IN_REVIEW to PENDING' },
      { timestamp: '2023-11-05 09:00', user: 'Ava Claims', action: 'Claim escalated', details: 'Due to high value and complexity' },
    ],
  },
  {
    id: 'CL003',
    policyNumber: 'POL-003-LIFE',
    claimType: 'Death Benefit',
    submittedDate: '2023-09-15',
    status: 'SETTLED',
    amount: 100000.00,
    policyHolder: { id: 'ph3', name: 'Beneficiary Name', email: 'beneficiary@example.com', phone: '555-9012' },
    description: 'Claim for life insurance policy payout.',
    documents: [
      { id: 'doc6', name: 'Death Certificate.pdf', url: '/docs/CL003_death.pdf', uploadedBy: 'Beneficiary', uploadedDate: '2023-09-15' },
    ],
    workflowStages: [
      { stage: 'Submitted', date: '2023-09-15', completedBy: 'System', slaDue: '2023-09-17', status: 'completed' },
      { stage: 'Initial Review', date: '2023-09-16', completedBy: 'Ava Claims', slaDue: '2023-09-18', status: 'completed' },
      { stage: 'Verification', date: '2023-09-17', completedBy: 'Ava Claims', slaDue: '2023-09-19', status: 'completed' },
      { stage: 'Approval', date: '2023-09-18', completedBy: 'Admin User', slaDue: '2023-09-20', status: 'completed' },
      { stage: 'Settlement', date: '2023-09-20', completedBy: 'Finley Fox', slaDue: '2023-09-22', status: 'completed' },
    ],
    auditTrail: [
      { timestamp: '2023-09-15 14:00', user: 'System', action: 'Claim submitted', details: 'Death benefit claim' },
      { timestamp: '2023-09-16 09:00', user: 'Ava Claims', action: 'Status changed', details: 'From SUBMITTED to IN_REVIEW' },
      { timestamp: '2023-09-17 11:00', user: 'Ava Claims', action: 'Death certificate verified', details: 'Document check complete' },
      { timestamp: '2023-09-18 10:00', user: 'Admin User', action: 'Claim approved', details: 'Approved for 100,000.00 USD' },
      { timestamp: '2023-09-20 15:00', user: 'Finley Fox', action: 'Claim settled', details: 'Payment processed to beneficiary' },
    ],
  },
  {
    id: 'CL004',
    policyNumber: 'POL-004-TRAVEL',
    claimType: 'Lost Luggage',
    submittedDate: '2023-12-05',
    status: 'IN_REVIEW',
    amount: 800.00,
    policyHolder: { id: 'ph4', name: 'Gary Globetrotter', email: 'gary.g@example.com', phone: '555-3456' },
    description: 'Luggage lost during international flight.',
    documents: [
      { id: 'doc7', name: 'Airline Report.pdf', url: '/docs/CL004_airline.pdf', uploadedBy: 'Gary Globetrotter', uploadedDate: '2023-12-05' },
      { id: 'doc8', name: 'Proof of Purchase.pdf', url: '/docs/CL004_receipts.pdf', uploadedBy: 'Gary Globetrotter', uploadedDate: '2023-12-06' },
    ],
    workflowStages: [
      { stage: 'Submitted', date: '2023-12-05', completedBy: 'System', slaDue: '2023-12-07', status: 'completed' },
      { stage: 'Initial Review', date: '2023-12-06', completedBy: 'Ava Claims', slaDue: '2023-12-08', status: 'active' },
      { stage: 'Verification', date: null, completedBy: null, slaDue: '2023-12-09', status: 'upcoming' },
      { stage: 'Approval', date: null, completedBy: null, slaDue: '2023-12-11', status: 'upcoming' },
      { stage: 'Settlement', date: null, completedBy: null, slaDue: '2023-12-13', status: 'upcoming' },
    ],
    auditTrail: [
      { timestamp: '2023-12-05 17:00', user: 'System', action: 'Claim submitted', details: 'Lost luggage claim' },
      { timestamp: '2023-12-06 09:30', user: 'Ava Claims', action: 'Status changed', details: 'From SUBMITTED to IN_REVIEW' },
    ],
  },
  {
    id: 'CL005',
    policyNumber: 'POL-005-HEALTH',
    claimType: 'Medical Expense',
    submittedDate: '2023-11-20',
    status: 'PENDING',
    amount: 2500.00,
    policyHolder: { id: 'ph5', name: 'Helen Health', email: 'helen.h@example.com', phone: '555-7890' },
    description: 'Medical expenses for emergency room visit.',
    documents: [
      { id: 'doc9', name: 'Hospital Bill.pdf', url: '/docs/CL005_bill.pdf', uploadedBy: 'Helen Health', uploadedDate: '2023-11-20' },
      { id: 'doc10', name: 'Medical Report.pdf', url: '/docs/CL005_report.pdf', uploadedBy: 'Hospital', uploadedDate: '2023-11-21' },
    ],
    workflowStages: [
      { stage: 'Submitted', date: '2023-11-20', completedBy: 'System', slaDue: '2023-11-22', status: 'completed' },
      { stage: 'Initial Review', date: '2023-11-21', completedBy: 'Ava Claims', slaDue: '2023-11-23', status: 'active' },
      { stage: 'Verification', date: null, completedBy: null, slaDue: '2023-11-25', status: 'upcoming' },
      { stage: 'Approval', date: null, completedBy: null, slaDue: '2023-11-27', status: 'upcoming' },
      { stage: 'Settlement', date: null, completedBy: null, slaDue: '2023-11-29', status: 'upcoming' },
    ],
    auditTrail: [
      { timestamp: '2023-11-20 08:00', user: 'System', action: 'Claim submitted', details: 'Medical claim' },
      { timestamp: '2023-11-21 13:00', user: 'Ava Claims', action: 'Status changed', details: 'From SUBMITTED to PENDING' },
    ],
  },
  {
    id: 'CL006',
    policyNumber: 'POL-001-AUTO',
    claimType: 'Windshield Repair',
    submittedDate: '2023-12-10',
    status: 'DRAFT',
    amount: 350.00,
    policyHolder: { id: 'ph1', name: 'Patty Policy', email: 'patty.policy@example.com', phone: '555-1234' },
    description: 'Small crack in windshield, needs repair.',
    documents: [],
    workflowStages: [
      { stage: 'Submitted', date: null, completedBy: null, slaDue: '2023-12-12', status: 'active' },
      { stage: 'Initial Review', date: null, completedBy: null, slaDue: '2023-12-14', status: 'upcoming' },
      { stage: 'Verification', date: null, completedBy: null, slaDue: '2023-12-16', status: 'upcoming' },
      { stage: 'Approval', date: null, completedBy: null, slaDue: '2023-12-18', status: 'upcoming' },
      { stage: 'Settlement', date: null, completedBy: null, slaDue: '2023-12-20', status: 'upcoming' },
    ],
    auditTrail: [
      { timestamp: '2023-12-10 14:00', user: 'Patty Policy', action: 'Claim saved as draft', details: 'Started windshield repair claim' },
    ],
  },
  {
    id: 'CL007',
    policyNumber: 'POL-006-PROPERTY',
    claimType: 'Water Damage',
    submittedDate: '2023-11-25',
    status: 'REJECTED',
    amount: 12000.00,
    policyHolder: { id: 'ph6', name: 'Peter Property', email: 'peter.p@example.com', phone: '555-2345' },
    description: 'Pipe burst in basement, causing extensive water damage.',
    documents: [
      { id: 'doc11', name: 'Plumber Invoice.pdf', url: '/docs/CL007_plumber.pdf', uploadedBy: 'Peter Property', uploadedDate: '2023-11-25' },
    ],
    workflowStages: [
      { stage: 'Submitted', date: '2023-11-25', completedBy: 'System', slaDue: '2023-11-27', status: 'completed' },
      { stage: 'Initial Review', date: '2023-11-26', completedBy: 'Ava Claims', slaDue: '2023-11-28', status: 'completed' },
      { stage: 'Verification', date: '2023-11-27', completedBy: 'Ava Claims', slaDue: '2023-11-29', status: 'completed' },
      { stage: 'Approval', date: '2023-11-28', completedBy: 'Admin User', slaDue: '2023-11-30', status: 'completed' },
      { stage: 'Settlement', date: null, completedBy: null, slaDue: '2023-12-02', status: 'rejected' }, // Workflow ends here if rejected
    ],
    auditTrail: [
      { timestamp: '2023-11-25 09:00', user: 'System', action: 'Claim submitted', details: 'Water damage claim' },
      { timestamp: '2023-11-26 10:00', user: 'Ava Claims', action: 'Status changed', details: 'From SUBMITTED to IN_REVIEW' },
      { timestamp: '2023-11-27 15:00', user: 'Ava Claims', action: 'Verification Failed', details: 'Damage not covered under policy terms' },
      { timestamp: '2023-11-28 11:00', user: 'Admin User', action: 'Claim rejected', details: 'Policy exclusion for this type of damage' },
    ],
  },
  {
    id: 'CL008',
    policyNumber: 'POL-007-BUSINESS',
    claimType: 'Property Damage',
    submittedDate: '2023-10-01',
    status: 'SETTLED',
    amount: 25000.00,
    policyHolder: { id: 'ph7', name: 'Business Owner', email: 'biz.owner@example.com', phone: '555-8765' },
    description: 'Damage to office property due to minor earthquake.',
    documents: [
      { id: 'doc12', name: 'Structural Engineer Report.pdf', url: '/docs/CL008_engineer.pdf', uploadedBy: 'Business Owner', uploadedDate: '2023-10-02' },
    ],
    workflowStages: [
      { stage: 'Submitted', date: '2023-10-01', completedBy: 'System', slaDue: '2023-10-03', status: 'completed' },
      { stage: 'Initial Review', date: '2023-10-02', completedBy: 'Ava Claims', slaDue: '2023-10-04', status: 'completed' },
      { stage: 'Verification', date: '2023-10-03', completedBy: 'Ava Claims', slaDue: '2023-10-05', status: 'completed' },
      { stage: 'Approval', date: '2023-10-04', completedBy: 'Admin User', slaDue: '2023-10-06', status: 'completed' },
      { stage: 'Settlement', date: '2023-10-06', completedBy: 'Finley Fox', slaDue: '2023-10-08', status: 'completed' },
    ],
    auditTrail: [
      { timestamp: '2023-10-01 10:00', user: 'System', action: 'Claim submitted', details: 'Business property damage' },
      { timestamp: '2023-10-02 11:00', user: 'Ava Claims', action: 'Status changed', details: 'From SUBMITTED to IN_REVIEW' },
      { timestamp: '2023-10-03 14:00', user: 'Ava Claims', action: 'Documents verified', details: 'Engineer report confirmed damage' },
      { timestamp: '2023-10-04 10:00', user: 'Admin User', action: 'Claim approved', details: 'Approved for 25,000.00 USD' },
      { timestamp: '2023-10-06 16:00', user: 'Finley Fox', action: 'Claim settled', details: 'Payment processed' },
    ],
  },
];

const MOCK_KPIS = [
  { id: 'kpi1', title: 'Total Claims', value: 256, trend: '+12%', isPositive: true, pulse: true },
  { id: 'kpi2', title: 'Claims Approved (MoM)', value: 180, trend: '+5%', isPositive: true, pulse: false },
  { id: 'kpi3', title: 'Average Processing Time', value: '7 Days', trend: '-1 Day', isPositive: true, pulse: true },
  { id: 'kpi4', title: 'Pending Approvals', value: 34, trend: '+3', isPositive: false, pulse: true },
];

const MOCK_NOTIFICATIONS = [
  { id: 'n1', type: 'new_claim', message: 'New claim CL009 (Car Accident) submitted by John Doe.', time: '5 mins ago', new: true },
  { id: 'n2', type: 'status_update', message: 'Claim CL001 status changed to Approved.', time: '15 mins ago', new: false },
  { id: 'n3', type: 'escalation', message: 'Claim CL002 has been escalated due to SLA breach.', time: '1 hour ago', new: true },
  { id: 'n4', type: 'document_upload', message: 'New document uploaded for claim CL004.', time: '3 hours ago', new: false },
  { id: 'n5', type: 'settlement', message: 'Claim CL003 settlement processed.', time: '1 day ago', new: false },
];

const App = () => {
  const [currentUser, setCurrentUser] = useState(null); // No user logged in by default
  const [view, setView] = useState({ screen: 'LOGIN', params: {} });
  const [claims, setClaims] = useState(MOCK_CLAIMS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: [], claimType: [] });
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Simulate real-time updates for KPIs and Notifications
  useEffect(() => {
    const kpiInterval = setInterval(() => {
      // Simulate KPI changes
      // In a real app, this would fetch fresh data
    }, 5000); // Every 5 seconds

    const notificationInterval = setInterval(() => {
      // Simulate new notification
      const newNotification = {
        id: `n${Date.now()}`,
        type: 'new_activity',
        message: `System alert: Data refreshed at ${new Date().toLocaleTimeString()}.`,
        time: 'just now',
        new: true,
      };
      setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Keep max 5 notifications
    }, 15000); // Every 15 seconds

    return () => {
      clearInterval(kpiInterval);
      clearInterval(notificationInterval);
    };
  }, []);

  const handleLogin = (role) => {
    const user = MOCK_USERS.find(u => u.role === role);
    setCurrentUser(user || MOCK_USERS[0]); // Default to Admin if role not found
    setView({ screen: 'DASHBOARD', params: {} });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView({ screen: 'LOGIN', params: {} });
  };

  const navigate = (screen, params = {}) => {
    if (!currentUser && screen !== 'LOGIN') {
      setView({ screen: 'LOGIN', params: {} });
      return;
    }
    const userRole = currentUser?.role;
    if (userRole && !userRole.canView.includes(screen) && screen !== 'CLAIM_DETAIL' && screen !== 'CLAIM_FORM') {
      alert(`Access Denied: ${currentUser?.name} (${userRole?.name}) cannot view ${screen}`);
      return;
    }
    setView({ screen, params });
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const toggleFiltersPanel = () => {
    setShowFiltersPanel(prev => !prev);
  };

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    setShowFiltersPanel(false);
  };

  const clearFilters = () => {
    setFilters({ status: [], claimType: [] });
    setShowFiltersPanel(false);
  };

  const handleClaimAction = (claimId, actionType, payload = {}) => {
    const userRole = currentUser?.role;
    let updatedClaims = claims;

    setClaims(prevClaims => {
      return prevClaims.map(claim => {
        if (claim.id === claimId) {
          const updatedClaim = { ...claim };
          const timestamp = new Date().toLocaleString();
          const user = currentUser?.name || 'System';

          // Simulate field-level security for editing DRAFT claims
          const isPolicyholderAndOwnDraft = currentUser?.role === ROLES.POLICYHOLDER && claim.policyHolder?.id === currentUser.id && claim.status === 'DRAFT';
          const canEditAnyClaim = userRole?.canEdit && currentUser?.role !== ROLES.POLICYHOLDER;

          if (actionType === 'APPROVE' && userRole?.canApprove) {
            updatedClaim.status = 'APPROVED';
            updatedClaim.auditTrail = [...(claim?.auditTrail || []), { timestamp, user, action: 'Claim approved', details: `Approved for ${claim?.amount?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}` }];
            updatedClaim.workflowStages = updatedClaim.workflowStages?.map(stage => {
              if (stage.stage === 'Approval') return { ...stage, date: timestamp.split(' ')[0], completedBy: user, status: 'completed' };
              return stage;
            });
            alert(`Claim ${claimId} approved!`);
          } else if (actionType === 'REJECT' && userRole?.canReject) {
            updatedClaim.status = 'REJECTED';
            updatedClaim.auditTrail = [...(claim?.auditTrail || []), { timestamp, user, action: 'Claim rejected', details: `Rejected by ${user}` }];
            updatedClaim.workflowStages = updatedClaim.workflowStages?.map(stage => {
              if (stage.status === 'upcoming' || stage.status === 'active') return { ...stage, status: 'rejected' };
              return stage;
            });
            alert(`Claim ${claimId} rejected.`);
          } else if (actionType === 'EDIT' && (canEditAnyClaim || isPolicyholderAndOwnDraft)) {
            // This is just a navigation to the form, the form handles the actual update
            navigate('CLAIM_FORM', { claimId: claimId });
            return claim; // No direct update here, form handles it.
          } else if (actionType === 'SAVE_FORM') {
            const { updatedData } = payload;
            Object.assign(updatedClaim, updatedData);
            updatedClaim.auditTrail = [...(claim?.auditTrail || []), { timestamp, user, action: 'Claim updated', details: `Claim details updated by ${user}.` }];
            alert(`Claim ${claimId} updated successfully.`);
          } else {
            if (actionType !== 'EDIT' && actionType !== 'SAVE_FORM') {
              alert(`Access Denied: ${userRole?.name} cannot perform ${actionType} on this claim.`);
            }
          }
          return updatedClaim;
        }
        return claim;
      });
    });
  };

  const getBreadcrumbs = () => {
    const crumbs = [{ label: 'Dashboard', screen: 'DASHBOARD' }];
    if (view.screen === 'CLAIM_DETAIL') {
      crumbs.push({ label: `Claim ${view.params?.claimId}`, screen: 'CLAIM_DETAIL', params: { claimId: view.params?.claimId } });
    } else if (view.screen === 'CLAIM_FORM') {
      const formTitle = view.params?.claimId ? `Edit Claim ${view.params.claimId}` : 'New Claim';
      crumbs.push({ label: formTitle, screen: 'CLAIM_FORM', params: view.params });
    }
    return crumbs;
  };

  const getFilteredClaims = () => {
    let filtered = claims;

    if (currentUser?.role === ROLES.POLICYHOLDER) {
      filtered = filtered.filter(claim => claim?.policyHolder?.email === currentUser?.username);
    }

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(claim =>
        (claim?.id && claim.id.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (claim?.policyNumber && claim.policyNumber.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (claim?.policyHolder?.name && claim.policyHolder.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (claim?.claimType && claim.claimType.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    if (filters.status?.length > 0) {
      filtered = filtered.filter(claim => filters.status.includes(claim?.status));
    }

    if (filters.claimType?.length > 0) {
      filtered = filtered.filter(claim => filters.claimType.includes(claim?.claimType));
    }

    return filtered;
  };

  const renderDashboard = () => {
    const filteredClaims = getFilteredClaims();
    const uniqueClaimTypes = [...new Set(claims.map(c => c?.claimType))];
    const canCreateClaim = currentUser?.role === ROLES.ADMIN || currentUser?.role === ROLES.CLAIMS_OFFICER || currentUser?.role === ROLES.POLICYHOLDER;

    return (
      <div className="screen-container">
        <h2>Dashboard</h2>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <button className="primary" onClick={() => canCreateClaim && navigate('CLAIM_FORM')}>
              Create New Claim
            </button>
            <button className="outline" onClick={toggleFiltersPanel} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
              <span className="icon icon-filter"></span> Filters
            </button>
          </div>
        </div>

        <div className="dashboard-grid">
          {MOCK_KPIS.map(kpi => (
            <div key={kpi?.id} className={`dashboard-kpi-card ${kpi?.pulse ? 'pulse' : ''}`} style={{ borderLeftColor: kpi?.isPositive ? 'var(--color-success)' : 'var(--color-danger)' }}>
              <div className="kpi-title">{kpi?.title}</div>
              <div className="kpi-value">{kpi?.value}</div>
              <div className={`kpi-trend ${kpi?.isPositive ? '' : 'negative'}`}>{kpi?.trend}</div>
              {/* Placeholder for real-time chart, e.g., a mini line/bar chart */}
              <div style={{ height: '50px', backgroundColor: 'var(--color-neutral-light)', borderRadius: 'var(--border-radius-sm)', marginTop: 'var(--spacing-sm)' }}>
                {/* Chart placeholder */}
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-main-section">
          <div>
            <h3>Claims Overview</h3>
            <div className="card-grid">
              {(filteredClaims.length > 0) ? (
                filteredClaims.map(claim => (
                  <div
                    key={claim?.id}
                    className={`card status-${STATUS_MAPPING[claim?.status]?.className}`}
                    onClick={() => navigate('CLAIM_DETAIL', { claimId: claim?.id })}
                  >
                    <div className="card-title">{claim?.claimType} - {claim?.id}</div>
                    <div className="card-meta">
                      Policy: {claim?.policyNumber} | Policyholder: {claim?.policyHolder?.name}
                    </div>
                    <div className={`card-status ${STATUS_MAPPING[claim?.status]?.className}`} style={{ backgroundColor: `var(${STATUS_MAPPING[claim?.status]?.colorVar})` }}>
                      {STATUS_MAPPING[claim?.status]?.label}
                    </div>
                    <div className="card-actions">
                      {currentUser?.role?.canEdit && claim?.status !== 'REJECTED' && claim?.status !== 'SETTLED' && (
                        <button onClick={(e) => { e.stopPropagation(); handleClaimAction(claim?.id, 'EDIT'); }} aria-label="Edit Claim">
                          <span className="icon icon-edit"></span>
                        </button>
                      )}
                      {(currentUser?.role?.canApprove && claim?.status === 'PENDING') && (
                        <button onClick={(e) => { e.stopPropagation(); handleClaimAction(claim?.id, 'APPROVE'); }} aria-label="Approve Claim">
                          <span className="icon icon-approve"></span>
                        </button>
                      )}
                      {(currentUser?.role?.canReject && (claim?.status === 'PENDING' || claim?.status === 'IN_REVIEW')) && (
                        <button onClick={(e) => { e.stopPropagation(); handleClaimAction(claim?.id, 'REJECT'); }} aria-label="Reject Claim">
                          <span className="icon icon-reject"></span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--spacing-xl)', backgroundColor: 'white', borderRadius: 'var(--border-radius-md)' }}>
                  <h3>No Claims Found</h3>
                  <p>Adjust your filters or search term.</p>
                </div>
              )}
            </div>
          </div>
          <div className="recent-activities-panel">
            <h3>Recent Activities</h3>
            <ul className="activity-list">
              {notifications.map(notification => (
                <li key={notification?.id} className={`activity-item ${notification?.new ? 'notification-pulse' : ''}`}>
                  <div className="activity-icon">🔔</div> {/* Placeholder icon */}
                  <div className="activity-content">
                    <p>{notification?.message}</p>
                    <span className="activity-time">{notification?.time}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {showFiltersPanel && (
          <>
            <div className="backdrop open" onClick={toggleFiltersPanel}></div>
            <div className="filter-panel open">
              <div className="filter-panel-header">
                <h3>Filters</h3>
                <button className="outline" onClick={toggleFiltersPanel}>
                  <span className="icon icon-close"></span>
                </button>
              </div>
              <div className="filter-panel-content">
                <div className="filter-group">
                  <label className="filter-label">Status</label>
                  <div className="filter-options">
                    {CLAIM_STATUSES.map(status => (
                      <span
                        key={status}
                        className={`filter-option ${filters.status?.includes(status) ? 'active' : ''}`}
                        onClick={() => {
                          setFilters(prev => {
                            const newStatus = prev.status?.includes(status)
                              ? prev.status?.filter(s => s !== status)
                              : [...(prev.status || []), status];
                            return { ...prev, status: newStatus };
                          });
                        }}
                      >
                        {STATUS_MAPPING[status]?.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="filter-group">
                  <label className="filter-label">Claim Type</label>
                  <div className="filter-options">
                    {uniqueClaimTypes.map(type => (
                      <span
                        key={type}
                        className={`filter-option ${filters.claimType?.includes(type) ? 'active' : ''}`}
                        onClick={() => {
                          setFilters(prev => {
                            const newClaimType = prev.claimType?.includes(type)
                              ? prev.claimType?.filter(ct => ct !== type)
                              : [...(prev.claimType || []), type];
                            return { ...prev, claimType: newClaimType };
                          });
                        }}
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Add more filters here as needed */}
              </div>
              <div className="filter-panel-actions">
                <button className="secondary" onClick={clearFilters}>Clear All</button>
                <button className="primary" onClick={() => applyFilters(filters)}>Apply Filters</button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderClaimDetail = () => {
    const claim = claims.find(c => c?.id === view.params?.claimId);
    if (!claim) {
      return (
        <div className="screen-container detail-view">
          <h2>Claim Not Found</h2>
          <p>The claim with ID "{view.params?.claimId}" could not be found.</p>
          <button className="primary" onClick={() => navigate('DASHBOARD')}>Back to Dashboard</button>
        </div>
      );
    }

    const userRole = currentUser?.role;
    const canEdit = userRole?.canEdit && claim?.status !== 'REJECTED' && claim?.status !== 'SETTLED';
    const canApprove = userRole?.canApprove && claim?.status === 'PENDING';
    const canReject = userRole?.canReject && (claim?.status === 'PENDING' || claim?.status === 'IN_REVIEW');
    const canViewAuditLogs = userRole?.canAccessAuditLogs;

    return (
      <div className="screen-container">
        <div className="detail-view">
          <div className="detail-header">
            <h2>Claim Details: {claim?.id}</h2>
            <div className="flex gap-md">
              <button className="outline" onClick={() => navigate('DASHBOARD')}>
                <span className="icon icon-back"></span> Back
              </button>
              {canEdit && (
                <button className="primary" onClick={() => handleClaimAction(claim?.id, 'EDIT')}>
                  <span className="icon icon-edit"></span> Edit
                </button>
              )}
              {canApprove && (
                <button className="primary" onClick={() => handleClaimAction(claim?.id, 'APPROVE')}>
                  <span className="icon icon-approve"></span> Approve
                </button>
              )}
              {canReject && (
                <button className="danger" onClick={() => handleClaimAction(claim?.id, 'REJECT')}>
                  <span className="icon icon-reject"></span> Reject
                </button>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral)', marginBottom: 'var(--spacing-xs)' }}>Current Status</label>
            <div className={`card-status ${STATUS_MAPPING[claim?.status]?.className}`} style={{ backgroundColor: `var(${STATUS_MAPPING[claim?.status]?.colorVar})` }}>
              {STATUS_MAPPING[claim?.status]?.label}
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-item">
              <label>Policy Number</label>
              <span>{claim?.policyNumber}</span>
            </div>
            <div className="detail-item">
              <label>Claim Type</label>
              <span>{claim?.claimType}</span>
            </div>
            <div className="detail-item">
              <label>Submitted Date</label>
              <span>{claim?.submittedDate}</span>
            </div>
            <div className="detail-item">
              <label>Amount</label>
              <span>{claim?.amount?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
            </div>
            <div className="detail-item">
              <label>Policy Holder</label>
              <span>{claim?.policyHolder?.name}</span>
            </div>
            <div className="detail-item">
              <label>Policy Holder Email</label>
              <span>{claim?.policyHolder?.email}</span>
            </div>
            <div className="detail-item" style={{ gridColumn: 'span 2' }}>
              <label>Description</label>
              <span>{claim?.description}</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>Workflow Progress</h3>
            <div className="workflow-tracker">
              {claim?.workflowStages?.map((stage, index) => (
                <div key={index} className={`workflow-stage ${stage.status}`}>
                  <div className="workflow-stage-dot"></div>
                  <span className="workflow-stage-label">{stage.stage}</span>
                  {stage.date && <span className="workflow-stage-sla">({stage.date})</span>}
                  {stage.slaDue && <span className={`workflow-stage-sla ${stage.slaBreached ? 'breached' : ''}`}>SLA: {stage.slaDue}</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="detail-section">
            <h3>Documents</h3>
            {(claim?.documents?.length > 0) ? (
              <ul className="documents-list">
                {claim.documents.map(doc => (
                  <li key={doc?.id}>
                    <a href={doc?.url} target="_blank" rel="noopener noreferrer">
                      <span className="icon icon-documents" style={{ marginRight: 'var(--spacing-xs)' }}></span>
                      {doc?.name}
                    </a>
                    <span>Uploaded by {doc?.uploadedBy} on {doc?.uploadedDate}</span>
                    <button className="secondary" style={{ padding: 'var(--spacing-xs) var(--spacing-sm)' }}>
                      <span className="icon icon-download"></span> Download
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No documents attached.</p>
            )}
          </div>

          {canViewAuditLogs && (
            <div className="detail-section">
              <h3>Audit Log</h3>
              {(claim?.auditTrail?.length > 0) ? (
                <ul className="audit-list">
                  {claim.auditTrail.map((log, index) => (
                    <li key={index}>
                      <div className="flex flex-col">
                        <span className="font-bold">{log?.action}</span>
                        <span className="text-sm text-secondary">{log?.details}</span>
                      </div>
                      <div className="text-sm text-secondary">
                        <span>{log?.user}</span>
                        <span style={{ marginLeft: 'var(--spacing-sm)' }}>{log?.timestamp}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No audit trail available for this claim.</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderClaimForm = () => {
    const isEdit = !!view.params?.claimId;
    const claimToEdit = isEdit ? claims.find(c => c?.id === view.params?.claimId) : null;

    const [formData, setFormData] = useState(claimToEdit || {
      policyNumber: '',
      claimType: '',
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'DRAFT',
      amount: '',
      policyHolder: { name: '', email: '', phone: '' },
      description: '',
      documents: [],
      workflowStages: MOCK_CLAIMS[0]?.workflowStages?.map(s => ({ ...s, date: null, completedBy: null, status: s.stage === 'Submitted' ? 'active' : 'upcoming' })) || [],
      auditTrail: [],
    });

    const [formErrors, setFormErrors] = useState({});

    const handleChange = (e) => {
      const { name, value } = e.target;
      if (name.startsWith('policyHolder.')) {
        const field = name.split('.')[1];
        setFormData(prev => ({
          ...prev,
          policyHolder: { ...prev.policyHolder, [field]: value }
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    };

    const handleFileChange = (e) => {
      const files = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        documents: [...(prev.documents || []), ...files.map(file => ({
          id: `${Date.now()}-${file.name}`,
          name: file.name,
          url: URL.createObjectURL(file), // Dummy URL
          uploadedBy: currentUser?.name || 'Policyholder',
          uploadedDate: new Date().toISOString().split('T')[0],
        }))],
      }));
    };

    const validateForm = () => {
      const errors = {};
      if (!formData.policyNumber) errors.policyNumber = 'Policy Number is required.';
      if (!formData.claimType) errors.claimType = 'Claim Type is required.';
      if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) errors.amount = 'Valid Amount is required.';
      if (!formData.policyHolder?.name) errors.policyHolderName = 'Policy Holder Name is required.';
      if (!formData.policyHolder?.email) errors.policyHolderEmail = 'Policy Holder Email is required.';
      else if (!/\S+@\S+\.\S+/.test(formData.policyHolder.email)) errors.policyHolderEmail = 'Email is invalid.';
      if (!formData.description) errors.description = 'Description is required.';
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!validateForm()) {
        alert('Please correct the errors in the form.');
        return;
      }

      if (isEdit) {
        handleClaimAction(claimToEdit?.id, 'SAVE_FORM', { updatedData: formData });
      } else {
        const newClaim = {
          ...formData,
          id: `CL${String(claims.length + 1).padStart(3, '0')}`,
          status: 'SUBMITTED', // New claims are submitted
          submittedDate: new Date().toISOString().split('T')[0],
          auditTrail: [{ timestamp: new Date().toLocaleString(), user: currentUser?.name || 'System', action: 'Claim created and submitted', details: 'New claim filed.' }],
          workflowStages: formData.workflowStages?.map(stage => (stage.stage === 'Submitted' ? { ...stage, status: 'completed', date: new Date().toISOString().split('T')[0], completedBy: currentUser?.name || 'System' } : stage)),
        };
        setClaims(prev => [...prev, newClaim]);
        alert('New claim submitted successfully!');
      }
      navigate('DASHBOARD');
    };

    const canSubmit = currentUser?.role === ROLES.ADMIN || currentUser?.role === ROLES.CLAIMS_OFFICER || (currentUser?.role === ROLES.POLICYHOLDER && !isEdit); // Policyholder can only submit new claims, not edit others or re-submit their own
    const canSaveDraft = currentUser?.role === ROLES.ADMIN || currentUser?.role === ROLES.CLAIMS_OFFICER || (currentUser?.role === ROLES.POLICYHOLDER && (formData.status === 'DRAFT' || !isEdit));

    return (
      <div className="screen-container">
        <div className="detail-view">
          <div className="detail-header">
            <h2>{isEdit ? `Edit Claim: ${claimToEdit?.id}` : 'New Claim Submission'}</h2>
            <button className="outline" onClick={() => navigate('DASHBOARD')}>
              <span className="icon icon-back"></span> Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="detail-grid">
              <div className="form-group">
                <label htmlFor="policyNumber">Policy Number <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input
                  type="text"
                  id="policyNumber"
                  name="policyNumber"
                  value={formData.policyNumber || ''}
                  onChange={handleChange}
                  required
                />
                {formErrors.policyNumber && <span className="error-message">{formErrors.policyNumber}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="claimType">Claim Type <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input
                  type="text"
                  id="claimType"
                  name="claimType"
                  value={formData.claimType || ''}
                  onChange={handleChange}
                  required
                />
                {formErrors.claimType && <span className="error-message">{formErrors.claimType}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="amount">Claim Amount ($) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount || ''}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                />
                {formErrors.amount && <span className="error-message">{formErrors.amount}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="submittedDate">Submitted Date</label>
                <input
                  type="date"
                  id="submittedDate"
                  name="submittedDate"
                  value={formData.submittedDate || ''}
                  onChange={handleChange}
                  readOnly={isEdit}
                  style={{ backgroundColor: isEdit ? 'var(--color-neutral-light)' : 'white' }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="policyHolderName">Policy Holder Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input
                  type="text"
                  id="policyHolderName"
                  name="policyHolder.name"
                  value={formData.policyHolder?.name || ''}
                  onChange={handleChange}
                  required
                />
                {formErrors.policyHolderName && <span className="error-message">{formErrors.policyHolderName}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="policyHolderEmail">Policy Holder Email <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input
                  type="email"
                  id="policyHolderEmail"
                  name="policyHolder.email"
                  value={formData.policyHolder?.email || ''}
                  onChange={handleChange}
                  required
                />
                {formErrors.policyHolderEmail && <span className="error-message">{formErrors.policyHolderEmail}</span>}
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label htmlFor="description">Description <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows="4"
                  required
                ></textarea>
                {formErrors.description && <span className="error-message">{formErrors.description}</span>}
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label htmlFor="documents">Upload Supporting Documents</label>
                <input
                  type="file"
                  id="documents"
                  name="documents"
                  multiple
                  onChange={handleFileChange}
                />
                {(formData.documents?.length > 0) && (
                  <div style={{ marginTop: 'var(--spacing-sm)' }}>
                    <h4>Uploaded Files:</h4>
                    <ul>
                      {formData.documents.map(doc => (
                        <li key={doc?.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                          <span className="icon icon-documents"></span> {doc?.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
              <button type="button" className="secondary" onClick={() => navigate('DASHBOARD')}>Cancel</button>
              {((canSubmit && !isEdit) || (canSaveDraft && isEdit && formData.status === 'DRAFT' && currentUser?.role === ROLES.POLICYHOLDER)) && (
                <button type="submit" className="primary">
                  {isEdit ? 'Save Draft' : 'Submit Claim'}
                </button>
              )}
              {(isEdit && currentUser?.role?.canEdit && formData.status !== 'DRAFT') && (
                <button type="submit" className="primary">
                  Save Changes
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderLogin = () => {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ backgroundColor: 'white', padding: 'var(--spacing-xxl)', borderRadius: 'var(--border-radius-lg)', boxShadow: 'var(--box-shadow-lg)', textAlign: 'center', maxWidth: '400px', width: '90%' }}>
          <h1 style={{ color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-xl)' }}>Insurance Platform Login</h1>
          <p style={{ marginBottom: 'var(--spacing-lg)' }}>Select your role to log in:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {Object.values(ROLES).map(role => (
              <button key={role?.name} className="primary" onClick={() => handleLogin(role)}>
                Log in as {role?.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const currentScreen = () => {
    if (!currentUser) {
      return renderLogin();
    }
    const { screen } = view;
    switch (screen) {
      case 'DASHBOARD':
        return renderDashboard();
      case 'CLAIM_DETAIL':
        return renderClaimDetail();
      case 'CLAIM_FORM':
        return renderClaimForm();
      case 'LOGIN': // Should not reach here if currentUser is set, but as a fallback
      default:
        return renderLogin();
    }
  };

  return (
    <div className="app-container">
      {currentUser && (
        <header className="header">
          <div className="logo">ClaimFlow</div>
          <div className="breadcrumb">
            {getBreadcrumbs().map((crumb, index) => (
              <React.Fragment key={crumb?.screen}>
                <a onClick={() => navigate(crumb?.screen, crumb?.params)}>{crumb?.label}</a>
                {index < getBreadcrumbs().length - 1 && <span className="icon icon-arrow-right"></span>}
              </React.Fragment>
            ))}
          </div>
          <div className="search-input-container">
            <span className="icon icon-search search-icon"></span>
            <input
              type="text"
              className="search-input"
              placeholder="Global Search (e.g., policy, claim ID)"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {/* Smart suggestions could go here, triggered by searchTerm */}
            {searchTerm && (
              <div className="search-suggestions">
                {getFilteredClaims().slice(0, 3).map(claim => (
                  <div key={claim?.id} className="search-suggestion-item" onClick={() => { navigate('CLAIM_DETAIL', { claimId: claim?.id }); setSearchTerm(''); }}>
                    <strong>{claim?.id}</strong> - {claim?.claimType} ({claim?.policyHolder?.name})
                  </div>
                ))}
                {getFilteredClaims().length === 0 && (
                  <div className="search-suggestion-item" style={{ cursor: 'default' }}>No suggestions found.</div>
                )}
              </div>
            )}
          </div>
          <div className="user-controls">
            <span className="user-info">Hello, {currentUser?.name} ({currentUser?.role?.name})</span>
            <button className="secondary" onClick={handleLogout}>
              <span className="icon icon-logout"></span> Logout
            </button>
          </div>
        </header>
      )}
      <main className="main-content">
        {currentScreen()}
      </main>
    </div>
  );
};

export default App;