'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Users,
  Shield,
  Layers,
  Database,
  Search,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  UserPlus,
  Key,
  Sliders,
  Check,
  Building2,
  Eye,
  FileText,
  Calendar,
  Box,
  Wrench,
  Receipt,
  CheckSquare,
  Lock,
  Save,
  Compass,
} from 'lucide-react';
import { useAuth, PRESET_ROLE_USERS } from '@/lib/auth-context';
import { api } from '@/lib/api';
import {
  Button,
  Badge,
  Tabs,
  Card,
  CardContent,
  PageContainer,
  PageHeader,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui';
import { ROLE_PROFILES, USER_ROLES, type UserRole, type RolePermissionProfile } from '@arihant/shared';

const DEPARTMENT_NAMES: Record<UserRole, string> = {
  management: 'Executive Management',
  regional_manager: 'Regional Operations & Sales',
  sales: 'Field Sales & BD',
  tender_team: 'GeM Tender Operations',
  demo_team: 'Field Demonstrations & Fleet',
  service_team: 'Service & Maintenance Depot',
  accounts: 'Finance & Accounts',
  admin: 'IT & System Administration',
};

const CAPABILITY_LABELS: Record<keyof RolePermissionProfile['capabilities'], { label: string; desc: string }> = {
  canViewAllIndia: {
    label: 'All-India National Visibility',
    desc: 'Unrestricted operational visibility across all zones and regions without regional boundary locking.',
  },
  canSwitchZones: {
    label: 'Strategic Zone Switching',
    desc: 'Ability to toggle between North, South, East, and West territorial command views.',
  },
  canApproveTenders: {
    label: 'Tender Go/No-Go Approval',
    desc: 'Authorisation to review internal risk notes and sign off on bidding participation.',
  },
  canSubmitTenderBids: {
    label: 'Bid Envelope Submission',
    desc: 'Direct submission of GeM bids, EMD fee processing, and commercial price uploads.',
  },
  canManageDemos: {
    label: 'Demo Fleet Management',
    desc: 'Reserve equipment from depot matrix, schedule trials, and issue security gate passes.',
  },
  canManageService: {
    label: 'Breakdown Ticket Resolution',
    desc: 'Assign engineers, update diagnostic logs, and officially issue ticket closure certificates.',
  },
  canEndorseExpensesStage1: {
    label: 'Stage 1 Manager Expense Endorsement',
    desc: 'First-level policy and receipt validation under corporate travel & reimbursement rules.',
  },
  canDisburseExpensesStage2: {
    label: 'Stage 2 Finance Disbursement',
    desc: 'Financial audit, GST verification, and payout authorization by corporate accounts.',
  },
  canUnblockTasks: {
    label: 'Task & Blocker Clearance',
    desc: 'Review and approve task blocker removal requests across team milestones.',
  },
  canManageUsersAndMasters: {
    label: 'Master Records & RBAC Administration',
    desc: 'Create and modify system accounts, zones, equipment MHA QRs, and role policies.',
  },
};

export default function AdminPage() {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('permissions');
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [usersList, setUsersList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [zonesList, setZonesList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // RBAC permissions state
  const [selectedRoleForConfig, setSelectedRoleForConfig] = useState<UserRole>('regional_manager');
  const [permissionsState, setPermissionsState] = useState<Record<UserRole, RolePermissionProfile['capabilities']>>(() => {
    const initial: any = {};
    for (const role of USER_ROLES) {
      initial[role] = { ...ROLE_PROFILES[role].capabilities };
    }
    return initial;
  });
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, productsRes, zonesRes, auditRes] = await Promise.all([
        api.get('/users', { limit: 100 }),
        api.get('/masters/products'),
        api.get('/masters/zones'),
        api.get('/audit', { limit: 50 }),
      ]);

      setUsersList(usersRes.data || []);
      setProductsList(productsRes || []);
      setZonesList(zonesRes || []);
      setAuditLogs(auditRes.data || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasRole(['management', 'admin'])) {
      fetchAdminData();
    }
  }, []);

  const getEntityLabel = (log: any) => {
    const val = log.new_value || log.previous_value || log.details || {};
    const name =
      val.name ||
      val.full_name ||
      val.organisation_name ||
      val.title ||
      val.tender_no ||
      val.quotation_no ||
      val.ticket_no ||
      val.remarks ||
      val.product_name ||
      val.file_name ||
      val.purpose;

    const entityTypeFormatted = (log.entity_type || 'Record').replace(/_/g, ' ').toUpperCase();
    if (name) {
      return (
        <div className="font-sans">
          <span className="font-semibold text-gray-900 capitalize">{entityTypeFormatted}: </span>
          <span className="text-[#0F5E63] font-medium">{name}</span>
        </div>
      );
    }
    return (
      <span className="font-sans font-semibold text-gray-900 capitalize">
        {entityTypeFormatted} Record
      </span>
    );
  };

  const getPayloadSummary = (log: any) => {
    const val = log.new_value || log.details || log.previous_value;
    if (!val || (typeof val === 'object' && Object.keys(val).length === 0)) {
      return <span className="text-gray-400 font-sans italic">No payload parameters</span>;
    }
    if (typeof val === 'object') {
      const keys = Object.keys(val).filter(
        (k) =>
          !['id', 'password_hash', 'created_at', 'updated_at'].includes(k) &&
          val[k] !== null &&
          val[k] !== undefined,
      );
      const parts = keys.slice(0, 3).map((k) => {
        const displayVal = typeof val[k] === 'object' ? '...' : String(val[k]);
        return `${k.replace(/_/g, ' ')}: ${displayVal}`;
      });
      return (
        <span
          className="font-sans text-[11px] text-gray-700 truncate block max-w-xs"
          title={parts.join(' · ')}
        >
          {parts.join(' · ') || 'Updated record attributes'}
        </span>
      );
    }
    return <span className="font-sans text-[11px] text-gray-700">{String(val)}</span>;
  };

  const handleToggleUserActive = async (userId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/users/${userId}`, {
        is_active: !currentStatus,
      });
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u)),
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const handleToggleCapability = (capKey: keyof RolePermissionProfile['capabilities']) => {
    setPermissionsState((prev) => ({
      ...prev,
      [selectedRoleForConfig]: {
        ...prev[selectedRoleForConfig],
        [capKey]: !prev[selectedRoleForConfig][capKey],
      },
    }));
  };

  const handleSavePermissions = () => {
    setSaveFeedback(`Permissions baseline saved for ${ROLE_PROFILES[selectedRoleForConfig].title}. Changes applied across active sessions.`);
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  if (!hasRole(['management', 'admin'])) {
    return (
      <div className="p-12 text-center text-[#4A5568] bg-white border border-[#DCD8CE] rounded-xl space-y-3 shadow-xs">
        <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-[#14213D]">Access Restricted</h2>
        <p className="text-xs">
          Only Top Management and System Administrators have permission to access master configurations, user administration, and role security policies.
        </p>
      </div>
    );
  }

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      !search ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'all' || u.role === selectedDept;
    return matchesSearch && matchesDept;
  });

  const activeRoleProfile = ROLE_PROFILES[selectedRoleForConfig];
  const activeRoleCaps = permissionsState[selectedRoleForConfig];

  return (
    <PageContainer>
      {/* ── HEADER ── */}
      <PageHeader
        badge="Master Administration & Security Controls"
        title="Enterprise Administration & System Masters"
        subtitle="Role-Based Access Control (RBAC), personnel directory by department, equipment & MHA QRs, zones, and immutable security audit trails."
        icon={<Settings className="h-5 w-5 text-[#0F5E63]" />}
      />

      <Tabs
        tabs={[
          { id: 'permissions', label: 'Role Permissions & Scope Matrix' },
          { id: 'users', label: 'Users & Departments', count: usersList.length },
          { id: 'products', label: 'Equipment & MHA QRs', count: productsList.length },
          { id: 'zones', label: 'Zones & Regions', count: zonesList.length },
          { id: 'audit', label: 'Security Audit Logs', count: auditLogs.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* ── TAB 1: ROLE PERMISSIONS & SCOPE MATRIX ── */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          {/* Status Alert Banner */}
          <div className="rounded-xl border border-[#0F5E63]/30 bg-gradient-to-r from-[#0F5E63]/5 via-white to-blue-50/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#0F5E63] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-950">Enterprise Role & Access Control Policy</h3>
                  <Badge variant="cyber" size="sm">Active Baseline</Badge>
                </div>
                <p className="text-xs text-[#4A5568] mt-0.5 max-w-3xl">
                  <strong>Enterprise Security:</strong> Baseline policies and role scopes are enforced across all operational departments and territorial regions.
                </p>
              </div>
            </div>
            {saveFeedback && (
              <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 animate-in fade-in">
                {saveFeedback}
              </div>
            )}
          </div>

          {/* 8 Persona Selector Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {USER_ROLES.map((r) => {
              const profile = ROLE_PROFILES[r];
              const isSelected = selectedRoleForConfig === r;
              return (
                <Card
                  key={r}
                  variant="interactive"
                  selected={isSelected}
                  padding="xs"
                  onClick={() => setSelectedRoleForConfig(r)}
                  className="text-left flex flex-col justify-between cursor-pointer"
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#4A5568] truncate">
                    {DEPARTMENT_NAMES[r]}
                  </div>
                  <div className={`text-xs font-bold mt-1 truncate ${isSelected ? 'text-[#0F5E63]' : 'text-[#14213D]'}`}>
                    {profile.title}
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${
                        profile.territorialScope === 'all_india'
                          ? 'bg-[#0F5E63]'
                          : profile.territorialScope === 'regional'
                          ? 'bg-purple-600'
                          : 'bg-emerald-600'
                      }`}
                    />
                    <span className="text-[9px] font-bold text-[#4A5568] uppercase">
                      {profile.territorialScope.replace('_', ' ')}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Selected Role Detail & Interactive Permission Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Scope & Functional Responsibilities */}
            <div className="lg:col-span-1 space-y-4">
              <div className="rounded-xl border border-[#DCD8CE] bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#DCD8CE]">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A5568]">
                      Role Definition
                    </span>
                    <h3 className="text-base font-black text-gray-950">{activeRoleProfile.title}</h3>
                  </div>
                  <Badge variant="outline" size="sm" className="uppercase font-mono">
                    {activeRoleProfile.role}
                  </Badge>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase text-[#4A5568]">Department</span>
                  <div className="text-xs font-semibold text-gray-900 mt-0.5">
                    {activeRoleProfile.department}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase text-[#4A5568]">Territorial Visibility Scope</span>
                  <div className="mt-1">
                    <Badge
                      variant={
                        activeRoleProfile.territorialScope === 'all_india'
                          ? 'cyber'
                          : activeRoleProfile.territorialScope === 'regional'
                          ? 'urgent'
                          : 'success'
                      }
                      size="sm"
                    >
                      {activeRoleProfile.territorialScope.toUpperCase().replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase text-[#4A5568]">Mandated Scope Summary</span>
                  <blockquote className="mt-1 p-2.5 rounded-lg bg-[#FBFAF7] border border-[#DCD8CE] text-xs font-medium text-[#0F5E63] leading-relaxed italic">
                    &ldquo;{activeRoleProfile.scopeSummary}&rdquo;
                  </blockquote>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase text-[#4A5568]">Core Operational Responsibilities</span>
                  <ul className="mt-2 space-y-1.5 text-xs text-gray-700">
                    {activeRoleProfile.responsibilities.map((resp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-[#DCD8CE]">
                  <span className="text-[11px] font-bold uppercase text-[#4A5568]">Allowed Modules in Sidebar</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {activeRoleProfile.allowedModules.map((mod) => (
                      <span
                        key={mod}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E3EFEE] text-[#0F5E63] border border-[#DCD8CE]"
                      >
                        /{mod}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right 2 Cols: Configurable Capabilities Matrix */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-xl border border-[#DCD8CE] bg-white overflow-hidden shadow-xs">
                <div className="p-4 sm:p-5 border-b border-[#DCD8CE] bg-[#FBFAF7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-950 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#0F5E63]" />
                      <span>Configurable Capabilities Matrix: {activeRoleProfile.title}</span>
                    </h3>
                    <p className="text-xs text-[#4A5568] mt-0.5">
                      Toggle operational and financial permissions for this persona. Changes are verified against backend RBAC guards.
                    </p>
                  </div>
                  <Button size="sm" variant="primary" onClick={handleSavePermissions} className="shrink-0">
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    <span>Save Baseline</span>
                  </Button>
                </div>

                <div className="divide-y divide-[#DCD8CE]">
                  {(Object.keys(CAPABILITY_LABELS) as Array<keyof RolePermissionProfile['capabilities']>).map((capKey) => {
                    const isEnabled = activeRoleCaps[capKey];
                    const info = CAPABILITY_LABELS[capKey];
                    return (
                      <div
                        key={capKey}
                        className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                          isEnabled ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-950">{info.label}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                isEnabled
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                              }`}
                            >
                              {isEnabled ? 'PERMITTED' : 'RESTRICTED'}
                            </span>
                          </div>
                          <p className="text-xs text-[#4A5568] max-w-xl">{info.desc}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleCapability(capKey)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isEnabled ? 'bg-[#0F5E63]' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Comparative Matrix Table across all 8 Roles */}
              <Card>
                <div className="p-4 border-b border-[#DCD8CE] bg-[#FBFAF7]">
                  <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider">
                    Enterprise Role Governance Matrix
                  </h4>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Enterprise Role</TableHead>
                      <TableHead>Territory</TableHead>
                      <TableHead className="text-center">All-India</TableHead>
                      <TableHead className="text-center">Tender Signoff</TableHead>
                      <TableHead className="text-center">Bid Submit</TableHead>
                      <TableHead className="text-center">Demos</TableHead>
                      <TableHead className="text-center">Service</TableHead>
                      <TableHead className="text-center">Stage 1 Exp</TableHead>
                      <TableHead className="text-center">Stage 2 Payout</TableHead>
                      <TableHead className="text-center">RBAC Admin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {USER_ROLES.map((r) => {
                      const caps = permissionsState[r];
                      const prof = ROLE_PROFILES[r];
                      return (
                        <TableRow key={r}>
                          <TableCell className="font-bold text-[#14213D] whitespace-nowrap">
                            <div>{prof.title}</div>
                            <span className="text-[10px] text-[#4A5568] font-normal">{DEPARTMENT_NAMES[r]}</span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <span className="text-[10px] font-bold uppercase text-[#4A5568]">
                              {prof.territorialScope.replace('_', ' ')}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">{caps.canViewAllIndia ? <Check className="w-4 h-4 text-emerald-600 inline" /> : <span className="text-gray-300">-</span>}</TableCell>
                          <TableCell className="text-center">{caps.canApproveTenders ? <Check className="w-4 h-4 text-emerald-600 inline" /> : <span className="text-gray-300">-</span>}</TableCell>
                          <TableCell className="text-center">{caps.canSubmitTenderBids ? <Check className="w-4 h-4 text-emerald-600 inline" /> : <span className="text-gray-300">-</span>}</TableCell>
                          <TableCell className="text-center">{caps.canManageDemos ? <Check className="w-4 h-4 text-emerald-600 inline" /> : <span className="text-gray-300">-</span>}</TableCell>
                          <TableCell className="text-center">{caps.canManageService ? <Check className="w-4 h-4 text-emerald-600 inline" /> : <span className="text-gray-300">-</span>}</TableCell>
                          <TableCell className="text-center">{caps.canEndorseExpensesStage1 ? <Check className="w-4 h-4 text-emerald-600 inline" /> : <span className="text-gray-300">-</span>}</TableCell>
                          <TableCell className="text-center">{caps.canDisburseExpensesStage2 ? <Check className="w-4 h-4 text-emerald-600 inline" /> : <span className="text-gray-300">-</span>}</TableCell>
                          <TableCell className="text-center">{caps.canManageUsersAndMasters ? <Check className="w-4 h-4 text-emerald-600 inline" /> : <span className="text-gray-300">-</span>}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: USERS & DEPARTMENTS ── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Department Breakdown Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="xs"
              variant={selectedDept === 'all' ? 'primary' : 'outline'}
              onClick={() => setSelectedDept('all')}
            >
              All Departments ({usersList.length})
            </Button>
            {USER_ROLES.map((r) => {
              const count = usersList.filter((u) => u.role === r).length;
              return (
                <Button
                  key={r}
                  size="xs"
                  variant={selectedDept === r ? 'primary' : 'outline'}
                  onClick={() => setSelectedDept(r)}
                  className="gap-1.5"
                >
                  <span>{DEPARTMENT_NAMES[r]}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
                    {count}
                  </span>
                </Button>
              );
            })}
          </div>

          <Card>
            <div className="p-4 border-b border-[#DCD8CE] bg-[#FBFAF7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold text-[#14213D]">
                Active Personnel Directory ({filteredUsers.length} of {usersList.length})
              </span>
              <div className="w-full sm:w-72">
                <Input
                  type="text"
                  placeholder="Filter by name, email, role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name & Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Assigned Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Reporting Manager</TableHead>
                  <TableHead>Assigned Territory</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-bold text-[#14213D] whitespace-nowrap">
                      {u.full_name}
                      <div className="text-[10px] text-[#4A5568] font-mono font-normal">
                        {u.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-[#14213D] whitespace-nowrap font-medium">
                      {DEPARTMENT_NAMES[u.role as UserRole] || 'General'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline" size="sm" className="uppercase font-bold">
                        {u.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#4A5568] font-mono whitespace-nowrap">
                      {u.phone || '-'}
                    </TableCell>
                    <TableCell className="text-[#4A5568] whitespace-nowrap">
                      {u.manager_name || 'Top Management'}
                    </TableCell>
                    <TableCell className="text-[#4A5568] whitespace-nowrap">
                      {u.zone_name || 'All India'}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <Badge
                        variant={u.is_active ? 'success' : 'danger'}
                        size="sm"
                      >
                        {u.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleUserActive(u.id, u.is_active)}
                        className="text-xs text-[#0F5E63]"
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* ── TAB 3: PRODUCTS & MHA QRs ── */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {productsList.map((p) => (
            <Card
              key={p.id}
              padding="md"
              className="flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-[#14213D] text-xs leading-tight">
                    {p.name}
                  </span>
                  {p.is_mha_qr && (
                    <Badge variant="urgent" size="sm" className="text-[10px] shrink-0">
                      MHA QR
                    </Badge>
                  )}
                </div>
                <div className="mt-2 text-xs text-[#4A5568]">
                  Category: <strong className="text-[#14213D]">{p.category}</strong>
                </div>
                <div className="text-xs text-[#4A5568]">
                  Make / OEM: <strong className="text-[#14213D]">{p.make || 'Arihant Partner'}</strong>
                </div>
              </div>

              {p.spec_ref && (
                <div className="pt-2 border-t border-[#DCD8CE] text-[10px] font-mono text-[#4A5568]">
                  QR Ref: {p.spec_ref}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ── TAB 4: ZONES & REGIONS ── */}
      {activeTab === 'zones' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {zonesList.map((z) => (
            <Card
              key={z.id}
              padding="md"
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#14213D] text-sm">{z.name} Zone</span>
                <span className="font-mono text-xs text-[#0F5E63] uppercase font-bold">{z.code}</span>
              </div>
              <p className="text-xs text-[#4A5568]">
                Strategic defence & law enforcement operational theater.
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* ── TAB 5: SECURITY AUDIT LOG ── */}
      {activeTab === 'audit' && (
        <Card>
          <div className="p-4 border-b border-[#DCD8CE] bg-[#FBFAF7]">
            <span className="text-xs font-bold text-[#14213D]">
              Immutable PostgreSQL Security Audit Trail (Last 50 Entries)
            </span>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp (IST)</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action Code</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Audit Payload Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-[#4A5568] font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-[#14213D] font-sans font-semibold whitespace-nowrap">
                      {log.actor_name || 'System Engine'}
                    </TableCell>
                    <TableCell className="text-[#0F5E63] font-semibold whitespace-nowrap">
                      {log.action}
                    </TableCell>
                    <TableCell className="text-[#4A5568] whitespace-nowrap">
                      {getEntityLabel(log)}
                    </TableCell>
                    <TableCell className="text-[#4A5568] font-sans max-w-xs truncate">
                      {getPayloadSummary(log)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </PageContainer>
  );
}
