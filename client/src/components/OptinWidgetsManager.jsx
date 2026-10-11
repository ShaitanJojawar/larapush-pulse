import React, { useState, useEffect } from 'react';
import { Sliders, Bell, Copy, Check, Eye, Sparkles, Code2, Save } from 'lucide-react';
import { api } from '../services/api';

export default function OptinWidgetsManager({ projects, activeProject }) {
  const [selectedProject, setSelectedProject] = useState(activeProject !== 'all' ? activeProject : (projects?.[0]?.project_id || projects?.[0]?.id || 'main-website'));
  const [copied, setCopied] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const [settings, setSettings] = useState({
    promptType: 'both', // 'both' | 'bell_widget' | 'two_step_modal' | 'native'
    bellPosition: 'bottom-right',
    bellColor: '#6366f1',
    modalTitle: "🔔 Don't Miss Breaking Updates!",
    modalBody: 'Subscribe to get instant breaking alerts and exclusive stories directly on your screen.',
    allowText: 'Allow Notifications',
    denyText: 'Later',
    delaySeconds: 2
  });

  useEffect(() => {
    if (selectedProject) {
      loadSettings(selectedProject);
    }
  }, [selectedProject]);

  const loadSettings = async (projId) => {
    try {
      const res = await api.getWidgetConfig(projId);
      if (res.success && res.optinSettings) {
        setSettings(prev => ({ ...prev, ...res.optinSettings }));
      }
    } catch (e) { }
  };

  const handleSave = async () => {
    try {
      const res = await api.saveWidgetConfig(selectedProject, settings);
      if (res.success) {
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 3000);
      }
    } catch (e) {
      alert('Error saving: ' + e.message);
    }
  };

  const embedCode = `<!-- LaraPush Pulse Web Push Code -->
<script src="${window.location.origin}/push-sdk.js" async></script>
<script>
  window.addEventListener('DOMContentLoaded', function() {
    PushSDK.init({
      apiUrl: '${window.location.origin}',
      projectId: '${selectedProject}',
      autoPrompt: true
    });
  });
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-violet-950/50 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <Sliders className="w-3.5 h-3.5" />
            <span>LaraPush Opt-in Prompts & Bell</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Opt-in Widgets & Permission Dialogs
          </h2>
          <p className="text-xs text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
            Customize the floating bell widget and high-converting 2-step permission prompt for your websites.
          </p>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800 shrink-0">
          <span className="text-xs text-slate-400 font-semibold pl-2">Domain:</span>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-slate-950 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer focus:outline-none"
          >
            {(projects || []).map(p => (
              <option key={p.project_id || p.id} value={p.project_id || p.id}>
                {p.project_name || p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2-Column: Left Settings, Right Interactive Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Settings Form */}
        <div className="lg:col-span-6 bg-[#12141d]/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Widget Customization</span>
            </h3>
            {savedMsg && (
              <span className="text-xs text-emerald-400 font-bold animate-pulse">
                ✅ Settings Saved!
              </span>
            )}
          </div>

          {/* Opt-in Prompt Type */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Prompt Display Mode</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'both', label: 'Floating Bell + 2-Step Modal' },
                { id: 'bell_widget', label: 'Floating Bell Only' },
                { id: 'two_step_modal', label: '2-Step Modal Only' },
                { id: 'native', label: 'Native Browser Prompt' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSettings({ ...settings, promptType: opt.id })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition cursor-pointer ${
                    settings.promptType === opt.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Floating Bell Settings */}
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Floating Bell Settings</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Bell Position</label>
                <select
                  value={settings.bellPosition}
                  onChange={(e) => setSettings({ ...settings, bellPosition: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                >
                  <option value="bottom-right">Bottom Right Corner</option>
                  <option value="bottom-left">Bottom Left Corner</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Bell Theme Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.bellColor}
                    onChange={(e) => setSettings({ ...settings, bellColor: e.target.value })}
                    className="w-9 h-9 rounded-lg border border-slate-700 bg-transparent cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={settings.bellColor}
                    onChange={(e) => setSettings({ ...settings, bellColor: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2-Step Modal Settings */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">2-Step Soft Prompt Settings</h4>
            
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Modal Title</label>
              <input
                type="text"
                value={settings.modalTitle}
                onChange={(e) => setSettings({ ...settings, modalTitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Modal Description</label>
              <textarea
                rows={2}
                value={settings.modalBody}
                onChange={(e) => setSettings({ ...settings, modalBody: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Allow Button</label>
                <input
                  type="text"
                  value={settings.allowText}
                  onChange={(e) => setSettings({ ...settings, allowText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Deny Button</label>
                <input
                  type="text"
                  value={settings.denyText}
                  onChange={(e) => setSettings({ ...settings, denyText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Delay (sec)</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={settings.delaySeconds}
                  onChange={(e) => setSettings({ ...settings, delaySeconds: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Widget Settings</span>
          </button>
        </div>

        {/* Right: Live Interactive Mockup Simulator */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-[#12141d]/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Interactive Website Simulator</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Here is how visitors will see the opt-in experience on your website.
            </p>

            {/* Mock Website Container */}
            <div className="relative rounded-xl border border-slate-700/80 bg-slate-950 h-80 overflow-hidden p-4 shadow-inner">
              {/* Browser mockup header */}
              <div className="flex items-center gap-1.5 pb-3 border-b border-slate-800 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                <span className="text-[10px] text-slate-500 ml-2 font-mono">https://ssbanna.com</span>
              </div>

              {/* Mock site body content skeleton */}
              <div className="space-y-2 opacity-30">
                <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                <div className="h-3 bg-slate-800 rounded w-4/5"></div>
                <div className="h-3 bg-slate-800 rounded w-2/3"></div>
              </div>

              {/* 2-Step Soft Prompt Preview */}
              {(settings.promptType === 'both' || settings.promptType === 'two_step_modal') && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[85%] max-w-sm bg-[#181924] border border-white/10 rounded-xl p-3.5 shadow-2xl z-20">
                  <div className="flex gap-2.5 items-start">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${settings.bellColor}25`, color: settings.bellColor }}
                    >
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-xs font-bold text-white">{settings.modalTitle}</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{settings.modalBody}</p>
                      <div className="flex justify-end gap-2 mt-2">
                        <span className="px-2 py-1 text-[10px] font-semibold text-slate-400 rounded border border-white/10">
                          {settings.denyText}
                        </span>
                        <span
                          className="px-2.5 py-1 text-[10px] font-semibold text-white rounded shadow-sm"
                          style={{ background: settings.bellColor }}
                        >
                          {settings.allowText}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Floating Bell Preview */}
              {(settings.promptType === 'both' || settings.promptType === 'bell_widget') && (
                <div
                  className="absolute bottom-4"
                  style={{ [settings.bellPosition === 'bottom-left' ? 'left' : 'right']: '16px' }}
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer transform hover:scale-105 transition"
                    style={{ background: settings.bellColor, boxShadow: `0 8px 20px -4px ${settings.bellColor}80` }}
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Copy Script Tag */}
          <div className="bg-[#12141d]/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span>1-Line Integration Embed Script</span>
              </h3>
              <button
                onClick={handleCopy}
                className="text-xs font-bold px-3 py-1 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 flex items-center gap-1.5 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Paste this snippet inside the <code>&lt;head&gt;</code> of any custom HTML, Shopify, or Webflow site:
            </p>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-indigo-300 font-mono overflow-x-auto leading-relaxed">
              {embedCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
