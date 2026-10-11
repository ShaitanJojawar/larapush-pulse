import React, { useState, useEffect } from 'react';
import { Settings, Key, Database, Upload, CheckCircle2, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { api } from '../services/api';

export default function SettingsModal({ isOpen, onClose, onSaved }) {
  const [settings, setSettings] = useState(null);
  const [jsonText, setJsonText] = useState('');
  const [vapidKey, setVapidKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data.success) {
        setSettings(data);
        if (data.vapidKey) setVapidKey(data.vapidKey);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        JSON.parse(text); // validate JSON
        setJsonText(text);
        setErrorMessage(null);
      } catch (err) {
        setErrorMessage('Uploaded file is not a valid JSON document.');
      }
    };
    reader.readAsText(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const payload = {
        vapidKey: vapidKey.trim()
      };

      if (jsonText.trim()) {
        payload.serviceAccountJson = jsonText.trim();
      }

      const res = await api.saveSettings(payload);
      if (res.success) {
        setStatusMessage('Settings updated and Firebase Admin SDK reloaded successfully!');
        setJsonText('');
        loadSettings();
        if (onSaved) onSaved();
      } else {
        setErrorMessage(res.error || 'Failed to update settings');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isFirebaseConfigured = settings?.firebase?.isConfigured;
  const projectId = settings?.firebase?.projectId;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#12141d] border border-slate-800 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Platform Configuration</h2>
              <p className="text-xs text-slate-400">Firebase Cloud Messaging Service Account & Database Status</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {/* Firebase Status */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">FCM Engine</span>
            <div className="mt-2 flex items-center gap-2">
              {isFirebaseConfigured ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400">Connected ({projectId})</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400">Ready in Simulation Mode</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {isFirebaseConfigured
                ? 'Production ready with Google FCM Multicast API'
                : 'Upload serviceAccountKey.json below for live Firebase pushes'}
            </p>
          </div>

          {/* Database Status */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Data Persistence</span>
            <div className="mt-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200">
                {settings?.database?.type || 'Persistent Storage'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {settings?.database?.isMongoConnected
                ? 'Connected to remote MongoDB cluster'
                : 'Local persistent file store active'}
            </p>
          </div>
        </div>

        {/* Feedback Messages */}
        {statusMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-5">
          {/* Service Account JSON upload or paste */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Firebase Service Account Key (serviceAccountKey.json)
              </label>
              <label className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer flex items-center gap-1 font-medium">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload .json File</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            <textarea
              rows={5}
              placeholder="Paste JSON credentials here (from Firebase Console > Project Settings > Service Accounts > Generate new private key)..."
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full font-mono text-xs p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none"
            />
          </div>

          {/* Web Push VAPID Key */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Web Push VAPID Public Key (Optional)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. BF8y... (from Firebase Cloud Messaging > Web Push certificates)"
                value={vapidKey}
                onChange={(e) => setVapidKey(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Save Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              {loading ? 'Saving...' : 'Save & Reload Config'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
