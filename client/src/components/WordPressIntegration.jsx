import React, { useState } from 'react';
import { Download, CheckCircle2, Copy, Check, ExternalLink, Zap, ShieldCheck, Globe, Code2 } from 'lucide-react';

export default function WordPressIntegration({ activeProject, projects }) {
  const [copied, setCopied] = useState(false);

  const serverUrl = window.location.origin;
  const currentProjId = activeProject !== 'all' ? activeProject : (projects?.[0]?.project_id || projects?.[0]?.id || 'all');

  const snippet = `<!-- LaraPush Pulse Universal Web Push SDK -->
<script src="${serverUrl}/push-sdk.js" async></script>
<script>
  window.addEventListener('DOMContentLoaded', function() {
    PushSDK.init({
      apiUrl: '${serverUrl}',
      projectId: '${currentProjId}',
      autoPrompt: true
    });
  });
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
            <Download className="w-3.5 h-3.5" />
            <span>Official WordPress Plugin Release</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            WordPress Plugin & Multi-Platform Integration
          </h2>
          <p className="text-xs text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
            Install the LaraPush Pulse plugin on any WordPress site in 30 seconds. Includes automatic Push-on-Publish and floating opt-in bells.
          </p>
        </div>

        {/* 1-Click Download Button */}
        <a
          href="/api/download/wordpress-plugin"
          download="larapush-pulse-wp.zip"
          className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/30 transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4 animate-bounce" />
          <span>Download WordPress Plugin (.zip)</span>
        </a>
      </div>

      {/* 3 Step Installation Walkthrough */}
      <div className="bg-[#12141d]/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
          <span>How to Install in WordPress (3 Simple Steps)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 relative">
            <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center mb-3">
              1
            </span>
            <h4 className="text-xs font-bold text-white mb-1">Download & Upload ZIP</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Click the button above to download <code>larapush-pulse-wp.zip</code>. In WordPress admin, go to <strong>Plugins &rarr; Add New &rarr; Upload Plugin</strong> and activate it.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 relative">
            <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center mb-3">
              2
            </span>
            <h4 className="text-xs font-bold text-white mb-1">Enter Server URL & ID</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Open the <strong>LaraPush Pulse</strong> menu in your WordPress dashboard. Enter your server URL: <code className="text-indigo-400 font-mono break-all">{serverUrl}</code> and your Project ID.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 relative">
            <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center mb-3">
              3
            </span>
            <h4 className="text-xs font-bold text-white mb-1">Automatic Push-on-Publish</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              That's it! Whenever you publish any new blog post in WordPress, your subscribers will automatically receive instant push notifications!
            </p>
          </div>
        </div>
      </div>

      {/* Alternative: Shopify / Custom HTML Snippet */}
      <div className="bg-[#12141d]/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span>Shopify, Blogger & Custom HTML Code</span>
          </h3>
          <button
            onClick={handleCopy}
            className="text-xs font-bold px-3 py-1 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 flex items-center gap-1.5 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Snippet'}</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mb-3">
          For non-WordPress sites (Shopify, Webflow, PHP, HTML), paste this script tag inside your template header:
        </p>
        <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-300 font-mono overflow-x-auto leading-relaxed">
          {snippet}
        </pre>
      </div>
    </div>
  );
}
