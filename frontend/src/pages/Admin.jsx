import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, BadgeCheck, BriefcaseBusiness, Building2, Check, CheckCircle2,
  ChevronDown, ChevronUp, Copy, Download, FileSpreadsheet, FileText, Flag, Handshake, HandHeart,
  HelpCircle, History, KeyRound, Loader2, MessageSquare, Printer, RefreshCw,
  Search, ShieldAlert, ShieldCheck, Trash2, UserCheck, UserX, Users, X,
} from 'lucide-react';
import api, { errorMessage } from '../api/client';
import useFetch from '../hooks/useFetch';
import { useToast } from '../context/ToastContext';
import {
  Avatar, EmptyState, ErrorState, Field, Modal, PageHeader, PageLoader, Pagination,
  Skeleton, StatusBadge, Tabs,
} from '../components/ui';
import { formatDate, timeAgo } from '../utils/format';

function StatCard({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className="card p-5 min-w-0">
      <div className="flex items-center justify-between min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 truncate">{label}</p>
        <div className={`rounded-lg p-2 ${tone} shrink-0`}><Icon className="h-4 w-4" /></div>
      </div>
      <p className="mt-2 font-display text-3xl font-extrabold text-navy-950 dark:text-white truncate">{value}</p>
      {sub && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{sub}</p>}
    </div>
  );
}

function BarList({ title, rows, labelKey = 'name' }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <section className="card p-5">
      <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      {rows.length === 0 ? <p className="text-sm text-slate-400">No data yet.</p> : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r[labelKey]}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">{r[labelKey]}</span>
                <span className="text-slate-500 dark:text-slate-400">{r.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-navy-700 to-brand-500" style={{ width: `${(r.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AlumniReportsAndQuality({ onRefreshOverview }) {
  const toast = useToast();
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const { data, loading, error, reload } = useFetch('/admin/reports/summary', { year: selectedYear });

  const [standardizing, setStandardizing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Safe Cleanup & Dry-Run state
  const [cleanupModalOpen, setCleanupModalOpen] = useState(false);
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [dryRunData, setDryRunData] = useState(null);
  const [executingCleanup, setExecutingCleanup] = useState(false);
  const [cleanupResult, setCleanupResult] = useState(null);

  const summary = data?.data;

  const handleStandardize = async (from, to) => {
    setStandardizing(true);
    try {
      const res = await api.put('/admin/alumni-2022/correct-company', {
        fromCompany: from,
        toCompany: to,
      });
      toast.success(res.data.message || 'Company name standardized successfully');
      reload();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setStandardizing(false);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const param = selectedYear && selectedYear !== 'all' ? `&year=${selectedYear}` : '';
      const res = await api.get(`/admin/export/alumni?format=csv${param}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      const fileBatch = selectedYear && selectedYear !== 'all' ? `Batch_${selectedYear}` : 'All_Years';
      link.setAttribute('download', `KKWAGH_Alumni_${fileBatch}_Report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Excel CSV report downloaded (${fileBatch}). Strictly zero phone numbers.`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleOpenDryRun = async () => {
    setCleanupModalOpen(true);
    setDryRunLoading(true);
    setCleanupResult(null);
    try {
      const res = await api.get('/admin/data-cleanup/dry-run');
      setDryRunData(res.data.data);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDryRunLoading(false);
    }
  };

  const handleExecuteCleanup = async () => {
    if (!window.confirm('Execute safe cleanup? Only confirmed obsolete mock sample records will be removed. All student, faculty, and administrator accounts are 100% protected. An automatic disk backup will be created.')) {
      return;
    }
    setExecutingCleanup(true);
    try {
      const res = await api.post('/admin/data-cleanup/execute');
      setCleanupResult(res.data.data);
      toast.success(res.data.data.message || 'Database cleanup completed successfully');
      reload();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setExecutingCleanup(false);
    }
  };

  if (loading && !data) return <Skeleton className="h-64 rounded-xl" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!summary) return null;

  const availableYears = summary.availableYears || [];

  return (
    <div className="space-y-6">
      {/* Institutional Action Header */}
      <div className="card p-5 bg-gradient-to-r from-teal-900/10 via-slate-900/5 to-teal-900/10 dark:from-teal-950/40 dark:to-slate-900/60 border border-teal-500/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              Alumni Reports & Data Quality Center
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Institutional alumni data for K.K. Wagh Institute of Engineering Education & Research (KKWAGH). Zero phone numbers stored or exported.
            </p>
          </div>

          {/* Controls: Year filter + Exports + Safe Cleanup */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <label htmlFor="year-select" className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Year:
              </label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setSelectedCompany('all');
                  setShowAllCompanies(false);
                }}
                className="input py-1 px-2.5 text-xs font-medium rounded-lg h-8 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
              >
                <option value="all">All Years ({summary.totalAlumni})</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Class of {yr}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exporting}
              className="btn-primary btn-sm flex items-center gap-1.5"
              title="Download formatted CSV report for Microsoft Excel"
            >
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
              Export Excel (CSV)
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              className="btn-secondary btn-sm flex items-center gap-1.5"
              title="Print or Save Official Institutional Report as PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              Generate PDF
            </button>

            <button
              type="button"
              onClick={handleOpenDryRun}
              className="btn-secondary btn-sm flex items-center gap-1.5 border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40"
              title="Synchronize database with latest spreadsheet dataset and review obsolete mock data"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Sync & Clean Mock Data
            </button>
          </div>
        </div>

        {/* Quality Metrics Row */}
        <div className="mt-5 grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 min-w-0">
          <div className="rounded-lg p-3 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 min-w-0">
            <p className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 truncate">Selected Scope Alumni</p>
            <p className="text-xl font-extrabold text-teal-700 dark:text-teal-300 mt-0.5 truncate">{summary.totalAlumni}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {selectedYear === 'all' ? 'Across all recorded batches' : `Graduation batch ${selectedYear}`}
            </p>
          </div>

          <div className="rounded-lg p-3 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 min-w-0">
            <p className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 truncate">Affiliated Companies</p>
            <p className="text-xl font-extrabold text-blue-700 dark:text-blue-300 mt-0.5 truncate">{summary.companyCounts?.length || 0}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Distinct hiring organizations</p>
          </div>

          <div className="rounded-lg p-3 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 min-w-0">
            <p className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 truncate">Unspecified Fields</p>
            <p className="text-xl font-extrabold text-amber-700 dark:text-amber-300 mt-0.5 truncate">
              {summary.missingCompany} co · {summary.missingRole} role
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Preserved honestly without inventing values</p>
          </div>

          <div className="rounded-lg p-3 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 min-w-0">
            <p className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 truncate">LinkedIn Privacy</p>
            <p className="text-xl font-extrabold text-purple-700 dark:text-purple-300 mt-0.5 truncate">{summary.linkedinConfirmed} confirmed</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{summary.linkedinPrivate} private by default</p>
          </div>
        </div>
      </div>

      {/* Company Name Spelling Variants Review */}
      {summary.companyVariants?.length > 0 && (
        <section className="card p-5 border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Potential Company Name Variants Detected for Administrator Review
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
            The following companies have slight differences in spelling or suffixes across records. You can standardize them into a single canonical name:
          </p>

          <div className="space-y-3">
            {summary.companyVariants.map((vg) => (
              <div
                key={vg.canonical}
                className="p-3.5 rounded-lg border border-amber-200/80 dark:border-amber-800/60 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      Canonical: {vg.canonical}
                    </span>
                    <span className="badge bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-semibold">
                      {vg.totalCombined} total records
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>Observed spellings:</span>
                    {vg.variants.map((v) => (
                      <span key={v.name} className="chip text-[11px]">
                        "{v.name}" ({v.count})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {vg.variants
                    .filter((v) => v.name !== vg.canonical)
                    .map((v) => (
                      <button
                        key={v.name}
                        type="button"
                        disabled={standardizing}
                        onClick={() => handleStandardize(v.name, vg.canonical)}
                        className="btn-secondary btn-sm text-xs"
                      >
                        Merge "{v.name}" → "{vg.canonical}"
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Company-Wise Alumni Breakdown & Admin Audit Log */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="card p-5">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span>Company Directory ({selectedYear === 'all' ? 'All Batches' : `Class of ${selectedYear}`})</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {summary.companyCounts?.length || 0} organizations hiring KKWAGH alumni
              </p>
            </div>

            {/* Dropdown filter option in Company Directory */}
            <div className="flex items-center gap-2">
              <label htmlFor="company-directory-select" className="text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                Company:
              </label>
              <select
                id="company-directory-select"
                value={selectedCompany}
                onChange={(e) => {
                  setSelectedCompany(e.target.value);
                  if (e.target.value !== 'all') setShowAllCompanies(true);
                }}
                className="input py-1 px-2.5 text-xs font-medium rounded-lg h-8 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 min-w-[170px] max-w-[240px] truncate"
              >
                <option value="all">All Companies ({summary.companyCounts?.length || 0})</option>
                <optgroup label="Main Hiring Companies">
                  {summary.companyCounts?.slice(0, 15).map((c) => (
                    <option key={c.company} value={c.company}>
                      {c.company} ({c.count})
                    </option>
                  ))}
                </optgroup>
                {summary.companyCounts?.length > 15 && (
                  <optgroup label="All Other Companies">
                    {summary.companyCounts?.slice(15).map((c) => (
                      <option key={c.company} value={c.company}>
                        {c.company} ({c.count})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              {selectedCompany !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCompany('all');
                    setShowAllCompanies(false);
                  }}
                  className="btn-secondary btn-sm py-1 px-2 text-xs flex items-center gap-1"
                  title="Show main companies"
                >
                  <X className="h-3 w-3" />
                  <span>All</span>
                </button>
              )}
            </div>
          </div>

          {(() => {
            const MAIN_COMPANIES_LIMIT = 15;
            const filteredCompanies = (summary.companyCounts || []).filter((c) =>
              selectedCompany === 'all' ? true : c.company === selectedCompany
            );
            const isSingleSelection = selectedCompany !== 'all';
            const displayedCompanies = isSingleSelection || showAllCompanies
              ? filteredCompanies
              : filteredCompanies.slice(0, MAIN_COMPANIES_LIMIT);
            const hasMore = !isSingleSelection && filteredCompanies.length > MAIN_COMPANIES_LIMIT;

            return (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="py-2.5 px-3">Company</th>
                        <th className="py-2.5 px-3 text-right">Alumni Count</th>
                        <th className="py-2.5 px-3 text-right">Directory Filter</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {displayedCompanies.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-xs text-slate-400">
                            No alumni found matching "{selectedCompany}".
                          </td>
                        </tr>
                      ) : (
                        displayedCompanies.map((c) => (
                          <tr key={c.company} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                              {c.company === 'Company Not Specified' ? (
                                <span className="text-amber-600 dark:text-amber-400 italic">Company Not Specified</span>
                              ) : (
                                c.company
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-teal-600 dark:text-teal-400">
                              {c.count}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {c.company !== 'Company Not Specified' && (
                                <Link
                                  to={`/alumni?company=${encodeURIComponent(c.company)}`}
                                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                                >
                                  View in directory →
                                </Link>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Show All / Show Less Toggle Button */}
                {hasMore && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {showAllCompanies
                        ? `Showing all ${filteredCompanies.length} companies`
                        : `Showing main ${displayedCompanies.length} of ${filteredCompanies.length} companies`}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAllCompanies((prev) => !prev)}
                      className="btn-secondary btn-sm text-xs font-semibold flex items-center gap-1.5 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 border-brand-200 dark:border-brand-800/60"
                    >
                      {showAllCompanies ? (
                        <>
                          <ChevronUp className="h-3.5 w-3.5" />
                          <span>Show Main 15 Companies</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3.5 w-3.5" />
                          <span>Show All ({filteredCompanies.length} Companies)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Administrative Audit History */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="h-4 w-4 text-slate-400" />
            Administrative Change Log
          </h3>
          <p className="text-xs text-slate-400">
            Immutable audit history for dataset cleanups and standardizations. Zero contact details are logged.
          </p>

          {summary.recentAuditLogs?.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No administrative changes recorded yet.</p>
          ) : (
            <ul className="space-y-3 text-xs">
              {summary.recentAuditLogs?.map((log) => (
                <li key={log._id} className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{log.details}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    By {log.adminEmail} · {timeAgo(log.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Dataset Synchronization & Safe Cleanup Modal */}
      <Modal
        open={cleanupModalOpen}
        onClose={() => setCleanupModalOpen(false)}
        title="Dataset Synchronization & Safe Cleanup"
        size="lg"
        footer={<>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setCleanupModalOpen(false)}
          >
            Close
          </button>
          {dryRunData?.obsoleteSampleCount > 0 && !cleanupResult && (
            <button
              type="button"
              disabled={executingCleanup}
              onClick={handleExecuteCleanup}
              className="btn-danger flex items-center gap-1.5"
            >
              {executingCleanup ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
              Create Disk Backup & Clean {dryRunData.obsoleteSampleCount} Obsolete Records
            </button>
          )}
        </>}
      >
        <div className="space-y-4 text-sm">
          {/* Account Protection Shield */}
          <div className="rounded-lg p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200">
              <p className="font-bold">Strict Account Protection Policy Active</p>
              <p className="mt-0.5">
                All Administrator accounts ({dryRunData?.protectedAccountsSummary?.administrators ?? '...'} accounts),
                Faculty Guide accounts ({dryRunData?.protectedAccountsSummary?.facultyGuides ?? '...'} accounts), and
                Student accounts ({dryRunData?.protectedAccountsSummary?.students ?? '...'} accounts) are permanently exempt from cleanup.
              </p>
            </div>
          </div>

          {dryRunLoading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
              <p className="text-xs text-slate-500">Scanning database against latest 48-alumni dataset...</p>
            </div>
          ) : cleanupResult ? (
            <div className="p-4 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 space-y-2">
              <p className="font-bold text-sm">Cleanup Executed Successfully</p>
              <p className="text-xs">{cleanupResult.message}</p>
              <p className="text-xs font-mono bg-teal-100/70 dark:bg-teal-900/60 p-2 rounded">
                Backup file created: backend/backups/{cleanupResult.backupFile}
              </p>
              <p className="text-xs text-teal-700 dark:text-teal-300">
                {cleanupResult.retainedCount} legitimate alumni profiles retained in database.
              </p>
            </div>
          ) : dryRunData ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] uppercase text-slate-400">Dataset Records</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{dryRunData.sourceDatasetCount}</p>
                </div>
                <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] uppercase text-slate-400">Database Alumni</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{dryRunData.databaseAlumniCount}</p>
                </div>
                <div className="p-2.5 rounded bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
                  <p className="text-[10px] uppercase text-teal-600 dark:text-teal-400">Retained Alumni</p>
                  <p className="text-lg font-bold text-teal-700 dark:text-teal-300">{dryRunData.retainedCount}</p>
                </div>
                <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <p className="text-[10px] uppercase text-amber-600 dark:text-amber-400">Obsolete Mock Samples</p>
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{dryRunData.obsoleteSampleCount}</p>
                </div>
              </div>

              {dryRunData.obsoleteSampleCount === 0 ? (
                <div className="p-4 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-center">
                  <Check className="h-6 w-6 text-teal-600 mx-auto mb-1" />
                  <p className="font-bold text-sm">Database is 100% in Sync</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    No legacy mock seed samples (@alumniconnect.edu) exist. All database alumni match the institutional dataset.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Targeted Obsolete Mock Sample Records for Safe Removal:
                  </p>
                  <div className="max-h-56 overflow-y-auto rounded border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                    {dryRunData.obsoleteSampleProfiles.map((p) => (
                      <div key={p.id} className="p-2 text-xs flex items-center justify-between bg-white dark:bg-slate-900">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</p>
                          <p className="text-slate-400 text-[11px]">{p.email} · {p.company} (Class of {p.graduationYear})</p>
                        </div>
                        <span className="badge bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px]">
                          Legacy Mock
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Executing cleanup creates a timestamped JSON backup in <code className="text-slate-600 dark:text-slate-300">backend/backups/</code> before deletion and logs an administrative audit entry.
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}

function Overview({ onGo }) {
  const { data, loading, error, reload } = useFetch('/admin/stats');
  if (loading && !data) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 min-w-0">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const s = data.data;

  return (
    <div className="space-y-8">
      {/* Platform KPI Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 min-w-0">
        <StatCard
          icon={Users}
          label="Total Users"
          value={s.users.total}
          sub={`${s.users.students} students · ${s.users.alumni} alumni`}
          tone="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300"
        />
        <StatCard
          icon={BadgeCheck}
          label="Verified Alumni"
          value={s.alumniProfiles.verified}
          sub={`${s.alumniProfiles.rejected} rejected`}
          tone="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300"
        />
        <button className="text-left min-w-0 block w-full" onClick={() => onGo('verify')}>
          <StatCard
            icon={ShieldAlert}
            label="Pending Verification"
            value={s.alumniProfiles.pending}
            sub="Click to review"
            tone="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300"
          />
        </button>
        <button className="text-left min-w-0 block w-full" onClick={() => onGo('reports')}>
          <StatCard
            icon={Flag}
            label="Open Reports"
            value={s.openReports}
            sub="Click to review"
            tone="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300"
          />
        </button>
        <button className="text-left min-w-0 block w-full" onClick={() => onGo('qa')}>
          <StatCard
            icon={HelpCircle}
            label="Q&A Forum"
            value={s.qa?.questions ?? 0}
            sub={`${s.qa?.answers ?? 0} answers posted`}
            tone="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300"
          />
        </button>
        <button className="text-left min-w-0 block w-full" onClick={() => onGo('recovery')}>
          <StatCard
            icon={KeyRound}
            label="Password Recovery"
            value={s.pendingRecoveryRequests ?? 0}
            sub="Review pending requests"
            tone="bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300"
          />
        </button>
        <StatCard
          icon={BriefcaseBusiness}
          label="Active Opportunities"
          value={s.jobs.active}
          sub={`${s.jobs.total} total · ${s.jobs.internships} internships`}
          tone="bg-navy-50 dark:bg-navy-950/40 text-navy-700 dark:text-navy-300"
        />
        <StatCard
          icon={UserCheck}
          label="Connections"
          value={s.engagement.connections}
          sub="Accepted"
          tone="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300"
        />
        <StatCard
          icon={HandHeart}
          label="Mentorship Requests"
          value={s.engagement.mentorshipRequests}
          tone="bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300"
        />
      </div>

      {/* Institutional Alumni Reports, Quality Center & Safe Data Cleanup */}
      <AlumniReportsAndQuality onRefreshOverview={reload} />

      {/* Distribution Analytics Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <BarList title="Top Companies" rows={s.topCompanies} />
        <BarList title="Top Domains" rows={s.topDomains} />
        <BarList
          title="Alumni by Graduation Year"
          rows={s.alumniByYear.map((y) => ({ name: String(y.year), count: y.count }))}
        />
      </div>
    </div>
  );
}

function VerifyAlumni() {
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const { data, loading, error, reload } = useFetch('/admin/alumni', { status });
  const [rejecting, setRejecting] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');

  const act = async (p, newStatus, noteText) => {
    setBusy(p._id);
    try {
      await api.put(`/admin/alumni/${p._id}/verify`, { status: newStatus, note: noteText });
      toast.success(`${p.fullName} ${newStatus}`);
      setRejecting(null);
      setNote('');
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy('');
    }
  };
  const list = data?.data || [];

  return (
    <>
      <div className="mb-4 flex gap-2">
        {['pending', 'verified', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`chip capitalize ${status === s ? '!bg-navy-800 !text-white' : 'hover:bg-navy-100 dark:hover:bg-navy-900'}`}
          >
            {s}
          </button>
        ))}
      </div>
      {loading && !data ? <PageLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : list.length === 0 ? (
        <EmptyState icon={BadgeCheck} title={`No ${status} profiles`} message={status === 'pending' ? 'You are all caught up.' : undefined} />
      ) : (
        <ul className="space-y-3">
          {list.map((p) => (
            <li key={p._id} className="card flex flex-wrap items-start gap-4 p-5">
              <Avatar name={p.fullName} src={p.profilePhoto} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/alumni/${p._id}`} className="font-display font-bold text-navy-950 dark:text-white hover:text-brand-700">
                    {p.fullName}
                  </Link>
                  <StatusBadge status={p.verificationStatus} />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {p.currentJobTitle} at <b>{p.currentCompany}</b> · {p.professionalDomain}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {p.department} · {p.degree} · Class of {p.graduationYear} · {p.email}
                </p>
                {p.bio && <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{p.bio}</p>}
                {p.verificationNote && <p className="mt-1 text-xs italic text-slate-400">Note: {p.verificationNote}</p>}
                <div className="mt-2 flex gap-3 text-xs">
                  {p.linkedinUrl && (
                    <a className="font-semibold text-brand-700 dark:text-brand-400 hover:underline" href={p.linkedinUrl} target="_blank" rel="noreferrer noopener">
                      LinkedIn
                    </a>
                  )}
                  <Link className="font-semibold text-brand-700 dark:text-brand-400 hover:underline" to={`/alumni/${p._id}`}>
                    Full profile
                  </Link>
                </div>
              </div>
              <div className="flex gap-2">
                {p.verificationStatus !== 'verified' && (
                  <button className="btn-accent btn-sm" disabled={busy === p._id} onClick={() => act(p, 'verified')}>
                    {busy === p._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Verify
                  </button>
                )}
                {p.verificationStatus !== 'rejected' && (
                  <button className="btn-secondary btn-sm" disabled={busy === p._id} onClick={() => setRejecting(p)}>
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        title={`Reject ${rejecting?.fullName}`}
        footer={<>
          <button className="btn-secondary" onClick={() => setRejecting(null)}>Cancel</button>
          <button className="btn-danger" disabled={!note.trim() || !!busy} onClick={() => act(rejecting, 'rejected', note)}>Reject profile</button>
        </>}
      >
        <Field label="Reason (sent to the alumnus)">
          <textarea
            className="input min-h-[100px]"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. We couldn't match your graduation record."
          />
        </Field>
      </Modal>
    </>
  );
}

function ManageUsers() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [page, setPage] = useState(1);
  const [busyUser, setBusyUser] = useState('');
  const { data, loading, error, reload } = useFetch('/admin/users', {
    page,
    limit: 12,
    ...(q && { q }),
    ...(role && { role }),
    ...(verificationStatus && { verificationStatus }),
  });
  const users = data?.data || [];

  const toggle = async (u) => {
    try {
      await api.put(`/admin/users/${u._id}`, { status: u.status === 'active' ? 'suspended' : 'active' });
      toast.success(u.status === 'active' ? `${u.name} suspended` : `${u.name} reactivated`);
      reload();
    } catch (e) { toast.error(errorMessage(e)); }
  };
  const remove = async (u) => {
    if (!window.confirm(`Permanently delete ${u.name} and all their data? This cannot be undone.`)) return;
    try { await api.delete(`/admin/users/${u._id}`); toast.success('User deleted'); reload(); } catch (e) { toast.error(errorMessage(e)); }
  };

  const handleVerify = async (u, status) => {
    setBusyUser(u._id);
    try {
      await api.put(`/admin/users/${u._id}/verify`, { status });
      toast.success(`${u.name} verification set to ${status}`);
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusyUser('');
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row flex-wrap">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search name or email…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Search users" />
        </div>
        <select className="input sm:w-44" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label="Filter by role">
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="alumni">Alumni</option>
          <option value="teacher">Faculty Guides</option>
          <option value="admin">Admins</option>
        </select>
        <select className="input sm:w-44" value={verificationStatus} onChange={(e) => { setVerificationStatus(e.target.value); setPage(1); }} aria-label="Filter by verification">
          <option value="">All verifications</option>
          <option value="pending">Pending verification</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      {loading && !data ? <PageLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : users.length === 0 ? <EmptyState icon={Users} title="No users found" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} size="sm" />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{u.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-700 dark:text-slate-300">{u.role}</td>
                  <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.verificationStatus || (u.isVerified ? 'verified' : 'pending')} />
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    {u.role !== 'admin' && (
                      <div className="flex items-center justify-end gap-1.5">
                        {u.verificationStatus !== 'verified' && (
                          <button
                            className="btn-accent btn-sm !px-2"
                            disabled={busyUser === u._id}
                            onClick={() => handleVerify(u, 'verified')}
                            title="Verify and approve user"
                          >
                            <Check className="h-3 w-3" /> Approve
                          </button>
                        )}
                        {u.verificationStatus !== 'rejected' && (
                          <button
                            className="btn-secondary btn-sm !px-2"
                            disabled={busyUser === u._id}
                            onClick={() => handleVerify(u, 'rejected')}
                            title="Reject user"
                          >
                            <X className="h-3 w-3" /> Reject
                          </button>
                        )}
                        <button className="btn-secondary btn-sm !px-2" onClick={() => toggle(u)}>
                          {u.status === 'active' ? <UserX className="h-3.5 w-3.5" title="Suspend" /> : <UserCheck className="h-3.5 w-3.5" title="Activate" />}
                        </button>
                        <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 !px-2" onClick={() => remove(u)} aria-label={`Delete ${u.name}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={data?.page || 1} pages={data?.pages || 1} onChange={setPage} />
    </>
  );
}

function Reports() {
  const toast = useToast();
  const [status, setStatus] = useState('open');
  const { data, loading, error, reload } = useFetch('/admin/reports', { status });
  const list = data?.data || [];

  const resolve = async (r, s) => {
    try { await api.put(`/admin/reports/${r._id}`, { status: s }); toast.success(`Report ${s}`); reload(); } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <>
      <div className="mb-4 flex gap-2">
        {['open', 'resolved', 'dismissed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`chip capitalize ${status === s ? '!bg-navy-800 !text-white' : 'hover:bg-navy-100 dark:hover:bg-navy-900'}`}
          >
            {s}
          </button>
        ))}
      </div>
      {loading && !data ? <PageLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : list.length === 0 ? <EmptyState icon={Flag} title={`No ${status} reports`} /> : (
        <ul className="space-y-3">
          {list.map((r) => (
            <li key={r._id} className="card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge bg-slate-100 dark:bg-slate-800 capitalize text-slate-600 dark:text-slate-300">
                  {r.targetType.replace('_', ' ')}
                </span>
                <StatusBadge status={r.status} />
                <span className="text-xs text-slate-400">{timeAgo(r.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{r.targetLabel}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">“{r.reason}”</p>
              <p className="mt-1 text-xs text-slate-400">Reported by {r.reporter?.name}</p>
              {r.status === 'open' && (
                <div className="mt-3 flex gap-2">
                  <button className="btn-accent btn-sm" onClick={() => resolve(r, 'resolved')}>Mark resolved</button>
                  <button className="btn-secondary btn-sm" onClick={() => resolve(r, 'dismissed')}>Dismiss</button>
                  {r.targetType === 'alumni_profile' && <Link className="btn-ghost btn-sm" to={`/alumni/${r.targetId}`}>Open profile</Link>}
                  {r.targetType === 'question' && <Link className="btn-ghost btn-sm" to={`/qa/${r.targetId}`}>Open question</Link>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function AdminQA() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/qa/questions', { limit: 50 });
  const list = data?.data || [];

  const toggleHide = async (q) => {
    try {
      await api.put(`/qa/questions/${q._id}/moderate`, { isHidden: !q.isHidden });
      toast.success(q.isHidden ? 'Question unhidden' : 'Question hidden');
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const remove = async (q) => {
    if (!window.confirm(`Delete question "${q.title}"?`)) return;
    try {
      await api.delete(`/qa/questions/${q._id}`);
      toast.success('Question deleted');
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (list.length === 0) return <EmptyState icon={HelpCircle} title="No questions posted yet" />;

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3">Question</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Author</th>
            <th className="px-4 py-3">Answers</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Posted</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {list.map((q) => (
            <tr key={q._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
              <td className="px-4 py-3 max-w-xs">
                <Link to={`/qa/${q._id}`} className="font-semibold text-slate-900 dark:text-white hover:text-brand-600 line-clamp-1">
                  {q.title}
                </Link>
                {q.isHidden && (
                  <span className="inline-block rounded bg-red-100 dark:bg-red-950 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-300">
                    Hidden by mod
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{q.category}</td>
              <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{q.author?.name}</td>
              <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{q.answersCount || 0}</td>
              <td className="px-4 py-3"><StatusBadge status={q.status} /></td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(q.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => toggleHide(q)}
                    className="btn-ghost btn-sm text-slate-600 dark:text-slate-300"
                    title={q.isHidden ? 'Unhide' : 'Hide'}
                  >
                    {q.isHidden ? 'Unhide' : 'Hide'}
                  </button>
                  <button
                    onClick={() => remove(q)}
                    className="btn-ghost btn-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminJobs() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/admin/jobs');
  const list = data?.data || [];
  const remove = async (j) => {
    if (!window.confirm(`Delete "${j.title}"?`)) return;
    try { await api.delete(`/jobs/${j._id}`); toast.success('Deleted'); reload(); } catch (e) { toast.error(errorMessage(e)); }
  };
  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (list.length === 0) return <EmptyState icon={BriefcaseBusiness} title="No jobs posted yet" />;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3">Opportunity</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Posted by</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Posted</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {list.map((j) => (
            <tr key={j._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
              <td className="px-4 py-3">
                <p className="font-semibold text-slate-900 dark:text-white">{j.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{j.company}{j.location ? ` · ${j.location}` : ''}</p>
              </td>
              <td className="px-4 py-3 capitalize text-slate-700 dark:text-slate-300">{j.type}</td>
              <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{j.postedBy?.name}</td>
              <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(j.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40" onClick={() => remove(j)} aria-label={`Delete ${j.title}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PasswordRecoveryAdmin({ onRefreshCounts }) {
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch('/admin/recovery-requests', { status, page, limit: 20 });
  const requests = data?.data || [];

  const [selectedReq, setSelectedReq] = useState(null);
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Credential presentation modal after approval
  const [credentialModal, setCredentialModal] = useState({
    open: false,
    credential: '',
    userName: '',
    userEmail: '',
    expiresAt: null,
  });
  const [copied, setCopied] = useState(false);

  const handleOpenApprove = (req) => {
    setSelectedReq(req);
    setApproveModal(true);
  };

  const handleOpenReject = (req) => {
    setSelectedReq(req);
    setRejectReason('');
    setRejectModal(true);
  };

  const handleApprove = async () => {
    if (!selectedReq) return;
    setProcessing(true);
    try {
      const res = await api.put(`/admin/recovery-requests/${selectedReq._id}/approve`);
      toast.success(res.data.message || 'Request approved successfully');
      setApproveModal(false);
      setCredentialModal({
        open: true,
        credential: res.data.temporaryCredential,
        userName: res.data.user?.name || selectedReq.name,
        userEmail: res.data.user?.email || selectedReq.email,
        expiresAt: res.data.expiresAt,
      });
      reload();
      if (onRefreshCounts) onRefreshCounts();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to approve password recovery request'));
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;
    setProcessing(true);
    try {
      const res = await api.put(`/admin/recovery-requests/${selectedReq._id}/reject`, {
        reason: rejectReason.trim() || 'Institutional identification could not be validated',
      });
      toast.success(res.data.message || 'Request rejected');
      setRejectModal(false);
      reload();
      if (onRefreshCounts) onRefreshCounts();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to reject request'));
    } finally {
      setProcessing(false);
    }
  };

  const copyCredential = () => {
    if (!credentialModal.credential) return;
    navigator.clipboard.writeText(credentialModal.credential);
    setCopied(true);
    toast.success('Temporary credential copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'approved', 'completed', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`chip capitalize text-xs font-semibold ${
                status === s ? '!bg-navy-800 !text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button onClick={reload} className="btn-secondary btn-sm self-start sm:self-auto" title="Refresh">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {loading && !data ? (
        <PageLoader />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title={`No ${status === 'all' ? '' : status} recovery requests`}
          message="Student or faculty members requesting administrator-assisted password recovery will appear here."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">User & Institutional Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Reason / Context</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Administrative Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {requests.map((req) => (
                <tr key={req._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {req.user?.name || req.name || 'KKWAGH User'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {req.user?.email || req.email}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge bg-slate-100 dark:bg-slate-800 capitalize text-slate-700 dark:text-slate-300">
                      {req.role || req.user?.role || 'student'}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {req.reason || 'Requested account recovery'}
                    </p>
                    {req.rejectedReason && req.status === 'rejected' && (
                      <p className="text-[11px] text-rose-500 mt-0.5">Reason: {req.rejectedReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                    {timeAgo(req.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        req.status === 'pending'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : req.status === 'approved'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          : req.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {req.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenApprove(req)}
                          className="btn-primary btn-sm !py-1 text-xs"
                        >
                          Approve & Generate
                        </button>
                        <button
                          onClick={() => handleOpenReject(req)}
                          className="btn-ghost btn-sm !py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          Reject
                        </button>
                      </div>
                    ) : req.status === 'approved' ? (
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Credential Issued · Awaiting Sign In
                      </span>
                    ) : req.status === 'completed' ? (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Password Reset Completed
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Rejected</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={data?.page || 1} pages={data?.pages || 1} onChange={setPage} />

      {/* Approve Confirmation Modal */}
      <Modal
        open={approveModal}
        onClose={() => !processing && setApproveModal(false)}
        title="Approve Password Recovery"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            You are about to approve the account recovery request for:
          </p>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900/70 p-3 border border-slate-200 dark:border-slate-800 text-sm">
            <p className="font-semibold text-slate-900 dark:text-white">
              {selectedReq?.user?.name || selectedReq?.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{selectedReq?.email}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Role: {selectedReq?.role || 'student'}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic">
              "{selectedReq?.reason || 'Account recovery'}"
            </p>
          </div>
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3 text-xs text-amber-800 dark:text-amber-200">
            <strong>Security Notice:</strong> Approving this request generates a secure temporary credential and flags the account to mandate an immediate password reset upon login. The previous password will no longer work.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setApproveModal(false)}
              className="btn-secondary btn-sm"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApprove}
              className="btn-primary btn-sm"
              disabled={processing}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm & Generate Credential'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={rejectModal}
        onClose={() => !processing && setRejectModal(false)}
        title="Reject Password Recovery Request"
      >
        <form onSubmit={handleReject} className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Reject recovery request for <strong className="text-slate-900 dark:text-white">{selectedReq?.email}</strong>.
          </p>
          <Field label="Rejection Reason" required>
            <textarea
              className="input text-sm min-h-[90px]"
              placeholder="e.g. Identity verification could not be confirmed via department records."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRejectModal(false)}
              className="btn-secondary btn-sm"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-danger btn-sm bg-rose-600 hover:bg-rose-700 text-white"
              disabled={processing}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Generated Temporary Credential Presentation Modal */}
      <Modal
        open={credentialModal.open}
        onClose={() => setCredentialModal({ ...credentialModal, open: false })}
        title="Temporary Credential Generated"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-3 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-semibold">Request Approved Successfully</p>
              <p className="mt-0.5">
                The account for <strong>{credentialModal.userName}</strong> ({credentialModal.userEmail}) has been assigned this temporary credential.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Temporary Credential (One-Time Use)
            </label>
            <div className="flex items-center gap-2 rounded-lg bg-slate-900 p-3 text-white border border-slate-700 font-mono text-base">
              <span className="flex-1 font-bold tracking-wide select-all text-teal-400">
                {credentialModal.credential}
              </span>
              <button
                type="button"
                onClick={copyCredential}
                className="btn-ghost btn-sm text-slate-300 hover:text-white"
                title="Copy Credential"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                <span className="text-xs ml-1">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 p-3 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
            <p className="font-semibold text-slate-800 dark:text-slate-200">Administrative Instructions:</p>
            <p>1. Securely deliver this temporary credential to the student or faculty member (in person or via verified department channel).</p>
            <p>2. The user will be required to configure their new permanent password immediately upon signing in.</p>
            <p>3. This credential is valid for 48 hours and can only be used once.</p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setCredentialModal({ ...credentialModal, open: false })}
              className="btn-primary btn-sm"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('overview');
  const pending = useFetch('/admin/alumni', { status: 'pending' });
  const open = useFetch('/admin/reports', { status: 'open' });
  const recovery = useFetch('/admin/recovery-requests', { status: 'pending' });

  return (
    <div className="page">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Verify alumni, monitor institutional quality, manage password recovery, and oversee platform security."
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'overview', label: 'Overview & Reports' },
          {
            value: 'recovery',
            label: 'Password Recovery',
            count: recovery.data?.total ?? recovery.data?.pendingCount,
          },
          { value: 'verify', label: 'Verify alumni', count: pending.data?.data?.length },
          { value: 'users', label: 'Users' },
          { value: 'reports', label: 'Reports', count: open.data?.data?.length },
          { value: 'qa', label: 'Q&A Forum' },
          { value: 'jobs', label: 'Jobs' },
        ]}
      />
      {tab === 'overview' && <Overview onGo={setTab} />}
      {tab === 'recovery' && <PasswordRecoveryAdmin onRefreshCounts={recovery.reload} />}
      {tab === 'verify' && <VerifyAlumni />}
      {tab === 'users' && <ManageUsers />}
      {tab === 'reports' && <Reports />}
      {tab === 'qa' && <AdminQA />}
      {tab === 'jobs' && <AdminJobs />}
    </div>
  );
}
