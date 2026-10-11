import React, { useState, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Globe,
  Image as ImageIcon,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Layers,
  Tag,
  Zap,
  MousePointerClick,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Youtube from './YoutubeIcon';
import LiveNotificationPreview from './LiveNotificationPreview';
import { api } from '../services/api';

export default function NotificationComposer({ onNotificationSent, stats, projects, activeProject }) {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    imageUrl: '',
    clickUrl: '',
    target: 'all',
    projectId: activeProject || 'all',
    notificationType: 'article',
    // Action Buttons
    action1Title: 'Open Link',
    action1Url: '',
    action2Title: '',
    action2Url: '',
    // UTM Parameters
    utmEnabled: false,
    utmSource: 'larapush',
    utmMedium: 'push_notification',
    utmCampaign: '',
    // Scheduling
    isScheduled: false,
    scheduledAt: ''
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (activeProject) {
      setFormData(prev => ({ ...prev, projectId: activeProject }));
    }
  }, [activeProject]);

  const [ytInfo, setYtInfo] = useState({
    isYouTube: false,
    videoId: '',
    maxResThumbnail: ''
  });

  useEffect(() => {
    const url = formData.clickUrl.trim();
    if (!url) {
      setYtInfo({ isYouTube: false, videoId: '', maxResThumbnail: '' });
      return;
    }

    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);

    if (match && match[1]) {
      const videoId = match[1];
      setYtInfo({
        isYouTube: true,
        videoId,
        maxResThumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      });
    } else {
      const isYtDomain = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/i.test(url);
      setYtInfo({
        isYouTube: isYtDomain,
        videoId: '',
        maxResThumbnail: ''
      });
    }
  }, [formData.clickUrl]);

  const handleApplyYouTubeThumbnail = () => {
    if (ytInfo.maxResThumbnail) {
      setFormData(prev => ({
        ...prev,
        imageUrl: ytInfo.maxResThumbnail
      }));
    }
  };

  const currentProjectObj = (projects || []).find(p => (p.project_id || p.id) === formData.projectId);
  const isSelectedProjectYouTube = currentProjectObj?.type === 'youtube';
  const targetTopicName = formData.projectId === 'all'
    ? 'all_users'
    : (currentProjectObj?.topic || `project_${formData.projectId}`);

  const handleApplyPreset = (type) => {
    if (type === 'youtube') {
      const ytProj = (projects || []).find(p => p.type === 'youtube') || projects?.[0];
      setFormData(prev => ({
        ...prev,
        title: `🔥 ${ytProj?.project_name || 'SS Banna Jojawar'} - New Song Premiere!`,
        body: 'Tap to watch the official video premiere on YouTube and join comments live!',
        clickUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        imageUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        action1Title: '▶ Watch Video',
        action1Url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        action2Title: 'Share with Friends',
        action2Url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        projectId: ytProj?.project_id || ytProj?.id || 'ss-banna-jojawar',
        notificationType: 'video'
      }));
    } else if (type === 'article') {
      const webProj = (projects || []).find(p => p.type === 'website') || projects?.[0];
      setFormData(prev => ({
        ...prev,
        title: '📰 Breaking Article: Latest Story & Updates',
        body: 'Read our latest in-depth breakdown and exclusive insights on the portal.',
        clickUrl: 'https://ssbanna.com/news/latest-update',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
        action1Title: 'Read Article',
        action1Url: 'https://ssbanna.com/news/latest-update',
        action2Title: 'Explore More',
        action2Url: 'https://ssbanna.com',
        projectId: webProj?.project_id || webProj?.id || 'main-website',
        notificationType: 'article'
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setErrorMsg('Please enter a notification title');
      return;
    }
    if (!formData.body.trim()) {
      setErrorMsg('Please enter a notification message');
      return;
    }

    if (formData.isScheduled && !formData.scheduledAt) {
      setErrorMsg('Please pick a date and time for scheduled campaign');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.sendNotification(formData);
      if (res.success) {
        setSuccessMsg(res.message || `Broadcasted in 1 API call via topic "${targetTopicName}"`);
        if (onNotificationSent) onNotificationSent();
      } else {
        setErrorMsg(res.error || 'Failed to send topic notification');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Network error while broadcasting topic notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Form: Composer */}
      <div className="lg:col-span-7 bg-[#12141d]/90 border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-xl font-bold text-white tracking-tight">LaraPush Campaign Composer</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Send instant rich notifications or schedule campaigns to 10M+ users with zero database bottlenecks.
            </p>
          </div>

          {/* Presets */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleApplyPreset('youtube')}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition flex items-center gap-1.5"
            >
              <Youtube className="w-3.5 h-3.5" />
              <span>YouTube Preset</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('article')}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Article Preset</span>
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Broadcast Error:</span> {errorMsg}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Success!</span> {successMsg}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Row 1: Target Domain & Platform */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Target Website / Domain <span className="text-red-400">*</span></span>
              </label>
              <select
                value={formData.projectId}
                onChange={(e) => {
                  const newProjId = e.target.value;
                  const found = (projects || []).find(p => (p.project_id || p.id) === newProjId);
                  setFormData(prev => ({
                    ...prev,
                    projectId: newProjId,
                    notificationType: found?.type === 'youtube' ? 'video' : 'article'
                  }));
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs transition cursor-pointer font-medium"
              >
                <option value="all">🌐 all_users (All 10M+ Unified Subscribers)</option>
                {(projects || []).map(p => (
                  <option key={p.project_id || p.id} value={p.project_id || p.id}>
                    {p.type === 'youtube' ? '🔴' : '🌐'} {p.project_name || p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-violet-400" />
                <span>Device Platform Filter</span>
              </label>
              <select
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs transition cursor-pointer font-medium"
              >
                <option value="all">All Devices (Web, Android, iOS)</option>
                <option value="web">Desktop Browsers Only</option>
                <option value="android">Android Mobile Only</option>
                <option value="ios">iOS Mobile Only</option>
              </select>
            </div>
          </div>

          {/* Quick Emojis Bar */}
          <div className="flex items-center gap-1.5 flex-wrap bg-slate-900/40 p-2 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" /> Emojis:
            </span>
            {['🔥', '🚨', '🔴', '⚡', '📢', '🎬', '🎉', '🎵', '💥', '▶️'].map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, title: (prev.title ? prev.title + ' ' : '') + emoji }))}
                className="text-xs px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer hover:scale-110 active:scale-95"
                title={`Insert ${emoji} into title`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-200">
                Campaign Title <span className="text-red-400">*</span>
              </label>
              <span className={`text-[10px] font-mono font-medium ${
                formData.title.length > 60 ? 'text-red-400 font-bold' : formData.title.length > 45 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {formData.title.length}/60 recommended
              </span>
            </div>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. 🚨 Exclusive Premiere: New Release is Out!"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-medium transition"
              required
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-200">
                Message Body <span className="text-red-400">*</span>
              </label>
              <span className={`text-[10px] font-mono font-medium ${
                formData.body.length > 120 ? 'text-red-400 font-bold' : formData.body.length > 90 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {formData.body.length}/120 recommended
              </span>
            </div>
            <textarea
              rows={3}
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="e.g. Tap to explore our latest release and see what everyone is talking about..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs leading-relaxed transition"
              required
            />
          </div>

          {/* Target URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
              <span>Target Click Link (URL)</span>
              {ytInfo.isYouTube && (
                <span className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                  <Youtube className="w-3 h-3" /> YouTube Video Detected
                </span>
              )}
            </label>
            <input
              type="url"
              value={formData.clickUrl}
              onChange={(e) => setFormData({ ...formData, clickUrl: e.target.value })}
              placeholder="https://yourwebsite.com/article-or-page"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs font-mono transition"
            />
          </div>

          {/* Banner Image URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Large Banner Image (Optional)</span>
              </label>
              {ytInfo.maxResThumbnail && (
                <button
                  type="button"
                  onClick={handleApplyYouTubeThumbnail}
                  className="text-[10px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition"
                >
                  ⚡ Auto-fetch YouTube HD Thumbnail
                </button>
              )}
            </div>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://example.com/banner-image.jpg"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs font-mono transition"
            />
          </div>

          {/* Collapsible: LaraPush Action Buttons & UTM & Scheduling */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-4 py-3 bg-slate-900/60 hover:bg-slate-900 flex items-center justify-between text-xs font-semibold text-slate-300 transition"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>LaraPush Advanced: Action Buttons, UTM Tracking & Scheduling</span>
              </div>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="p-4 space-y-4 border-t border-slate-800">
                {/* Action Buttons */}
                <div>
                  <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                    <MousePointerClick className="w-3.5 h-3.5 text-indigo-400" />
                    <span>LaraPush Action Buttons</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                      <span className="text-[11px] font-bold text-slate-300 block mb-1.5">Button 1 (Primary)</span>
                      <input
                        type="text"
                        value={formData.action1Title}
                        onChange={(e) => setFormData({ ...formData, action1Title: e.target.value })}
                        placeholder="Button 1 Label (e.g. Read Now)"
                        className="w-full px-3 py-1.5 mb-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                      />
                      <input
                        type="url"
                        value={formData.action1Url}
                        onChange={(e) => setFormData({ ...formData, action1Url: e.target.value })}
                        placeholder="Custom URL (Leave blank to use main link)"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                      />
                    </div>

                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                      <span className="text-[11px] font-bold text-slate-300 block mb-1.5">Button 2 (Secondary)</span>
                      <input
                        type="text"
                        value={formData.action2Title}
                        onChange={(e) => setFormData({ ...formData, action2Title: e.target.value })}
                        placeholder="Button 2 Label (e.g. Share)"
                        className="w-full px-3 py-1.5 mb-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                      />
                      <input
                        type="url"
                        value={formData.action2Url}
                        onChange={(e) => setFormData({ ...formData, action2Url: e.target.value })}
                        placeholder="Custom URL"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Google Analytics UTM Tracking */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.utmEnabled}
                        onChange={(e) => setFormData({ ...formData, utmEnabled: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-0 mr-1"
                      />
                      <span>Append Google Analytics UTM Parameters</span>
                    </label>
                  </div>

                  {formData.utmEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                      <input
                        type="text"
                        value={formData.utmSource}
                        onChange={(e) => setFormData({ ...formData, utmSource: e.target.value })}
                        placeholder="utm_source (larapush)"
                        className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={formData.utmMedium}
                        onChange={(e) => setFormData({ ...formData, utmMedium: e.target.value })}
                        placeholder="utm_medium (push)"
                        className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={formData.utmCampaign}
                        onChange={(e) => setFormData({ ...formData, utmCampaign: e.target.value })}
                        placeholder="utm_campaign (optional)"
                        className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Scheduling */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isScheduled}
                        onChange={(e) => setFormData({ ...formData, isScheduled: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-0 mr-1"
                      />
                      <span>Schedule Campaign for Later Time</span>
                    </label>
                  </div>

                  {formData.isScheduled && (
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      <input
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                        className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-400">Background engine will dispatch at this exact time.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : formData.isScheduled ? (
              <>
                <Calendar className="w-4 h-4" />
                <span>Schedule Campaign</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Broadcast Instantly via FCM Topic</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right: Live Interactive Multi-OS Simulator */}
      <div className="lg:col-span-5">
        <LiveNotificationPreview
          title={formData.title}
          body={formData.body}
          imageUrl={formData.imageUrl}
          clickUrl={formData.clickUrl}
          target={formData.target}
          isYouTube={ytInfo.isYouTube}
          action1Title={formData.action1Title}
          action1Url={formData.action1Url}
          action2Title={formData.action2Title}
          action2Url={formData.action2Url}
        />
      </div>
    </div>
  );
}
