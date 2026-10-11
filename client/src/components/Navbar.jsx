import React from 'react';
import {
  Bell,
  Send,
  Users,
  History,
  Code,
  Settings,
  ExternalLink,
  ShieldCheck,
  LogOut,
  LogIn,
  Layers,
  Zap,
  Sliders,
  BarChart3,
  Download
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenLogin,
  user,
  onLogout,
  projects,
  activeProject,
  onSelectProject
}) {
  const tabs = [
    { id: 'composer', label: 'Campaigns', icon: Send },
    { id: 'automations', label: 'Automations', icon: Zap },
    { id: 'optin', label: 'Opt-in & Bell', icon: Sliders },
    { id: 'projects', label: 'Websites & Channels', icon: Layers },
    { id: 'subscribers', label: 'Subscribers', icon: Users },
    { id: 'analytics', label: 'Analytics & CTR', icon: BarChart3 },
    { id: 'wordpress', label: 'WordPress Plugin', icon: Download },
  ];

  return (
    <header className="border-b border-slate-800/80 bg-[#0c0d14]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Project Switcher */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
              <Bell className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">LaraPush <span className="text-indigo-400">Pulse</span></span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Self-Hosted 10M
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:block">FCM Topics • Zero Recurring Fee</span>
            </div>
          </div>

          {/* Global Project Switcher Dropdown */}
          <div className="hidden xl:flex items-center bg-slate-900/90 rounded-xl border border-slate-800 p-1 pl-3 gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Domain:</span>
            </div>
            <select
              value={activeProject || 'all'}
              onChange={(e) => onSelectProject && onSelectProject(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-3 py-1"
            >
              <option value="all" className="bg-slate-900 text-white">🌐 All Domains (Unified 10M)</option>
              {(projects || []).map(p => (
                <option key={p.project_id || p.id} value={p.project_id || p.id} className="bg-slate-900 text-white">
                  {p.type === 'youtube' ? '🔴' : '🌐'} {p.project_name || p.name} ({p.subscriberCount || 0} subs)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2.5">
          {/* Client Demo Webpage Link */}
          <a
            href="/demo"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-800 transition shadow-sm"
          >
            <span>Live Tester</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          {/* Settings Modal Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-800 transition"
            title="Firebase & Cloud Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User / Login state */}
          {user ? (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
              <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hidden sm:inline">
                {user.username}
              </span>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-red-400 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Bar: Project Selector & Scrollable Tabs */}
      <div className="lg:hidden bg-slate-950/95 border-t border-slate-900 divide-y divide-slate-900">
        {/* Mobile Project Selector */}
        <div className="flex items-center px-4 py-2 gap-2 bg-slate-900/50">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold shrink-0">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Channel:</span>
          </div>
          <select
            value={activeProject || 'all'}
            onChange={(e) => onSelectProject && onSelectProject(e.target.value)}
            className="w-full bg-slate-950 text-xs font-bold text-white rounded-lg border border-slate-800 px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">🌐 All Channels / Domains</option>
            {(projects || []).map(p => (
              <option key={p.project_id || p.id} value={p.project_id || p.id}>
                {p.type === 'youtube' ? '🔴' : '🌐'} {p.project_name || p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Mobile Scrollable Tabs */}
        <div className="flex items-center overflow-x-auto px-4 py-2 gap-1.5 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
