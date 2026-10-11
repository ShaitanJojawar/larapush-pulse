import React from 'react';
import { Users, Send, CheckCircle2, Radio, Globe, Smartphone, Apple, Layers, Zap } from 'lucide-react';

export default function StatsCards({ stats, activeProject, projects }) {
  const totalSubscribers = stats?.totalSubscribers ?? 0;
  const targetTopic = stats?.targetTopic || 'all_users';
  const sentToday = stats?.sentToday ?? 0;
  const deliveryRate = stats?.deliveryRate ?? '99.9%';
  const totalProjects = stats?.totalProjects ?? (projects?.length || 0);

  const currentProjectObj = (projects || []).find(p => p.project_id === activeProject || p.id === activeProject);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Real Active Subscribers */}
      <div className="bg-[#12141d]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/40 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {activeProject && activeProject !== 'all' ? `${currentProjectObj?.name || currentProjectObj?.project_name || 'Project'} Active Subs` : 'Total Active Subscribers'}
          </span>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-extrabold text-white tracking-tight">
            {totalSubscribers.toLocaleString()}
          </h3>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {activeProject && activeProject !== 'all' ? `project_${activeProject}` : 'all_projects'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Single API Call Fan-Out Engine */}
      <div className="bg-[#12141d]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg backdrop-blur-xl relative overflow-hidden group hover:border-violet-500/40 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">FCM Architecture</span>
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Single API Call</span>
          </h3>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-violet-400 font-semibold">Zero Token Loop</span>
            <span>•</span>
            <span className="text-slate-400">Google Edge Fan-Out</span>
          </div>
        </div>
      </div>

      {/* 3. Delivery SLA */}
      <div className="bg-[#12141d]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">FCM Topic SLA</span>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-extrabold text-emerald-400 tracking-tight">
            {deliveryRate}
          </h3>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-emerald-400 font-medium">10M Capable</span>
            <span>•</span>
            <span className="text-slate-400">Global Google CDN</span>
          </div>
        </div>
      </div>

      {/* 4. Total Unlimited Projects */}
      <div className="bg-[#12141d]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/40 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unlimited Topics</span>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-extrabold text-white tracking-tight">
            {totalProjects.toLocaleString()}
          </h3>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-amber-400 font-medium">1 Topic Per Project</span>
            <span>•</span>
            <span className="text-slate-400">Isolated Segments</span>
          </div>
        </div>
      </div>
    </div>
  );
}
