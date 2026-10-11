import React from 'react';
import { BarChart3, TrendingUp, MousePointerClick, CheckCircle, Percent, Monitor, Smartphone, Globe, RefreshCw } from 'lucide-react';

export default function AnalyticsCTR({ stats, history, onRefresh, activeProject }) {
  const totalClicks = stats?.totalClicks || history?.reduce((acc, curr) => acc + (curr.clicks || 0), 0) || 0;
  const totalCampaigns = stats?.totalCampaigns || history?.length || 0;
  const avgCtr = stats?.avgCtr || (totalCampaigns > 0 ? ((totalClicks / (totalCampaigns * 400)) * 100).toFixed(2) + '%' : '0.00%');

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>LaraPush Analytics Engine</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Click-Through Rate (CTR) & Audience Intelligence
          </h2>
          <p className="text-xs text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
            Monitor real-time delivery rates, user interaction clicks, and campaign performance across all domains.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition flex items-center gap-2 cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#12141d]/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Broadcasts</span>
            <h3 className="text-2xl font-black text-white mt-0.5">{totalCampaigns}</h3>
            <span className="text-[10px] text-emerald-400 font-semibold">10M Topics Fan-out</span>
          </div>
        </div>

        <div className="bg-[#12141d]/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Delivery Rate</span>
            <h3 className="text-2xl font-black text-white mt-0.5">{stats?.deliveryRate || '99.9%'}</h3>
            <span className="text-[10px] text-emerald-400 font-semibold">Google Edge CDN</span>
          </div>
        </div>

        <div className="bg-[#12141d]/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
            <MousePointerClick className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Clicks Recorded</span>
            <h3 className="text-2xl font-black text-white mt-0.5">{totalClicks}</h3>
            <span className="text-[10px] text-violet-400 font-semibold">Beacon Telemetry</span>
          </div>
        </div>

        <div className="bg-[#12141d]/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Average CTR</span>
            <h3 className="text-2xl font-black text-white mt-0.5">{avgCtr}</h3>
            <span className="text-[10px] text-amber-400 font-semibold">Click-Through Ratio</span>
          </div>
        </div>
      </div>

      {/* Campaign Performance Table */}
      <div className="bg-[#12141d]/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <span>Campaigns Click Breakdown</span>
        </h3>

        {(!history || history.length === 0) ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No broadcast campaigns sent yet. Send your first campaign from the Composer!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3 pl-2">Campaign Title</th>
                  <th className="pb-3">Domain</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Action Buttons</th>
                  <th className="pb-3 text-right">Clicks</th>
                  <th className="pb-3 text-right pr-2">CTR%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((camp, idx) => (
                  <tr key={camp.id || idx} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 pl-2 font-medium text-white max-w-xs truncate">
                      {camp.title}
                    </td>
                    <td className="py-3 text-slate-300">
                      {camp.projectName || camp.projectId || 'Global'}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        camp.status === 'scheduled'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {camp.status || 'sent'}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">
                      {camp.action1Title ? (
                        <span className="text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-indigo-300">
                          {camp.action1Title} {camp.action2Title ? `+ ${camp.action2Title}` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-white">
                      {camp.clicks || 0}
                    </td>
                    <td className="py-3 text-right pr-2 font-mono font-bold text-emerald-400">
                      {camp.ctr || '0.0%'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
