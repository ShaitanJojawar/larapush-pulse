import React, { useState } from 'react';
import { Plus, Globe, Users, Radio, Copy, Check, Trash2, ExternalLink, Code, Layers, Sparkles, Zap, Hash } from 'lucide-react';
import YoutubeIcon from './YoutubeIcon';
import { api } from '../services/api';

export default function ProjectsManager({ projects, activeProject, onSelectProject, onRefresh }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEmbedProject, setSelectedEmbedProject] = useState(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    project_name: '',
    type: 'youtube',
    identifier: '',
    logo: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.project_name.trim()) {
      setError('Please provide a project name');
      return;
    }
    if (!formData.identifier.trim()) {
      setError('Please provide a channel ID or domain identifier');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.project_name.trim(),
        project_name: formData.project_name.trim(),
        type: formData.type,
        identifier: formData.identifier.trim(),
        logo: formData.logo.trim()
      };
      const res = await api.createProject(payload);
      if (res.success) {
        setIsCreateOpen(false);
        setFormData({
          project_name: '',
          type: 'youtube',
          identifier: '',
          logo: '',
          description: ''
        });
        if (onRefresh) onRefresh();
      } else {
        setError(res.error || 'Failed to create project');
      }
    } catch (err) {
      setError(err.message || 'Error creating project');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete project "${name}"?`)) return;
    try {
      await api.deleteProject(id);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Failed to delete project: ' + err.message);
    }
  };

  const copyEmbedSnippet = (projId) => {
    const snippet = `<!-- Push Notification SDK for Project: ${projId} -->\n<script src="${window.location.origin}/push-sdk.js" data-project-id="${projId}" data-auto-prompt="true"></script>`;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-[#12141d]/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h2 className="text-xl font-bold text-white tracking-tight">FCM Topics Architecture (10M Scale)</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Zero Token Loop
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Each project is registered as an isolated FCM Topic. Sending broadcasts to 10M+ users requires only a single API call.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Project / Topic</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(!projects || projects.length === 0) ? (
          <div className="col-span-full py-16 text-center text-slate-500 bg-[#12141d]/50 rounded-2xl border border-slate-800">
            <Layers className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-300">No projects configured</p>
            <p className="text-xs text-slate-500 mt-1">Click "+ Add New Project" to add your first YouTube channel or website.</p>
          </div>
        ) : (
          projects.map((proj) => {
            const isYt = proj.type === 'youtube';
            const isSelected = activeProject === proj.project_id;
            const topicName = proj.topic || `project_${proj.project_id}`;

            return (
              <div
                key={proj.project_id || proj._id}
                className={`bg-[#12141d]/90 border rounded-2xl p-5 shadow-xl backdrop-blur-xl relative flex flex-col justify-between transition-all group hover:-translate-y-1 ${
                  isSelected
                    ? 'border-indigo-500/80 shadow-indigo-500/10 ring-1 ring-indigo-500'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Bar: Logo & Type Badge */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                        {proj.logo ? (
                          <img
                            src={proj.logo}
                            alt={proj.project_name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : isYt ? (
                          <YoutubeIcon className="w-6 h-6 text-red-500" />
                        ) : (
                          <Globe className="w-6 h-6 text-indigo-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base leading-snug line-clamp-1">
                          {proj.project_name}
                        </h3>
                        {/* FCM Topic Name Badge */}
                        <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 mt-0.5">
                          <Hash className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{topicName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Type badge */}
                    {isYt ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1 shrink-0">
                        <YoutubeIcon className="w-3 h-3" />
                        <span>YouTube</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1 shrink-0">
                        <Globe className="w-3 h-3" />
                        <span>Website</span>
                      </span>
                    )}
                  </div>

                  {/* Identifier & Description */}
                  <div className="text-xs text-slate-400 mb-4 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span>Channel / URL:</span>
                      <a
                        href={proj.identifier}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="font-mono text-slate-300 text-[11px] truncate">
                      {proj.identifier}
                    </p>
                  </div>

                  {/* Topic Subscribers & Scale Metric */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 text-center">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Topic Subscribers</span>
                      <span className="text-base font-extrabold text-white mt-0.5 block">
                        {(proj.subscriberCount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 text-center">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Broadcast SLA</span>
                      <span className="text-xs font-bold text-emerald-400 mt-1 block flex items-center justify-center gap-1">
                        <Zap className="w-3 h-3" />
                        <span>1 API Call</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectProject(proj.project_id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      {isSelected ? '✓ Selected' : 'Target Topic'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedEmbedProject(proj)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1"
                      title="Get embed code for this project"
                    >
                      <Code className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="hidden sm:inline">SDK Tag</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(proj.project_id, proj.project_name)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition"
                    title="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create Project */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12141d] border border-slate-800 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Add New Project (FCM Topic)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Project Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'youtube' })}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      formData.type === 'youtube'
                        ? 'bg-red-600/20 border-red-500/50 text-red-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <YoutubeIcon className="w-4 h-4" />
                    <span>YouTube Channel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'website' })}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      formData.type === 'website'
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <span>Website / Blog</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Project Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={formData.type === 'youtube' ? 'e.g. SS Banna Jojawar' : 'e.g. Main Website'}
                  value={formData.project_name}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {formData.type === 'youtube' ? 'YouTube Channel Link / Handle' : 'Website Domain URL'} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={formData.type === 'youtube' ? 'https://www.youtube.com/@ssbannajojawar' : 'https://ssbanna.com'}
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Avatar / Logo URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://... image link"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20"
                >
                  {loading ? 'Creating...' : 'Register FCM Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Embed Snippet */}
      {selectedEmbedProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12141d] border border-slate-800 rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">SDK Tag for {selectedEmbedProject.project_name}</h3>
                <span className="text-xs text-emerald-400 font-mono">FCM Topic: <strong>{selectedEmbedProject.topic || `project_${selectedEmbedProject.project_id}`}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmbedProject(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                Add this script tag to your website or YouTube landing page. Subscribers will be automatically registered directly into the <strong>{selectedEmbedProject.topic || `project_${selectedEmbedProject.project_id}`}</strong> topic:
              </p>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 leading-relaxed break-all select-all">
                &lt;script src="{window.location.origin}/push-sdk.js" data-project-id="{selectedEmbedProject.project_id}" data-auto-prompt="true"&gt;&lt;/script&gt;
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => copyEmbedSnippet(selectedEmbedProject.project_id)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Script Tag'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
