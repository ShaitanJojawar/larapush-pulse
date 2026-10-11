import React, { useState } from 'react';
import { Monitor, Smartphone, Apple, ExternalLink, X, Bell, CheckCircle2 } from 'lucide-react';
import Youtube from './YoutubeIcon';

export default function LiveNotificationPreview({
  title,
  body,
  imageUrl,
  iconUrl,
  clickUrl,
  target,
  isYouTube,
  action1Title,
  action1Url,
  action2Title,
  action2Url
}) {
  const [device, setDevice] = useState('windows'); // 'windows' | 'android' | 'mac'

  const displayTitle = title?.trim() || 'Breaking Update: New Content Live';
  const displayBody = body?.trim() || 'Tap to explore our latest release and join thousands of readers live!';
  const hasImage = Boolean(imageUrl?.trim());

  return (
    <div className="bg-[#12141d]/90 border border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-2xl backdrop-blur-xl flex flex-col h-full">
      {/* Header & Device Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 mb-6 gap-3">
        <div>
          <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase">LaraPush Multi-OS Simulator</span>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Live Device Preview
          </h3>
        </div>

        {/* Segmented Device Switcher */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 gap-1">
          <button
            type="button"
            onClick={() => setDevice('windows')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              device === 'windows'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Windows</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice('android')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              device === 'android'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice('mac')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              device === 'mac'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>macOS</span>
          </button>
        </div>
      </div>

      {/* Simulator Area */}
      <div className="flex-1 flex items-center justify-center py-6 bg-slate-950/70 rounded-xl border border-slate-900/80 p-4 min-h-[420px] overflow-hidden">
        {device === 'windows' && (
          /* ================= WINDOWS 10/11 TOAST NOTIFICATION ================= */
          <div className="w-full max-w-sm bg-[#1e222d] text-slate-100 rounded-xl shadow-2xl border border-slate-700/60 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-3.5 py-2.5 bg-[#171a23] border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 via-red-500 to-emerald-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 border border-white"></div>
                </div>
                <span className="font-semibold text-slate-300">Google Chrome</span>
                <span className="text-[10px] text-slate-500">•</span>
                <span className="text-[11px] text-slate-400 truncate max-w-[130px]">
                  {clickUrl ? (clickUrl.includes('youtube.com') ? 'youtube.com' : 'larapush.app') : 'larapush.app'}
                </span>
              </div>
              <button className="text-slate-500 hover:text-slate-300 transition">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Notification Body */}
            <div className="p-3.5 flex gap-3 items-start">
              <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white leading-snug line-clamp-1">
                  {displayTitle}
                </h4>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed line-clamp-2">
                  {displayBody}
                </p>
              </div>
            </div>

            {/* Large Banner Image */}
            {hasImage && (
              <div className="px-3.5 pb-3">
                <div className="relative rounded-lg overflow-hidden border border-slate-700/50 bg-black aspect-video max-h-44">
                  <img
                    src={imageUrl}
                    alt="Push Banner"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  {isYouTube && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                        <Youtube className="w-5 h-5 ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="px-3 pb-3 pt-1 flex items-center gap-2 border-t border-slate-800/80">
              <button className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-750 text-white text-[11px] font-semibold rounded-lg border border-slate-700/60 transition truncate">
                {action1Title || (isYouTube ? '▶ Watch Video' : 'Open Link')}
              </button>
              {action2Title && (
                <button className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-semibold rounded-lg border border-slate-800 transition truncate">
                  {action2Title}
                </button>
              )}
            </div>
          </div>
        )}

        {device === 'android' && (
          /* ================= ANDROID NOTIFICATION ================= */
          <div className="w-full max-w-sm bg-[#121212] text-slate-100 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Android Top Header */}
            <div className="px-4 py-2.5 bg-black/60 border-b border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-indigo-500 flex items-center justify-center text-white text-[9px] font-bold">
                  🔔
                </div>
                <span className="font-semibold text-zinc-300">Chrome</span>
                <span className="text-[9px] text-zinc-600">•</span>
                <span>now</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">10M Push</span>
            </div>

            {/* Content */}
            <div className="p-4">
              <h4 className="text-xs font-bold text-white leading-snug line-clamp-1">
                {displayTitle}
              </h4>
              <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed line-clamp-2">
                {displayBody}
              </p>

              {/* Large Image */}
              {hasImage && (
                <div className="mt-3 rounded-xl overflow-hidden border border-zinc-800 bg-black aspect-video max-h-40 relative">
                  <img
                    src={imageUrl}
                    alt="Android Push Media"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-3 pt-2.5 border-t border-zinc-800 flex items-center gap-3">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider cursor-pointer">
                  {action1Title || 'OPEN LINK'}
                </span>
                {action2Title && (
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider cursor-pointer">
                    {action2Title}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {device === 'mac' && (
          /* ================= macOS NOTIFICATION BANNER ================= */
          <div className="w-full max-w-sm bg-[#1e1e24]/95 backdrop-blur-xl text-slate-100 rounded-2xl shadow-2xl border border-white/10 p-3.5 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
                  <span className="font-semibold text-slate-300">Safari • LaraPush</span>
                  <span className="text-[10px] text-slate-500">now</span>
                </div>
                <h4 className="text-xs font-bold text-white truncate">{displayTitle}</h4>
                <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">{displayBody}</p>

                {hasImage && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-white/10 aspect-video max-h-28">
                    <img src={imageUrl} alt="macOS push" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="mt-2.5 flex items-center gap-2 justify-end">
                  <button className="px-2.5 py-1 text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-white rounded-md transition">
                    {action1Title || 'Open'}
                  </button>
                  {action2Title && (
                    <button className="px-2.5 py-1 text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-slate-300 rounded-md transition">
                      {action2Title}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Simulator Footer Details */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>FCM Topics 10M Fan-out</span>
        </div>
        <span className="text-[11px] text-indigo-400 font-mono">Zero Token Loop</span>
      </div>
    </div>
  );
}
