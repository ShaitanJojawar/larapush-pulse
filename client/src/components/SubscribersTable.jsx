import React, { useState } from 'react';
import { Search, Globe, Smartphone, Apple, Copy, Check, Trash2, Send, RefreshCw, UserPlus, Layers, Download } from 'lucide-react';
import YoutubeIcon from './YoutubeIcon';
import { api } from '../services/api';

export default function SubscribersTable({ subscribers, projects, activeProject, onSelectProject, onRefresh, onSendTestPush }) {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [copiedToken, setCopiedToken] = useState(null);
  const [deletingToken, setDeletingToken] = useState(null);

  const handleCopy = (token) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleDelete = async (token) => {
    if (!window.confirm('Are you sure you want to remove this subscriber token?')) return;
    setDeletingToken(token);
    try {
      await api.deleteSubscriber(token);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Failed to delete subscriber: ' + err.message);
    } finally {
      setDeletingToken(null);
    }
  };

  const handleExportCSV = () => {
    if (!filtered || filtered.length === 0) {
      alert('No subscribers to export.');
      return;
    }

    const headers = ['Token', 'Project ID', 'Project Name', 'Platform', 'Type', 'Created At'];
    const rows = filtered.map(s => [
      `"${(s.token || '').replace(/"/g, '""')}"`,
      `"${s.projectId || s.project_id || ''}"`,
      `"${(s.projectName || s.project_name || '').replace(/"/g, '""')}"`,
      `"${s.platform || 'web'}"`,
      `"${s.type || 'website'}"`,
      `"${s.createdAt || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `push_subscribers_${activeProject || 'all'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddDemoSubscriber = async () => {
    const randomToken = `fcm_demo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const targetProject = activeProject && activeProject !== 'all' ? activeProject : 'ss-banna-jojawar';
    const proj = (projects || []).find(p => (p.id || p.project_id) === targetProject);

    await api.subscribe({
      token: randomToken,
      projectId: targetProject,
      projectName: proj?.name || proj?.project_name || 'SS Banna Jojawar',
      type: proj?.type || 'youtube',
      platform: 'web',
      createdAt: new Date().toISOString()
    });
    if (onRefresh) onRefresh();
  };

  const filtered = (subscribers || []).filter((sub) => {
    const matchPlatform = platformFilter === 'all' || sub.platform === platformFilter;
    const subProjId = sub.projectId || sub.project_id;
    const matchProject =
      !activeProject ||
      activeProject === 'all' ||
      subProjId === activeProject ||
      (Array.isArray(sub.subscribed_projects) && sub.subscribed_projects.includes(activeProject));

    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      sub.token?.toLowerCase().includes(q) ||
      sub.projectName?.toLowerCase().includes(q) ||
      sub.project_name?.toLowerCase().includes(q) ||
      sub.platform?.toLowerCase().includes(q);

    return matchPlatform && matchProject && matchSearch;
  });

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'android':
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case 'ios':
        return <Apple className="w-4 h-4 text-rose-400" />;
      case 'web':
      default:
        return <Globe className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="bg-[#12141d]/90 border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
      {/* Table Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Push Subscribers Directory</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {filtered.length} Saved in Firestore
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Firestore collection: <code>subscribers</code> (Token, Project Name, Type, Platform, Date)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Export filtered subscribers to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleAddDemoSubscriber}
            className="text-xs font-medium px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
            <span>+ Demo Subscriber</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 py-4">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <input
            type="text"
            placeholder="Search token, project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        {/* Project & Platform Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Project Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={activeProject || 'all'}
              onChange={(e) => onSelectProject && onSelectProject(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium py-1"
            >
              <option value="all" className="bg-slate-900">All Projects</option>
              {(projects || []).map(p => {
                const pid = p.id || p.project_id;
                return (
                  <option key={pid} value={pid} className="bg-slate-900">
                    {p.name || p.project_name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Platform Tabs */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {['all', 'web', 'android', 'ios'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatformFilter(p)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition ${
                  platformFilter === p
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Project Name & Type</th>
              <th className="py-3 px-4">FCM Registration Token</th>
              <th className="py-3 px-4">Platform</th>
              <th className="py-3 px-4">Subscribed Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <div className="max-w-xs mx-auto">
                    <Globe className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-300">No subscribers yet</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Open the Client Demo page to subscribe to a YouTube channel or website.
                    </p>
                    <div className="mt-4 flex justify-center gap-2">
                      <a
                        href="/demo"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition"
                      >
                        Open Client Demo
                      </a>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((sub) => {
                const subToken = sub.token;
                const isCopied = copiedToken === subToken;
                const formattedDate = sub.createdAt
                  ? new Date(sub.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Just now';

                const isYt = sub.type === 'youtube';
                const projName = sub.projectName || sub.project_name || 'SS Banna Jojawar';

                return (
                  <tr key={subToken} className="hover:bg-slate-850/50 transition group">
                    {/* Project Name & Type */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-2">
                        {isYt ? (
                          <div className="w-6 h-6 rounded bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                            <YoutubeIcon className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                            <Globe className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-slate-200 block">{projName}</span>
                          <span className="text-[10px] text-slate-400 font-mono capitalize">{sub.type || 'youtube'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Token */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800 max-w-[200px] truncate">
                          {subToken}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(subToken)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                          title="Copy full token"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Platform */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 font-medium capitalize text-slate-200">
                        {getPlatformIcon(sub.platform)}
                        <span>{sub.platform || 'web'}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-400">
                      {formattedDate}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onSendTestPush && (
                          <button
                            type="button"
                            onClick={() => onSendTestPush(subToken)}
                            className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition"
                            title="Send test push to this token"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={deletingToken === subToken}
                          onClick={() => handleDelete(subToken)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition"
                          title="Delete subscriber"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
