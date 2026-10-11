import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StatsCards from './components/StatsCards';
import NotificationComposer from './components/NotificationComposer';
import ProjectsManager from './components/ProjectsManager';
import SubscribersTable from './components/SubscribersTable';
import HistoryTable from './components/HistoryTable';
import SdkIntegrationGuide from './components/SdkIntegrationGuide';
import AutomationsManager from './components/AutomationsManager';
import OptinWidgetsManager from './components/OptinWidgetsManager';
import AnalyticsCTR from './components/AnalyticsCTR';
import WordPressIntegration from './components/WordPressIntegration';
import SettingsModal from './components/SettingsModal';
import LoginModal from './components/LoginModal';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('composer'); // 'composer' | 'automations' | 'optin' | 'projects' | 'subscribers' | 'analytics' | 'wordpress' | 'history'
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState('all'); // 'all' or specific project_id
  const [stats, setStats] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [history, setHistory] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [user, setUser] = useState({ username: 'admin', role: 'admin' });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Initial load
  useEffect(() => {
    refreshAllData();
    checkAuthSession();
  }, []);

  // When activeProject changes, refetch segmented data
  useEffect(() => {
    refreshAllData(activeProject);
  }, [activeProject]);

  const checkAuthSession = async () => {
    const res = await api.verifySession();
    if (res.success && res.user) {
      setUser(res.user);
    }
  };

  const refreshAllData = async (projId = activeProject) => {
    try {
      const [projectsRes, statsRes, subsRes, historyRes] = await Promise.all([
        api.getProjects(),
        api.getStats(projId),
        api.getSubscribers('all', '', projId),
        api.getHistory(projId)
      ]);

      if (projectsRes.success) {
        setProjects(projectsRes.projects);
      }
      if (statsRes.success) {
        setStats(statsRes.stats);
        setSystemInfo(statsRes.system);
      }
      if (subsRes.success) {
        setSubscribers(subsRes.subscribers);
      }
      if (historyRes.success) {
        setHistory(historyRes.history);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const handleSendTestPush = async (token) => {
    try {
      const res = await api.sendNotification({
        title: '🧪 LaraPush Test Notification',
        body: 'Hello! This is a test push notification delivered straight from your FCM Topics engine.',
        clickUrl: window.location.origin + '/demo',
        specificTokens: [token],
        projectId: activeProject
      });

      if (res.success) {
        alert('Test notification sent successfully to token!');
        refreshAllData(activeProject);
      } else {
        alert('Failed: ' + res.error);
      }
    } catch (err) {
      alert('Error sending test push: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('push_admin_token');
    setUser(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-slate-100">
      {/* Navigation with Project Switcher */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        user={user}
        onLogout={handleLogout}
        projects={projects}
        activeProject={activeProject}
        onSelectProject={(id) => setActiveProject(id)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Top Analytics Metrics */}
        <StatsCards
          stats={stats}
          activeProject={activeProject}
          projects={projects}
        />

        {/* View Switcher Content */}
        {activeTab === 'composer' && (
          <div className="space-y-8">
            <NotificationComposer
              stats={stats}
              projects={projects}
              activeProject={activeProject}
              onNotificationSent={() => refreshAllData(activeProject)}
            />

            {/* Quick overview of recent subscribers & campaigns below composer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SubscribersTable
                subscribers={subscribers}
                projects={projects}
                activeProject={activeProject}
                onSelectProject={(id) => setActiveProject(id)}
                onRefresh={() => refreshAllData(activeProject)}
                onSendTestPush={handleSendTestPush}
              />
              <HistoryTable
                history={history}
                projects={projects}
                activeProject={activeProject}
                onRefresh={() => refreshAllData(activeProject)}
              />
            </div>
          </div>
        )}

        {activeTab === 'automations' && (
          <AutomationsManager
            projects={projects}
            activeProject={activeProject}
          />
        )}

        {activeTab === 'optin' && (
          <OptinWidgetsManager
            projects={projects}
            activeProject={activeProject}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsManager
            projects={projects}
            activeProject={activeProject}
            onSelectProject={(id) => {
              setActiveProject(id);
              setActiveTab('composer');
            }}
            onRefresh={() => refreshAllData(activeProject)}
          />
        )}

        {activeTab === 'subscribers' && (
          <SubscribersTable
            subscribers={subscribers}
            projects={projects}
            activeProject={activeProject}
            onSelectProject={(id) => setActiveProject(id)}
            onRefresh={() => refreshAllData(activeProject)}
            onSendTestPush={handleSendTestPush}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsCTR
            stats={stats}
            history={history}
            onRefresh={() => refreshAllData(activeProject)}
            activeProject={activeProject}
          />
        )}

        {activeTab === 'wordpress' && (
          <WordPressIntegration
            activeProject={activeProject}
            projects={projects}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTable
            history={history}
            projects={projects}
            activeProject={activeProject}
            onRefresh={() => refreshAllData(activeProject)}
          />
        )}

        {activeTab === 'sdk' && (
          <SdkIntegrationGuide projects={projects} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0c0d14]/60 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-400">LaraPush Pulse Engine</span>
            <span>•</span>
            <span>
              Status:{' '}
              <strong className={systemInfo?.firebase?.isConfigured ? 'text-emerald-400' : 'text-amber-400'}>
                {systemInfo?.firebase?.isConfigured ? 'FCM Topics Live' : 'FCM 10M Simulation Mode'}
              </strong>
            </span>
            <span>•</span>
            <span>
              Domains:{' '}
              <strong className="text-slate-300">
                {projects?.length || 0} Registered
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a href="/demo" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition">
              Live Demo Webpage
            </a>
            <a href="/larapush-pulse-wp.zip" download className="text-indigo-400 hover:text-indigo-300 transition">
              WordPress Plugin (.zip)
            </a>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-slate-400 hover:text-white transition"
            >
              Settings & Keys
            </button>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSaved={() => refreshAllData(activeProject)}
        />
      )}

      {/* Login Modal */}
      {isLoginOpen && (
        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            setIsLoginOpen(false);
          }}
        />
      )}
    </div>
  );
}
