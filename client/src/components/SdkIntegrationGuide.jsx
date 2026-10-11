import React, { useState } from 'react';
import { Code, Copy, Check, Globe, Smartphone, BookOpen, ExternalLink, Layers } from 'lucide-react';
import Youtube from './YoutubeIcon';

export default function SdkIntegrationGuide({ projects }) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(projects?.[0]?.project_id || 'ss-banna-jojawar');

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const currentProj = (projects || []).find(p => p.project_id === selectedProjectId) || projects?.[0];

  const htmlSnippet = `<!-- 1. Include Push Notification Client SDK with your Project ID -->
<script
  src="${window.location.origin}/push-sdk.js"
  data-project-id="${selectedProjectId}"
  data-auto-prompt="true">
</script>

<!-- Or subscribe programmatically in JavaScript -->
<script>
  document.getElementById('subscribe-btn').addEventListener('click', async () => {
    // Automatically tags the subscriber to project: ${selectedProjectId}
    const result = await PushSDK.requestPermission('${selectedProjectId}');
    if (result.granted) {
      console.log('Subscribed to ${currentProj?.project_name || selectedProjectId}! FCM Token:', result.token);
    }
  });
</script>`;

  const swSnippet = `// Service Worker: Place firebase-messaging-sw.js in website root:
// Automatically handles notificationclick and YouTube new tab opening!
// File URL: ${window.location.origin}/firebase-messaging-sw.js`;

  const youtubeSnippet = `// Extracting HD YouTube Thumbnail:
// Formula: https://img.youtube.com/vi/{VIDEO_ID}/maxresdefault.jpg
// Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ
// Video ID: dQw4w9WgXcQ
// Thumbnail: https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg`;

  return (
    <div className="bg-[#12141d]/90 border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h2 className="text-xl font-bold text-white tracking-tight">Client SDK & Web Integration</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Embed one script tag into any website or YouTube landing page with your project ID.
          </p>
        </div>

        <a
          href="/demo"
          target="_blank"
          rel="noreferrer"
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 font-semibold text-xs transition flex items-center gap-1.5"
        >
          <span>Open Interactive Demo Page</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="mt-6 space-y-6">
        {/* Project Selector for Snippet Generation */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-200">Select Project to Generate Snippet:</span>
          </div>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none cursor-pointer"
          >
            {(projects || []).map(p => (
              <option key={p.project_id} value={p.project_id}>
                {p.type === 'youtube' ? '🔴' : '🌐'} {p.project_name} (ID: {p.project_id})
              </option>
            ))}
          </select>
        </div>

        {/* Step 1: HTML Snippet with data-project-id */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
              <span>Website Drop-in Snippet (HTML / React / WordPress / Webflow)</span>
            </span>
            <button
              onClick={() => handleCopy(htmlSnippet, 1)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedIndex === 1 ? 'Copied!' : 'Copy Snippet'}</span>
            </button>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
            <pre>{htmlSnippet}</pre>
          </div>
        </div>

        {/* Step 2: YouTube Link & Thumbnail Feature */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">2</span>
              <span className="flex items-center gap-1 text-red-400">
                <Youtube className="w-4 h-4" />
                <span>YouTube Link & Thumbnail Auto-Detection</span>
              </span>
            </span>
            <button
              onClick={() => handleCopy(youtubeSnippet, 2)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedIndex === 2 ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
            <pre>{youtubeSnippet}</pre>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            When you enter a YouTube video URL, PushPulse automatically pulls the highest resolution thumbnail from YouTube. When clicked by the subscriber, it automatically opens in a new tab.
          </p>
        </div>

        {/* Step 3: Service Worker info */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px]">3</span>
              <span>Service Worker (Background Notifications & Actions)</span>
            </span>
            <button
              onClick={() => handleCopy(swSnippet, 3)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              {copiedIndex === 3 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedIndex === 3 ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
            <pre>{swSnippet}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
