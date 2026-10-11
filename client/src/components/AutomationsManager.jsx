import React, { useState, useEffect } from 'react';
import { Zap, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, Radio, ExternalLink, Play } from 'lucide-react';
import { api } from '../services/api';

export default function AutomationsManager({ projects, activeProject }) {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [rssTestUrl, setRssTestUrl] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testingRss, setTestingRss] = useState(false);

  // Form for new automation
  const [newAuto, setNewAuto] = useState({
    name: '',
    rssUrl: '',
    projectId: activeProject || 'all',
    intervalMinutes: 15
  });

  useEffect(() => {
    fetchAutomations();
  }, [activeProject]);

  const fetchAutomations = async () => {
    setLoading(true);
    try {
      const res = await api.getAutomations(activeProject);
      if (res.success) {
        setAutomations(res.automations || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (auto) => {
    try {
      const res = await api.updateAutomation(auto.id, { active: !auto.active });
      if (res.success) {
        setAutomations(prev => prev.map(a => a.id === auto.id ? { ...a, active: !a.active } : a));
      }
    } catch (e) {
      alert('Error updating automation: ' + e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this automation?')) return;
    try {
      const res = await api.deleteAutomation(id);
      if (res.success) {
        setAutomations(prev => prev.filter(a => a.id !== id));
      }
    } catch (e) {
      alert('Error deleting: ' + e.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newAuto.name || !newAuto.rssUrl) return;

    try {
      const res = await api.createAutomation(newAuto);
      if (res.success) {
        setShowAddModal(false);
        setNewAuto({ name: '', rssUrl: '', projectId: activeProject || 'all', intervalMinutes: 15 });
        fetchAutomations();
      } else {
        alert(res.error || 'Failed to create automation');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleTestRss = async () => {
    if (!rssTestUrl) return;
    setTestingRss(true);
    setTestResult(null);
    try {
      const res = await api.testRss(rssTestUrl);
      if (res.success) {
        setTestResult(res.feed);
      } else {
        alert('RSS Test failed: ' + res.error);
      }
    } catch (e) {
      alert('Failed: ' + e.message);
    } finally {
      setTestingRss(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-950/60 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>LaraPush AutoMagic Engine</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            RSS to Push & Push-on-Publish
          </h2>
          <p className="text-xs text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
            Automatically detect newly published blog articles or YouTube uploads via RSS feeds and instantly broadcast notifications to your subscribers without logging into the panel!
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New RSS Auto-Push</span>
        </button>
      </div>

      {/* Live RSS Feed Tester Card */}
      <div className="bg-[#12141d]/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400" />
          <span>Live RSS Feed Validator & Tester</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Test any WordPress feed (e.g. <code className="text-indigo-400 font-mono">https://yoursite.com/feed</code>) or YouTube Channel RSS before saving.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={rssTestUrl}
            onChange={(e) => setRssTestUrl(e.target.value)}
            placeholder="Enter RSS Feed URL (e.g. https://techcrunch.com/feed)"
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleTestRss}
            disabled={testingRss || !rssTestUrl}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {testingRss ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 text-emerald-400" />}
            <span>Test Feed Live</span>
          </button>
        </div>

        {/* Test Result Preview */}
        {testResult && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-emerald-500/30">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
              <span className="font-bold text-emerald-400">✅ Valid Feed: {testResult.feedTitle}</span>
              <span className="text-slate-400">{testResult.itemCount} items detected</span>
            </div>
            <div className="mt-3 space-y-2">
              {(testResult.items || []).slice(0, 3).map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <h5 className="font-bold text-slate-200">{item.title}</h5>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{item.description}</p>
                    <a href={item.link} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-400 hover:underline mt-1 inline-block">
                      {item.link}
                    </a>
                  </div>
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt="" className="w-12 h-12 object-cover rounded-md shrink-0 border border-slate-700" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active Automations List */}
      <div className="bg-[#12141d]/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Configured Automations</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
              {automations.length}
            </span>
          </h3>
          <button onClick={fetchAutomations} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {automations.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No automations configured yet. Click "New RSS Auto-Push" to start auto-broadcasting!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {automations.map((auto) => (
              <div key={auto.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">{auto.name}</span>
                    <button
                      onClick={() => handleToggleActive(auto)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer ${
                        auto.active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}
                    >
                      {auto.active ? '● Running' : '○ Paused'}
                    </button>
                  </div>
                  <code className="text-[11px] text-slate-400 font-mono block break-all bg-slate-950 p-2 rounded-lg border border-slate-800 mb-2">
                    {auto.rssUrl}
                  </code>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Check interval: every {auto.intervalMinutes} min</span>
                    <span>Pushed: <strong>{auto.totalPushed || 0}</strong> times</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-500">
                    Last check: {auto.lastChecked ? new Date(auto.lastChecked).toLocaleTimeString() : 'Pending'}
                  </span>
                  <button
                    onClick={() => handleDelete(auto.id)}
                    className="text-slate-500 hover:text-red-400 transition p-1"
                    title="Delete automation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161824] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Create RSS Auto-Push</h3>
            <p className="text-xs text-slate-400 mb-4">Connect an RSS feed to automatically push new content.</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Automation Name</label>
                <input
                  type="text"
                  value={newAuto.name}
                  onChange={(e) => setNewAuto({ ...newAuto, name: e.target.value })}
                  placeholder="e.g. Tech Blog Auto Push"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">RSS / Atom Feed URL</label>
                <input
                  type="url"
                  value={newAuto.rssUrl}
                  onChange={(e) => setNewAuto({ ...newAuto, rssUrl: e.target.value })}
                  placeholder="https://yoursite.com/feed"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Target Website / Project</label>
                <select
                  value={newAuto.projectId}
                  onChange={(e) => setNewAuto({ ...newAuto, projectId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                >
                  <option value="all">🌐 All Subscribers</option>
                  {(projects || []).map(p => (
                    <option key={p.project_id || p.id} value={p.project_id || p.id}>
                      {p.project_name || p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Check Frequency</label>
                <select
                  value={newAuto.intervalMinutes}
                  onChange={(e) => setNewAuto({ ...newAuto, intervalMinutes: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                >
                  <option value={5}>Every 5 minutes</option>
                  <option value={15}>Every 15 minutes</option>
                  <option value={30}>Every 30 minutes</option>
                  <option value={60}>Every 1 hour</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Save Automation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
