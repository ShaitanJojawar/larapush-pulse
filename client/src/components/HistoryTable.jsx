import React, { useState } from 'react';
import { History, Globe, CheckCircle2, Clock, XCircle, ExternalLink, RefreshCw, Eye, Tag, Layers, MousePointerClick, Trash2 } from 'lucide-react';
import Youtube from './YoutubeIcon';
import { api } from '../services/api';

export default function HistoryTable({ history, projects, activeProject, onRefresh }) {
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const filteredHistory = (history || []).filter(item => {
    if (!activeProject || activeProject === 'all') return true;
    const itemProj = item.projectId || item.project_id;
    return itemProj === activeProject || itemProj === 'all';
  });

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete campaign "${title || id}" from history?`)) return;
    setDeletingId(id);
    try {
      const res = await api.deleteNotification(id);
      if (res.success) {
        if (onRefresh) onRefresh();
      } else {
        alert('Failed to delete campaign: ' + res.error);
      }
    } catch (err) {
      alert('Error deleting campaign: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearHistory = async () => {
    const projLabel = activeProject === 'all' ? 'ALL projects' : `project "${activeProject}"`;
    if (!window.confirm(`Are you sure you want to clear broadcast campaign history for ${projLabel}? This action cannot be undone.`)) return;
    try {
      const res = await api.clearHistory(activeProject);
      if (res.success) {
        if (onRefresh) onRefresh();
      } else {
        alert('Failed to clear history: ' + res.error);
      }
    } catch (err) {
      alert('Error clearing history: ' + err.message);
    }
  };

  return (
    <div className="bg-[#12141d]/90 border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Broadcast Campaign History</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {filteredHistory.length} Sent
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Audit log of all sent notifications segmented by project and notification type.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {filteredHistory.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="text-xs px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition flex items-center gap-1.5 font-semibold cursor-pointer"
              title="Clear all campaigns for this project"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition cursor-pointer"
            title="Refresh history"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Project & Type</th>
              <th className="py-3 px-4">Campaign Title & Body</th>
              <th className="py-3 px-4">FCM Delivery</th>
              <th className="py-3 px-4">Action Buttons</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-300">No push history found</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Send a notification campaign for this project from the composer.
                  </p>
                </td>
              </tr>
            ) : (
              filteredHistory.map((item, idx) => {
                const isYouTube = item.metadata?.isYouTube || /youtube\.com|youtu\.be/i.test(item.clickUrl || '');
                const formattedDate = item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'N/A';

                return (
                  <tr key={item.id || item._id || idx} className="hover:bg-slate-850/50 transition">
                    {/* Project & Type */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="font-bold text-slate-200 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate max-w-[130px]">{item.projectName || item.project_name || 'All Projects'}</span>
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                          {item.notificationType || item.notification_type || 'Broadcast'}
                        </span>
                      </div>
                    </td>

                    {/* Title & Body */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-200 line-clamp-1">{item.title}</div>
                      <div className="text-slate-400 text-[11px] line-clamp-1 mt-0.5">{item.body}</div>
                    </td>

                    {/* Recipients & Delivery */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-emerald-400">10M Fan-out</span>
                        <span className="text-slate-500 block text-[10px]">Topic: {item.topic || 'all_users'}</span>
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4">
                      {item.action1Title ? (
                        <span className="text-[10px] font-semibold bg-indigo-950/60 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                          {item.action1Title} {item.action2Title ? `+ ${item.action2Title}` : ''}
                        </span>
                      ) : item.clickUrl ? (
                        <a
                          href={item.clickUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-400 text-[11px] truncate max-w-[120px]"
                        >
                          <span className="truncate">{item.clickUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {item.status === 'sent' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Sent</span>
                        </span>
                      )}
                      {item.status === 'scheduled' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          <span>Scheduled</span>
                        </span>
                      )}
                      {item.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          <XCircle className="w-3 h-3" />
                          <span>Failed</span>
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-400">
                      {formattedDate}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedNotification(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                          title="View payload & stats"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id || item._id, item.title)}
                          disabled={deletingId === (item.id || item._id)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer disabled:opacity-50"
                          title="Delete campaign"
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

      {/* Details Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161824] border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Campaign Delivery Audit</h3>
            <p className="text-xs text-slate-400 mb-4">{selectedNotification.title}</p>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Target Topic</span>
                <code className="text-emerald-400 font-mono font-bold">{selectedNotification.topic || 'all_users'}</code>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Google FCM Message ID</span>
                <code className="text-slate-300 font-mono break-all text-[11px]">{selectedNotification.fcmMessageId || 'N/A'}</code>
              </div>

              {selectedNotification.clickUrl && (
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Click URL</span>
                  <a href={selectedNotification.clickUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline break-all font-mono">
                    {selectedNotification.clickUrl}
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
