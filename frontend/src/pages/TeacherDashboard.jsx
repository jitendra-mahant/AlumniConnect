import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  Flag,
  FolderGit2,
  GraduationCap,
  HelpCircle,
  Layers,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import api, { errorMessage } from '../api/client';
import useFetch from '../hooks/useFetch';
import { useToast } from '../context/ToastContext';
import {
  Avatar,
  EmptyState,
  ErrorState,
  Field,
  Modal,
  PageHeader,
  PageLoader,
  Skeleton,
  StatusBadge,
  Tabs,
} from '../components/ui';
import { formatDate, timeAgo } from '../utils/format';

function StatCard({ icon: Icon, label, value, sub, tone = 'bg-teal-50 text-teal-700 dark:bg-slate-800 dark:text-teal-300', onClick }) {
  const CardWrapper = onClick ? 'button' : 'div';
  return (
    <CardWrapper
      onClick={onClick}
      className={`card p-5 text-left transition min-w-0 w-full ${onClick ? 'hover:-translate-y-0.5 hover:shadow-lift cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 truncate">{label}</p>
        <div className={`rounded-lg p-2 ${tone} shrink-0`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 font-display text-3xl font-extrabold text-slate-900 dark:text-white truncate">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">{sub}</p>}
    </CardWrapper>
  );
}

export default function TeacherDashboard() {
  const toast = useToast();
  // Main view tab
  const [mainTab, setMainTab] = useState('overview');

  // Sub-tab for project groups
  const [groupFilterTab, setGroupFilterTab] = useState('all');
  const [projectSearch, setProjectSearch] = useState('');

  // Modals state for Project Groups
  const [reviewModal, setReviewModal] = useState({ open: false, group: null, milestone: null, index: -1 });
  const [reviewForm, setReviewForm] = useState({ status: 'approved', feedback: '' });
  const [reviewing, setReviewing] = useState(false);

  const [flagModal, setFlagModal] = useState({ open: false, group: null });
  const [flagReason, setFlagReason] = useState('');
  const [flagging, setFlagging] = useState(false);

  const [createModal, setCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({
    title: '',
    description: '',
    department: 'Computer Engineering',
    academicYear: '2025-2026',
    githubRepo: '',
    members: [{ name: '', email: '', rollNumber: '', roleInGroup: 'Team Member' }],
  });
  const [creating, setCreating] = useState(false);

  const [milestoneModal, setMilestoneModal] = useState({ open: false, group: null });
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', dueDate: '' });
  const [addingMilestone, setAddingMilestone] = useState(false);

  // Appointments State
  const [appointmentFilter, setAppointmentFilter] = useState('all');
  const [appointmentTypeFilter, setAppointmentTypeFilter] = useState('all');
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    studentEmail: '',
    studentName: '',
    type: 'project_guidance',
    topic: '',
    notes: '',
    scheduledDate: '',
    scheduledTime: '10:00 AM - 10:30 AM',
    location: 'Placement Office & Faculty Cabin, KKWAGH',
  });
  const [scheduling, setScheduling] = useState(false);

  // Appointment Feedback/Update Modal
  const [editApptModal, setEditApptModal] = useState({ open: false, appointment: null });
  const [apptUpdateForm, setApptUpdateForm] = useState({
    status: 'confirmed',
    guideFeedback: '',
    actionItems: '',
    scheduledTime: '',
    location: '',
  });
  const [updatingAppt, setUpdatingAppt] = useState(false);

  // Students Directory State
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDeptFilter, setStudentDeptFilter] = useState('all');

  // Guide Profile State
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    department: '',
    designation: '',
    cabin: '',
    officeHours: '',
    specialization: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Data fetching
  const { data: statsData, loading: statsLoading, reload: reloadStats } = useFetch('/teacher/stats');
  const { data: groupsData, loading: groupsLoading, error: groupsError, reload: reloadGroups } = useFetch(
    `/teacher/groups${groupFilterTab === 'at-risk' ? '?status=at-risk' : groupFilterTab === 'on-track' ? '?status=on-track' : ''}`
  );
  const { data: studentsData, loading: studentsLoading, error: studentsError, reload: reloadStudents } = useFetch(
    '/teacher/students',
    { q: studentSearch, department: studentDeptFilter }
  );
  const { data: appointmentsData, loading: appointmentsLoading, error: appointmentsError, reload: reloadAppointments } = useFetch(
    '/teacher/appointments',
    { status: appointmentFilter, type: appointmentTypeFilter }
  );
  const { data: placementData, loading: placementLoading, error: placementError, reload: reloadPlacement } = useFetch(
    '/teacher/placement-overview'
  );
  const { data: profileData, reload: reloadProfile } = useFetch('/teacher/profile');

  // Sync profile form once loaded
  if (profileData?.data && !profileLoaded) {
    setProfileForm({
      fullName: profileData.data.fullName || '',
      department: profileData.data.department || 'Computer Engineering',
      designation: profileData.data.designation || 'Assistant Professor & Project Guide',
      cabin: profileData.data.cabin || 'Room 204, IT Building',
      officeHours: profileData.data.officeHours || 'Mon-Fri 2:00 PM - 4:00 PM',
      specialization: Array.isArray(profileData.data.specialization)
        ? profileData.data.specialization.join(', ')
        : profileData.data.specialization || '',
    });
    setProfileLoaded(true);
  }

  const reloadAll = () => {
    reloadStats();
    reloadGroups();
    reloadStudents();
    reloadAppointments();
    reloadPlacement();
    reloadProfile();
  };

  const stats = statsData?.data || {
    totalGroups: 0,
    pendingReviews: 0,
    approvedMilestones: 0,
    totalMilestones: 0,
    atRiskGroups: 0,
    totalStudents: 0,
    pendingGuidanceRequests: 0,
    upcomingAppointments: 0,
    recentActivities: [],
  };

  const groups = groupsData?.data || [];
  const students = studentsData?.data || [];
  const appointments = appointmentsData?.data || [];
  const placement = placementData?.data || {
    metrics: { resumeReviews: 0, interviewPreps: 0, careerGuidances: 0, totalCareerSessions: 0 },
    placementReadinessChecklist: [],
    suggestedAlumniMentors: [],
  };

  // Filter project groups
  const filteredGroups = groups.filter((g) => {
    if (groupFilterTab === 'needs-review') {
      const hasPending = (g.milestones || []).some((m) => m.status === 'submitted');
      if (!hasPending) return false;
    }
    if (projectSearch.trim()) {
      const q = projectSearch.trim().toLowerCase();
      const matchTitle = g.title.toLowerCase().includes(q);
      const matchMember = (g.members || []).some(
        (m) => (m.name && m.name.toLowerCase().includes(q)) || (m.rollNumber && m.rollNumber.toLowerCase().includes(q))
      );
      if (!matchTitle && !matchMember) return false;
    }
    return true;
  });

  // Handle Review submission
  const handleOpenReview = (group, milestone, index) => {
    setReviewModal({ open: true, group, milestone, index });
    setReviewForm({
      status: milestone.status === 'submitted' ? 'approved' : milestone.status,
      feedback: milestone.feedback || '',
    });
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewModal.group || !reviewModal.milestone) return;
    setReviewing(true);
    try {
      const mId = reviewModal.milestone._id || reviewModal.index;
      await api.put(`/teacher/milestones/${reviewModal.group._id}/${mId}/review`, {
        status: reviewForm.status,
        feedback: reviewForm.feedback,
      });
      toast.success(`Milestone marked as ${reviewForm.status}`);
      setReviewModal({ open: false, group: null, milestone: null, index: -1 });
      reloadAll();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to update milestone status'));
    } finally {
      setReviewing(false);
    }
  };

  // Handle At-Risk Flagging
  const handleOpenFlag = (group) => {
    setFlagModal({ open: true, group });
    setFlagReason(group.atRiskReason || '');
  };

  const submitFlagToggle = async (isAtRisk) => {
    if (!flagModal.group) return;
    setFlagging(true);
    try {
      await api.put(`/teacher/groups/${flagModal.group._id}/flag`, {
        isAtRisk,
        atRiskReason: isAtRisk ? flagReason : '',
      });
      toast.success(isAtRisk ? 'Project group flagged as at risk' : 'At-risk flag removed');
      setFlagModal({ open: false, group: null });
      reloadAll();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to update risk status'));
    } finally {
      setFlagging(false);
    }
  };

  // Handle Create Group
  const handleAddMemberRow = () => {
    setNewGroup({
      ...newGroup,
      members: [...newGroup.members, { name: '', email: '', rollNumber: '', roleInGroup: 'Team Member' }],
    });
  };

  const handleRemoveMemberRow = (idx) => {
    const next = [...newGroup.members];
    next.splice(idx, 1);
    setNewGroup({ ...newGroup, members: next });
  };

  const submitCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroup.title.trim()) {
      toast.error('Project title is required');
      return;
    }
    const cleanMembers = newGroup.members.filter((m) => m.name.trim());
    if (cleanMembers.length === 0) {
      toast.error('Please add at least one student team member');
      return;
    }

    setCreating(true);
    try {
      await api.post('/teacher/groups', {
        ...newGroup,
        members: cleanMembers,
        milestones: [
          { title: 'Problem Definition & Literature Review', status: 'pending' },
          { title: 'System Architecture & Specs', status: 'pending' },
          { title: 'Core Implementation Prototype', status: 'pending' },
          { title: 'Testing, Deployment & Final Viva Report', status: 'pending' },
        ],
      });
      toast.success('New Project Group assigned and created successfully');
      setCreateModal(false);
      setNewGroup({
        title: '',
        description: '',
        department: 'Computer Engineering',
        academicYear: '2025-2026',
        githubRepo: '',
        members: [{ name: '', email: '', rollNumber: '', roleInGroup: 'Team Member' }],
      });
      reloadAll();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to create project group'));
    } finally {
      setCreating(false);
    }
  };

  // Handle Add Milestone
  const submitAddMilestone = async (e) => {
    e.preventDefault();
    if (!newMilestone.title.trim()) return;
    setAddingMilestone(true);
    try {
      await api.post(`/teacher/groups/${milestoneModal.group._id}/milestones`, newMilestone);
      toast.success('Milestone added successfully');
      setMilestoneModal({ open: false, group: null });
      setNewMilestone({ title: '', description: '', dueDate: '' });
      reloadAll();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to add milestone'));
    } finally {
      setAddingMilestone(false);
    }
  };

  // Handle Schedule Appointment
  const openScheduleForStudent = (student) => {
    setScheduleForm({
      studentEmail: student?.email || '',
      studentName: student?.name || '',
      type: 'project_guidance',
      topic: `Academic guidance for ${student?.name || 'student'}`,
      notes: '',
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      scheduledTime: '10:00 AM - 10:30 AM',
      location: 'Placement Office & Faculty Cabin, KKWAGH',
    });
    setScheduleModalOpen(true);
  };

  const submitScheduleAppointment = async (e) => {
    e.preventDefault();
    if (!scheduleForm.studentEmail.trim() || !scheduleForm.topic.trim() || !scheduleForm.scheduledDate) {
      toast.error('Student email, topic, and date are required');
      return;
    }
    setScheduling(true);
    try {
      await api.post('/teacher/appointments', scheduleForm);
      toast.success('Guidance appointment scheduled successfully');
      setScheduleModalOpen(false);
      reloadAll();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to schedule appointment'));
    } finally {
      setScheduling(false);
    }
  };

  // Handle Update Appointment
  const openEditAppointment = (appt) => {
    setEditApptModal({ open: true, appointment: appt });
    setApptUpdateForm({
      status: appt.status || 'confirmed',
      guideFeedback: appt.guideFeedback || '',
      actionItems: Array.isArray(appt.actionItems) ? appt.actionItems.join('\n') : '',
      scheduledTime: appt.scheduledTime || '',
      location: appt.location || '',
    });
  };

  const submitUpdateAppointment = async (e) => {
    e.preventDefault();
    if (!editApptModal.appointment) return;
    setUpdatingAppt(true);
    try {
      await api.put(`/teacher/appointments/${editApptModal.appointment._id}`, apptUpdateForm);
      toast.success('Appointment details updated successfully');
      setEditApptModal({ open: false, appointment: null });
      reloadAll();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to update appointment'));
    } finally {
      setUpdatingAppt(false);
    }
  };

  // Handle Save Guide Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await api.put('/teacher/profile', profileForm);
      toast.success('Guide profile updated successfully');
      reloadProfile();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to save profile'));
    } finally {
      setProfileSaving(false);
    }
  };

  const mainTabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'projects', label: 'Projects & Milestones', count: stats.totalGroups },
    { value: 'students', label: 'Assigned Students', count: stats.totalStudents },
    { value: 'guidance', label: 'Guidance & Appointments', count: stats.upcomingAppointments },
    { value: 'placement', label: 'Placement & Mentorship' },
    { value: 'profile', label: 'Guide Profile' },
  ];

  return (
    <div className="page space-y-6">
      <PageHeader
        title="Faculty Guide & Placement Workspace"
        subtitle="Manage assigned KKWAGH capstone project batches, review student milestone deliverables, coordinate guidance appointments, and oversee campus placement preparations."
        action={
          <div className="flex gap-2">
            <button onClick={reloadAll} className="btn-secondary" title="Refresh all workspace data">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setScheduleForm({
                  studentEmail: '',
                  studentName: '',
                  type: 'project_guidance',
                  topic: '',
                  notes: '',
                  scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  scheduledTime: '10:00 AM - 10:30 AM',
                  location: 'Placement Office & Faculty Cabin, KKWAGH',
                });
                setScheduleModalOpen(true);
              }}
              className="btn-secondary"
            >
              <Calendar className="h-4 w-4" /> Schedule Session
            </button>
            <button onClick={() => setCreateModal(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> New Project Group
            </button>
          </div>
        }
      />

      {/* Main Navigation Tabs */}
      <Tabs tabs={mainTabs} value={mainTab} onChange={setMainTab} />

      {/* TAB 1: OVERVIEW */}
      {mainTab === 'overview' && (
        <div className="space-y-6">
          {/* Stat Cards Grid */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 min-w-0">
            {statsLoading && !statsData ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
            ) : (
              <>
                <StatCard
                  icon={Users}
                  label="Assigned Students"
                  value={stats.totalStudents}
                  sub="Active mentees & project team members"
                  tone="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                  onClick={() => setMainTab('students')}
                />
                <StatCard
                  icon={Layers}
                  label="Capstone Project Batches"
                  value={stats.totalGroups}
                  sub={`${stats.totalMilestones} milestones configured`}
                  tone="bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                  onClick={() => setMainTab('projects')}
                />
                <StatCard
                  icon={Clock}
                  label="Pending Milestone Reviews"
                  value={stats.pendingReviews}
                  sub={stats.pendingReviews > 0 ? 'Submissions require evaluation' : 'All deliverables reviewed'}
                  tone="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                  onClick={() => {
                    setMainTab('projects');
                    setGroupFilterTab('needs-review');
                  }}
                />
                <StatCard
                  icon={Calendar}
                  label="Upcoming Appointments"
                  value={stats.upcomingAppointments}
                  sub={`${stats.pendingGuidanceRequests} pending guidance requests`}
                  tone="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                  onClick={() => setMainTab('guidance')}
                />
              </>
            )}
          </div>

          {/* Quick Actions & Workspace Banner */}
          <div className="card p-5 bg-gradient-to-r from-teal-50/50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-800/60 border-teal-100 dark:border-teal-950">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="badge bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 text-xs font-bold">
                    KKWAGH Academic Guidance Portal
                  </span>
                  {stats.atRiskGroups > 0 && (
                    <span className="badge bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 text-xs font-bold">
                      {stats.atRiskGroups} batch at risk
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Faculty Advisor & Capstone Supervisor Operations
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
                  Conduct periodic evaluation reviews, record attendance and guidance feedback, connect students with alumni mentors, and monitor milestone completion.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => openScheduleForStudent(null)}
                  className="btn-primary btn-sm"
                >
                  <Calendar className="h-3.5 w-3.5" /> Schedule Guidance
                </button>
                <button
                  onClick={() => setMainTab('placement')}
                  className="btn-secondary btn-sm"
                >
                  <Target className="h-3.5 w-3.5" /> Placement Prep
                </button>
              </div>
            </div>
          </div>

          {/* Two Column Layout: Recent Activities & Upcoming Schedule */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Activities */}
            <div className="lg:col-span-2 card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  Recent Supervision & Guidance Activity
                </h3>
                <button onClick={reloadStats} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  Refresh
                </button>
              </div>

              {stats.recentActivities && stats.recentActivities.length > 0 ? (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stats.recentActivities.map((act, idx) => (
                    <li key={idx} className="py-3 flex items-start gap-3 text-sm">
                      <div className="mt-1 h-2 w-2 rounded-full bg-teal-500 flex-shrink-0" />
                      <div className="flex-1 space-y-0.5">
                        <p className="font-semibold text-slate-900 dark:text-white">{act.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{act.description}</p>
                      </div>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">
                        {act.date ? timeAgo(act.date) : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400 py-6 text-center">No recent guidance activities logged yet.</p>
              )}
            </div>

            {/* Upcoming Guidance Sessions Snapshot */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Guidance Sessions
                </h3>
                <button
                  onClick={() => setMainTab('guidance')}
                  className="text-xs font-semibold text-brand-600 hover:underline"
                >
                  View All
                </button>
              </div>

              {appointments.length > 0 ? (
                <div className="space-y-3">
                  {appointments.slice(0, 4).map((appt) => (
                    <div
                      key={appt._id}
                      className="rounded-lg border border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/50 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-white">{appt.studentName}</span>
                        <StatusBadge status={appt.status} />
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 font-medium truncate">{appt.topic}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{formatDate(appt.scheduledDate)}</span>
                        <span>·</span>
                        <span>{appt.scheduledTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No upcoming appointments scheduled.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROJECTS & MILESTONES */}
      {mainTab === 'projects' && (
        <div className="space-y-6">
          {/* Sub-Tabs & Project Search */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All Batches', count: stats.totalGroups },
                { value: 'needs-review', label: 'Needs Review', count: stats.pendingReviews },
                { value: 'at-risk', label: 'At Risk', count: stats.atRiskGroups },
                { value: 'on-track', label: 'On Track', count: Math.max(0, stats.totalGroups - stats.atRiskGroups) },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setGroupFilterTab(t.value)}
                  className={`chip text-xs font-semibold ${
                    groupFilterTab === t.value
                      ? '!bg-navy-800 !text-white'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {t.label} {t.count !== undefined && <span className="ml-1 opacity-75">({t.count})</span>}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9 text-sm"
                placeholder="Search by project or student…"
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Project Groups List */}
          {groupsLoading && !groupsData ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          ) : groupsError ? (
            <ErrorState message={groupsError} onRetry={reloadAll} />
          ) : filteredGroups.length === 0 ? (
            <EmptyState
              icon={Layers}
              title={projectSearch ? 'No matching project groups' : 'No project groups in this category'}
              message={
                projectSearch
                  ? `No groups found matching "${projectSearch}". Try clearing your search query.`
                  : 'There are currently no capstone project groups matching this filter.'
              }
              action={
                projectSearch ? (
                  <button onClick={() => setProjectSearch('')} className="btn-secondary btn-sm">
                    Clear Search
                  </button>
                ) : (
                  <button onClick={() => setCreateModal(true)} className="btn-primary btn-sm">
                    <Plus className="h-4 w-4" /> Add Project Group
                  </button>
                )
              }
            />
          ) : (
            <div className="space-y-6">
              {filteredGroups.map((group) => {
                const pendingCount = (group.milestones || []).filter((m) => m.status === 'submitted').length;
                const approvedCount = (group.milestones || []).filter((m) => m.status === 'approved').length;

                return (
                  <div
                    key={group._id}
                    className={`card p-6 transition duration-200 ${
                      group.isAtRisk
                        ? 'border-red-300 dark:border-red-900/60 ring-1 ring-red-200 dark:ring-red-900/40'
                        : 'hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Header row */}
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{group.title}</h3>
                          {group.isAtRisk ? (
                            <span className="badge bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 ring-1 ring-red-300 dark:ring-red-800 flex items-center gap-1">
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> At Risk
                            </span>
                          ) : (
                            <span className="badge bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> On Track
                            </span>
                          )}
                          {pendingCount > 0 && (
                            <span className="badge bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-800 animate-pulse">
                              {pendingCount} review pending
                            </span>
                          )}
                        </div>
                        {group.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">{group.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                          <span>{group.department}</span>
                          <span>•</span>
                          <span>Academic Year {group.academicYear}</span>
                          {group.githubRepo && (
                            <>
                              <span>•</span>
                              <a
                                href={group.githubRepo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                              >
                                <FolderGit2 className="h-3.5 w-3.5" /> Repository <ExternalLink className="h-3 w-3" />
                              </a>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleOpenFlag(group)}
                          className={`btn btn-sm ${
                            group.isAtRisk
                              ? 'border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40'
                              : 'btn-secondary text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <Flag className="h-3.5 w-3.5" /> {group.isAtRisk ? 'Manage Risk' : 'Flag Risk'}
                        </button>
                        <button
                          onClick={() => {
                            setMilestoneModal({ open: true, group });
                            setNewMilestone({ title: '', description: '', dueDate: '' });
                          }}
                          className="btn-secondary btn-sm"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Milestone
                        </button>
                      </div>
                    </div>

                    {/* At-risk Banner */}
                    {group.isAtRisk && group.atRiskReason && (
                      <div className="mt-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/30 p-3 text-xs text-red-800 dark:text-red-300 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                        <div>
                          <span className="font-bold">Attention Required: </span>
                          {group.atRiskReason}
                        </div>
                      </div>
                    )}

                    {/* Progress bar */}
                    <div className="mt-5 space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600 dark:text-slate-400">Completion Progress</span>
                        <span className="text-slate-900 dark:text-white font-bold">
                          {group.progress || 0}% ({approvedCount} of {group.milestones?.length || 0} approved)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            group.isAtRisk
                              ? 'bg-red-500'
                              : group.progress === 100
                              ? 'bg-emerald-500'
                              : 'bg-gradient-to-r from-navy-700 to-brand-500'
                          }`}
                          style={{ width: `${group.progress || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Team Members */}
                    <div className="mt-5 rounded-lg bg-slate-50 dark:bg-slate-900/60 p-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        Student Team Members
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                        {(group.members || []).map((m, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 rounded bg-white dark:bg-slate-800 p-2 border border-slate-200/80 dark:border-slate-700 text-xs shadow-sm"
                          >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950/60 font-bold text-teal-800 dark:text-teal-300 text-[11px]">
                              {m.name.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{m.name}</p>
                              <p className="text-slate-500 dark:text-slate-400 truncate text-[11px]">
                                {m.rollNumber ? `Roll ${m.rollNumber}` : ''} {m.roleInGroup ? `· ${m.roleInGroup}` : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Milestones list */}
                    <div className="mt-5 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Project Milestones
                      </p>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                        {(group.milestones || []).map((m, mIdx) => {
                          const isSubmitted = m.status === 'submitted';
                          const isApproved = m.status === 'approved';
                          const isRevisions = m.status === 'revisions_requested';

                          return (
                            <div
                              key={m._id || mIdx}
                              className={`p-4 transition ${
                                isSubmitted ? 'bg-amber-50/40 dark:bg-amber-950/20' : 'bg-white dark:bg-slate-900'
                              }`}
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-400">#{mIdx + 1}</span>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{m.title}</h4>
                                    {isApproved && (
                                      <span className="badge bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800 text-[11px]">
                                        Approved
                                      </span>
                                    )}
                                    {isSubmitted && (
                                      <span className="badge bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-800 text-[11px] animate-pulse">
                                        Submitted for Review
                                      </span>
                                    )}
                                    {isRevisions && (
                                      <span className="badge bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-800 text-[11px]">
                                        Revisions Requested
                                      </span>
                                    )}
                                    {m.status === 'pending' && (
                                      <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700 text-[11px]">
                                        Pending
                                      </span>
                                    )}
                                  </div>
                                  {m.description && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{m.description}</p>
                                  )}

                                  {/* Deliverable link */}
                                  {m.submissionUrl && (
                                    <div className="pt-1 flex items-center gap-2 text-xs">
                                      <span className="text-slate-500 dark:text-slate-400 font-medium">Deliverable:</span>
                                      <a
                                        href={m.submissionUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                                      >
                                        View Submission <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </div>
                                  )}
                                  {m.submissionNotes && (
                                    <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/80 rounded p-1.5 mt-1 border border-slate-100 dark:border-slate-700">
                                      "{m.submissionNotes}"
                                    </p>
                                  )}

                                  {/* Guide Feedback */}
                                  {m.feedback && (
                                    <div className="mt-2 text-xs rounded bg-teal-50/60 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/60 p-2 text-teal-900 dark:text-teal-200">
                                      <span className="font-bold">Guide Feedback: </span>
                                      {m.feedback}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0 pt-1">
                                  {m.dueDate && (
                                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                      <Calendar className="h-3 w-3" /> Due {formatDate(m.dueDate)}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleOpenReview(group, m, mIdx)}
                                    className={`btn btn-sm ${
                                      isSubmitted
                                        ? 'btn-accent !px-3 font-bold'
                                        : 'btn-secondary text-slate-600 hover:text-navy-800'
                                    }`}
                                  >
                                    {isSubmitted ? 'Review Submission' : 'Update Review'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ASSIGNED STUDENTS DIRECTORY */}
      {mainTab === 'students' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9 text-sm"
                placeholder="Search students by name, email, roll no…"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                className="input text-xs py-1.5"
                value={studentDeptFilter}
                onChange={(e) => setStudentDeptFilter(e.target.value)}
              >
                <option value="all">All Departments</option>
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics & Telecommunication">Electronics & Telecommunication</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
              </select>
              <button onClick={reloadStudents} className="btn-secondary btn-sm" title="Refresh students">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {studentsLoading && !studentsData ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-xl" />
              ))}
            </div>
          ) : studentsError ? (
            <ErrorState message={studentsError} onRetry={reloadStudents} />
          ) : students.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No students assigned"
              message="Students assigned to your project groups or mentorship sessions will be displayed here."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {students.map((st, idx) => (
                <div key={idx} className="card p-5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950 font-bold text-teal-800 dark:text-teal-300">
                          {st.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{st.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{st.email}</p>
                        </div>
                      </div>
                      <span className="badge bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                        {st.rollNumber !== 'N/A' ? `Roll ${st.rollNumber}` : 'Student'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-1">
                      <p>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">Dept:</span> {st.department}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">Degree:</span> {st.degree} (Year {st.currentYear})
                      </p>
                      {st.careerGoals && (
                        <p className="text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                          "{st.careerGoals}"
                        </p>
                      )}
                    </div>

                    {/* Skills Chips */}
                    {st.skills && st.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {st.skills.slice(0, 4).map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-block rounded bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 text-[10px] font-semibold text-teal-800 dark:text-teal-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {st.projects?.length || 0} Project{st.projects?.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => openScheduleForStudent(st)}
                      className="btn-secondary btn-sm !py-1 text-xs"
                    >
                      <Calendar className="h-3 w-3" /> Guidance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: GUIDANCE & APPOINTMENTS */}
      {mainTab === 'guidance' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {['all', 'confirmed', 'completed', 'pending', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setAppointmentFilter(st)}
                  className={`chip capitalize text-xs font-semibold ${
                    appointmentFilter === st
                      ? '!bg-navy-800 !text-white'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <select
                className="input text-xs py-1.5"
                value={appointmentTypeFilter}
                onChange={(e) => setAppointmentTypeFilter(e.target.value)}
              >
                <option value="all">All Guidance Types</option>
                <option value="project_guidance">Capstone Project Guidance</option>
                <option value="resume_review">Resume Review & Feedback</option>
                <option value="interview_prep">Mock Interview Prep</option>
                <option value="career_guidance">Career & Placement Guidance</option>
                <option value="academic_mentorship">Academic Mentorship</option>
              </select>
              <button
                onClick={() => {
                  setScheduleForm({
                    studentEmail: '',
                    studentName: '',
                    type: 'project_guidance',
                    topic: '',
                    notes: '',
                    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    scheduledTime: '10:00 AM - 10:30 AM',
                    location: 'Placement Office & Faculty Cabin, KKWAGH',
                  });
                  setScheduleModalOpen(true);
                }}
                className="btn-primary btn-sm"
              >
                <Plus className="h-3.5 w-3.5" /> Schedule Session
              </button>
            </div>
          </div>

          {appointmentsLoading && !appointmentsData ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : appointmentsError ? (
            <ErrorState message={appointmentsError} onRetry={reloadAppointments} />
          ) : appointments.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No guidance appointments"
              message="No guidance sessions found matching the selected filters. Use the button above to schedule a new guidance appointment."
            />
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => (
                <div key={appt._id} className="card p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="badge bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-semibold text-xs">
                          {appt.type ? appt.type.replace(/_/g, ' ').toUpperCase() : 'GUIDANCE'}
                        </span>
                        <StatusBadge status={appt.status} />
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white pt-1">{appt.topic}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Student: <strong className="text-slate-700 dark:text-slate-300">{appt.studentName}</strong> (
                        <span className="font-mono">{appt.studentEmail}</span>)
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openEditAppointment(appt)}
                        className="btn-secondary btn-sm"
                      >
                        Update Feedback
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                      {formatDate(appt.scheduledDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                      {appt.scheduledTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                      {appt.location}
                    </span>
                  </div>

                  {appt.notes && (
                    <div className="text-xs bg-slate-50 dark:bg-slate-900/60 rounded p-2 text-slate-600 dark:text-slate-300">
                      <strong className="text-slate-700 dark:text-slate-200">Agenda / Notes: </strong>
                      {appt.notes}
                    </div>
                  )}

                  {appt.guideFeedback && (
                    <div className="text-xs bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-900/60 rounded p-2.5 text-teal-900 dark:text-teal-200">
                      <strong className="text-teal-950 dark:text-teal-100">Faculty Guide Feedback: </strong>
                      {appt.guideFeedback}
                    </div>
                  )}

                  {appt.actionItems && appt.actionItems.length > 0 && (
                    <div className="text-xs space-y-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                        Action Items:
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400 pl-1">
                        {appt.actionItems.map((item, aIdx) => (
                          <li key={aIdx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PLACEMENT & MENTORSHIP */}
      {mainTab === 'placement' && (
        <div className="space-y-6">
          {/* Placement Metric Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 min-w-0">
            <StatCard
              icon={FileCheck}
              label="Resume Reviews"
              value={placement.metrics.resumeReviews}
              sub="Completed student CV audits"
              tone="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
            />
            <StatCard
              icon={Sparkles}
              label="Mock Interview Preps"
              value={placement.metrics.interviewPreps}
              sub="Technical & HR prep sessions"
              tone="bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
            />
            <StatCard
              icon={Target}
              label="Career Guidance"
              value={placement.metrics.careerGuidances}
              sub="Direct one-on-one sessions"
              tone="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
            />
            <StatCard
              icon={Award}
              label="Total Placement Sessions"
              value={placement.metrics.totalCareerSessions}
              sub="Conducted for 2025-2026 batch"
              tone="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Placement Readiness Checklist */}
            <div className="card p-5 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Institutional Placement Readiness Framework
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Department benchmarks required prior to campus placement drives and company interview rounds:
              </p>

              <div className="space-y-2.5">
                {placement.placementReadinessChecklist.map((ch, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{ch.item}</span>
                    <span
                      className={`badge text-[11px] font-bold ${
                        ch.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                      }`}
                    >
                      {ch.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Alumni Mentors */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  Verified KKWAGH Alumni Mentors
                </h3>
                <Link to="/directory" className="text-xs font-semibold text-brand-600 hover:underline">
                  Full Directory
                </Link>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connect your students with alumni working in top software engineering and tech domains:
              </p>

              <div className="space-y-3">
                {placement.suggestedAlumniMentors && placement.suggestedAlumniMentors.length > 0 ? (
                  placement.suggestedAlumniMentors.map((alumni) => (
                    <div
                      key={alumni._id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{alumni.fullName}</p>
                        <p className="text-slate-500 dark:text-slate-400">
                          {alumni.currentJobTitle} at <strong className="text-slate-700 dark:text-slate-300">{alumni.currentCompany}</strong>
                        </p>
                      </div>
                      <Link
                        to={`/alumni/${alumni._id}`}
                        className="btn-ghost btn-sm text-brand-600 hover:bg-brand-50 text-xs font-semibold"
                      >
                        View Profile
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No alumni mentors listed at this time.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: GUIDE PROFILE */}
      {mainTab === 'profile' && (
        <div className="max-w-2xl card p-6 space-y-5">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Faculty Guide Information</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update your departmental cabin details and office consultation hours so students can locate you for reviews.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Field label="Full Name *">
              <input
                className="input"
                required
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Department">
                <input
                  className="input"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                />
              </Field>
              <Field label="Designation">
                <input
                  className="input"
                  value={profileForm.designation}
                  onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Cabin / Office Location">
                <input
                  className="input"
                  placeholder="e.g. Room 204, IT Building"
                  value={profileForm.cabin}
                  onChange={(e) => setProfileForm({ ...profileForm, cabin: e.target.value })}
                />
              </Field>
              <Field label="Office Consultation Hours">
                <input
                  className="input"
                  placeholder="e.g. Mon-Fri 2:00 PM - 4:00 PM"
                  value={profileForm.officeHours}
                  onChange={(e) => setProfileForm({ ...profileForm, officeHours: e.target.value })}
                />
              </Field>
            </div>

            <Field
              label="Specializations & Research Areas"
              hint="Comma separated (e.g. Distributed Systems, Machine Learning, Cloud Computing)"
            >
              <input
                className="input"
                value={profileForm.specialization}
                onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
              />
            </Field>

            <div className="pt-2 flex justify-end">
              <button type="submit" disabled={profileSaving} className="btn-primary">
                {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Guide Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Review Milestone */}
      <Modal
        open={reviewModal.open}
        onClose={() => setReviewModal({ open: false, group: null, milestone: null, index: -1 })}
        title={`Review Milestone: ${reviewModal.milestone?.title || ''}`}
        footer={
          <>
            <button
              type="button"
              onClick={() => setReviewModal({ open: false, group: null, milestone: null, index: -1 })}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" form="review-form" disabled={reviewing} className="btn-primary">
              {reviewing && <Loader2 className="h-4 w-4 animate-spin" />} Save Review Decision
            </button>
          </>
        }
      >
        <form id="review-form" onSubmit={submitReview} className="space-y-4">
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 p-3 text-xs space-y-1">
            <p className="font-bold text-slate-700 dark:text-slate-200">{reviewModal.group?.title}</p>
            {reviewModal.milestone?.submissionUrl && (
              <p>
                <span className="text-slate-500 dark:text-slate-400">Submission URL: </span>
                <a
                  href={reviewModal.milestone.submissionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 dark:text-brand-400 underline font-semibold"
                >
                  {reviewModal.milestone.submissionUrl}
                </a>
              </p>
            )}
            {reviewModal.milestone?.submissionNotes && (
              <p>
                <span className="text-slate-500 dark:text-slate-400">Student Notes: </span>
                {reviewModal.milestone.submissionNotes}
              </p>
            )}
          </div>

          <Field label="Evaluation Decision">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReviewForm({ ...reviewForm, status: 'approved' })}
                className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-bold transition ${
                  reviewForm.status === 'approved'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/30'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Approve Milestone
              </button>
              <button
                type="button"
                onClick={() => setReviewForm({ ...reviewForm, status: 'revisions_requested' })}
                className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-bold transition ${
                  reviewForm.status === 'revisions_requested'
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 ring-2 ring-red-500/30'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <AlertCircle className="h-4 w-4 text-red-600" /> Request Revisions
              </button>
            </div>
          </Field>

          <Field
            label="Teacher Feedback & Guidance"
            hint="Provide specific technical feedback, test cases, or directions for the students."
          >
            <textarea
              className="input min-h-[100px]"
              required
              rows={4}
              placeholder="e.g. Code structure looks solid. Make sure unit test coverage is above 80% before Milestone 3."
              value={reviewForm.feedback}
              onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })}
            />
          </Field>
        </form>
      </Modal>

      {/* MODAL: Flag / At-Risk */}
      <Modal
        open={flagModal.open}
        onClose={() => setFlagModal({ open: false, group: null })}
        title={`Project Risk Status: ${flagModal.group?.title || ''}`}
        footer={
          <div className="flex justify-between w-full">
            {flagModal.group?.isAtRisk ? (
              <button
                type="button"
                disabled={flagging}
                onClick={() => submitFlagToggle(false)}
                className="btn-secondary text-emerald-700"
              >
                {flagging && <Loader2 className="h-4 w-4 animate-spin" />} Clear At-Risk Flag
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => setFlagModal({ open: false, group: null })} className="btn-secondary">
                Cancel
              </button>
              <button
                type="button"
                disabled={flagging || !flagReason.trim()}
                onClick={() => submitFlagToggle(true)}
                className="btn-danger"
              >
                {flagging && <Loader2 className="h-4 w-4 animate-spin" />} Mark as At Risk
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Flagging a project group highlights it on your dashboard and alerts the academic department that this team is falling
            behind schedule or needs extra faculty intervention.
          </p>
          <Field label="Risk Reason / Delay Summary" hint="Specify why this project group is currently at risk.">
            <textarea
              className="input"
              rows={3}
              placeholder="e.g. Milestone 2 deliverable delayed by 2 weeks. Hardware sensor calibration issues in lab tests."
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
            />
          </Field>
        </div>
      </Modal>

      {/* MODAL: Add Milestone */}
      <Modal
        open={milestoneModal.open}
        onClose={() => setMilestoneModal({ open: false, group: null })}
        title={`Add Milestone to: ${milestoneModal.group?.title || ''}`}
        footer={
          <>
            <button type="button" onClick={() => setMilestoneModal({ open: false, group: null })} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" form="add-milestone-form" disabled={addingMilestone} className="btn-primary">
              {addingMilestone && <Loader2 className="h-4 w-4 animate-spin" />} Add Milestone
            </button>
          </>
        }
      >
        <form id="add-milestone-form" onSubmit={submitAddMilestone} className="space-y-4">
          <Field label="Milestone Title">
            <input
              className="input"
              required
              placeholder="e.g. Mid-Term Evaluation & Code Review"
              value={newMilestone.title}
              onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
            />
          </Field>
          <Field label="Description & Deliverables">
            <textarea
              className="input"
              rows={2}
              placeholder="e.g. Submit GitHub release tag and demonstration recording."
              value={newMilestone.description}
              onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
            />
          </Field>
          <Field label="Target Due Date (Optional)">
            <input
              type="date"
              className="input"
              value={newMilestone.dueDate}
              onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
            />
          </Field>
        </form>
      </Modal>

      {/* MODAL: Create Project Group */}
      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title="Register New Capstone Project Group"
        wide
        footer={
          <>
            <button type="button" onClick={() => setCreateModal(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" form="create-group-form" disabled={creating} className="btn-primary">
              {creating && <Loader2 className="h-4 w-4 animate-spin" />} Create Project Group
            </button>
          </>
        }
      >
        <form id="create-group-form" onSubmit={submitCreateGroup} className="space-y-4">
          <Field label="Project Title *">
            <input
              className="input"
              required
              placeholder="e.g. Federated Learning for Privacy-Preserving Health Analytics"
              value={newGroup.title}
              onChange={(e) => setNewGroup({ ...newGroup, title: e.target.value })}
            />
          </Field>

          <Field label="Project Abstract / Description">
            <textarea
              className="input"
              rows={2}
              placeholder="Brief description of the capstone project scope and technical stack."
              value={newGroup.description}
              onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Department">
              <input
                className="input"
                value={newGroup.department}
                onChange={(e) => setNewGroup({ ...newGroup, department: e.target.value })}
              />
            </Field>
            <Field label="Academic Year">
              <input
                className="input"
                value={newGroup.academicYear}
                onChange={(e) => setNewGroup({ ...newGroup, academicYear: e.target.value })}
              />
            </Field>
          </div>

          <Field label="GitHub Repository URL (Optional)">
            <input
              type="url"
              className="input"
              placeholder="https://github.com/..."
              value={newGroup.githubRepo}
              onChange={(e) => setNewGroup({ ...newGroup, githubRepo: e.target.value })}
            />
          </Field>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Student Team Members *</label>
              <button
                type="button"
                onClick={handleAddMemberRow}
                className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add Member
              </button>
            </div>
            <div className="space-y-2">
              {newGroup.members.map((m, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    className="input text-xs"
                    placeholder="Student Name *"
                    required
                    value={m.name}
                    onChange={(e) => {
                      const next = [...newGroup.members];
                      next[idx].name = e.target.value;
                      setNewGroup({ ...newGroup, members: next });
                    }}
                  />
                  <input
                    className="input text-xs"
                    placeholder="Roll No"
                    value={m.rollNumber}
                    onChange={(e) => {
                      const next = [...newGroup.members];
                      next[idx].rollNumber = e.target.value;
                      setNewGroup({ ...newGroup, members: next });
                    }}
                  />
                  <input
                    type="email"
                    className="input text-xs"
                    placeholder="Email (@kkwagh.edu.in)"
                    value={m.email}
                    onChange={(e) => {
                      const next = [...newGroup.members];
                      next[idx].email = e.target.value;
                      setNewGroup({ ...newGroup, members: next });
                    }}
                  />
                  {newGroup.members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMemberRow(idx)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL: Schedule Guidance Session */}
      <Modal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="Schedule Guidance Appointment"
        footer={
          <>
            <button type="button" onClick={() => setScheduleModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" form="schedule-appt-form" disabled={scheduling} className="btn-primary">
              {scheduling && <Loader2 className="h-4 w-4 animate-spin" />} Confirm Appointment
            </button>
          </>
        }
      >
        <form id="schedule-appt-form" onSubmit={submitScheduleAppointment} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Student Name">
              <input
                className="input"
                placeholder="e.g. Tanmay Kulkarni"
                value={scheduleForm.studentName}
                onChange={(e) => setScheduleForm({ ...scheduleForm, studentName: e.target.value })}
              />
            </Field>
            <Field label="Student Email (@kkwagh.edu.in) *">
              <input
                type="email"
                className="input"
                required
                placeholder="student@kkwagh.edu.in"
                value={scheduleForm.studentEmail}
                onChange={(e) => setScheduleForm({ ...scheduleForm, studentEmail: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Guidance Type *">
            <select
              className="input"
              value={scheduleForm.type}
              onChange={(e) => setScheduleForm({ ...scheduleForm, type: e.target.value })}
            >
              <option value="project_guidance">Capstone Project Guidance</option>
              <option value="resume_review">Resume Review & Formatting</option>
              <option value="interview_prep">Mock Technical & HR Interview</option>
              <option value="career_guidance">Career & Placement Advice</option>
              <option value="academic_mentorship">Academic Mentorship</option>
            </select>
          </Field>

          <Field label="Topic / Discussion Purpose *">
            <input
              className="input"
              required
              placeholder="e.g. Architecture review for Milestone 2 and DSA prep"
              value={scheduleForm.topic}
              onChange={(e) => setScheduleForm({ ...scheduleForm, topic: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Scheduled Date *">
              <input
                type="date"
                className="input"
                required
                value={scheduleForm.scheduledDate}
                onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
              />
            </Field>
            <Field label="Time Window">
              <input
                className="input"
                placeholder="e.g. 11:00 AM - 11:30 AM"
                value={scheduleForm.scheduledTime}
                onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledTime: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Location / Meeting Venue">
            <input
              className="input"
              placeholder="e.g. Placement Office, Room 204 or Google Meet link"
              value={scheduleForm.location}
              onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })}
            />
          </Field>

          <Field label="Initial Notes / Agenda">
            <textarea
              className="input"
              rows={2}
              placeholder="Items student should bring or prepare in advance."
              value={scheduleForm.notes}
              onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
            />
          </Field>
        </form>
      </Modal>

      {/* MODAL: Update Guidance Session & Feedback */}
      <Modal
        open={editApptModal.open}
        onClose={() => setEditApptModal({ open: false, appointment: null })}
        title={`Session: ${editApptModal.appointment?.topic || ''}`}
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditApptModal({ open: false, appointment: null })}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" form="edit-appt-form" disabled={updatingAppt} className="btn-primary">
              {updatingAppt && <Loader2 className="h-4 w-4 animate-spin" />} Save Updates
            </button>
          </>
        }
      >
        <form id="edit-appt-form" onSubmit={submitUpdateAppointment} className="space-y-4">
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 p-3 text-xs space-y-1">
            <p>
              <strong className="text-slate-700 dark:text-slate-200">Student: </strong>
              {editApptModal.appointment?.studentName} ({editApptModal.appointment?.studentEmail})
            </p>
            <p>
              <strong className="text-slate-700 dark:text-slate-200">Scheduled: </strong>
              {editApptModal.appointment?.scheduledDate && formatDate(editApptModal.appointment.scheduledDate)} at{' '}
              {editApptModal.appointment?.scheduledTime}
            </p>
          </div>

          <Field label="Appointment Status">
            <select
              className="input"
              value={apptUpdateForm.status}
              onChange={(e) => setApptUpdateForm({ ...apptUpdateForm, status: e.target.value })}
            >
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Field>

          <Field label="Guide Feedback & Evaluation Notes">
            <textarea
              className="input min-h-[90px]"
              rows={3}
              placeholder="e.g. Resume format refined. Suggested prioritizing Spring Boot projects over basic tutorials."
              value={apptUpdateForm.guideFeedback}
              onChange={(e) => setApptUpdateForm({ ...apptUpdateForm, guideFeedback: e.target.value })}
            />
          </Field>

          <Field label="Action Items (One item per line)">
            <textarea
              className="input min-h-[80px]"
              rows={3}
              placeholder="e.g. Complete 5 LeetCode medium questions on trees&#10;Update GitHub project README with screenshots"
              value={apptUpdateForm.actionItems}
              onChange={(e) => setApptUpdateForm({ ...apptUpdateForm, actionItems: e.target.value })}
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
