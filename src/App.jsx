import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import CharacterCreation from './components/CharacterCreation';
import CharacterSheet from './components/CharacterSheet';
import Shop from './components/Shop';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import CalendarView from './components/dashboard/CalendarView';
import PixelIcon from './components/common/PixelIcon';
import { TASK_DIFFICULTY, calculateXpReq } from './utils/gameUtils';

// Recompute xp.max for every character so saves created under the previous
// XP curve get aligned to the current formula. Safe to run repeatedly.
const migrateXpCurve = (familyData) => {
    if (!familyData?.profiles) return familyData;
    return {
        ...familyData,
        profiles: familyData.profiles.map(profile => {
            const char = profile?.state?.character;
            if (!char || typeof char.level !== 'number') return profile;
            const expectedMax = calculateXpReq(char.level);
            if (char.xp?.max === expectedMax) return profile;
            return {
                ...profile,
                state: {
                    ...profile.state,
                    character: {
                        ...char,
                        xp: { current: char.xp?.current || 0, max: expectedMax }
                    }
                }
            };
        })
    };
};
import Layout_v2 from './components/Layout_v2';
import Diary from './components/Diary';

const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 min-w-[64px] transition-all duration-200 rounded-xl
      ${active
        ? 'bg-purple-600/20 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] border border-purple-500/50'
        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
      }`}
  >
    <Icon size={20} className={active ? "drop-shadow-glow" : ""} />
    <span className="text-[10px] font-bold tracking-wider mt-1">{label}</span>
  </button>
);

import PartyView from './components/dashboard/PartyView';
import TaskList from './components/dashboard/TaskList';
import TaskForm from './components/dashboard/TaskForm';
import HabitForm from './components/dashboard/HabitForm';
import FAQ from './components/dashboard/FAQ';
import AdminPanel from './components/dashboard/AdminPanel';
import CreationStudio from './components/dashboard/CreationStudio';
import CreationGallery from './components/dashboard/CreationGallery';
import LevelUpModal from './components/common/LevelUpModal';
import DailyRewardModal from './components/dashboard/DailyRewardModal';
import Settings from './components/Settings';
import Screensaver from './components/common/Screensaver';

const GameContent = ({ currentUser, onLogout }) => {
  const { state, actions } = useGame();
  const { character, tasks } = state;
  const [activeView, setActiveView] = useState('home'); // home | profile | shop | party | tasks (mobile)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showScreensaver, setShowScreensaver] = useState(false);
  const { screensaverSettings } = state;

  // Inactivity Logic for Screensaver
  React.useEffect(() => {
    if (!screensaverSettings?.enabled) {
      setShowScreensaver(false);
      return;
    }

    let inactivityTimer;

    const resetTimer = () => {
      setShowScreensaver(false);
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        setShowScreensaver(true);
      }, (screensaverSettings.timeout || 60) * 1000);
    };

    // Initial timer
    resetTimer();

    // Event listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(name => document.addEventListener(name, resetTimer));

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(name => document.removeEventListener(name, resetTimer));
    };
  }, [screensaverSettings?.enabled, screensaverSettings?.timeout]);

  // --- MOCK DATA FOR RIGHT SIDEBAR (Active Tasks) ---
  const activeTasks = tasks.filter(t => !t.completed);

  // Calculate notifications
  const todayLocalDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
  const overdueOrDueTodayTasks = tasks.filter(t => !t.completed && t.dueDate && t.dueDate <= todayLocalDate);
  const notificationCount = overdueOrDueTodayTasks.length + (currentUser.unreadMessages || 0);

  // If no character is set inside this profile, force creation first
  if (!character) {
    return (
      <CharacterCreation
        onComplete={(name, charClass, avatarId, stats, colors, petType) => {
          actions.createCharacter(name, charClass, avatarId, stats, colors, petType);
        }}
      />
    );
  }

  try {
    return (
      <>
      <Layout_v2
        activeView={activeView}
        setActiveView={setActiveView}
        currentUser={currentUser}
        onLogout={onLogout}
        notificationCount={notificationCount}
        unreadMessageCount={currentUser.unreadMessages || 0}
        overdueTasks={overdueOrDueTodayTasks}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {state.showLevelUpModal && (
            <LevelUpModal
              data={state.newLevelData}
              onClose={() => actions.closeLevelUpModal()}
            />
          )}

          {state.showDailyRewardModal && (
            <DailyRewardModal
              isOpen={state.showDailyRewardModal}
              data={state.dailyRewardData}
              onClose={() => actions.closeDailyReward()}
            />
          )}

          {/* LEFT/CENTER COLUMN (Dashboard) */}
          {activeView === 'home' && (
            <Dashboard setActiveView={setActiveView} />
          )}

          {activeView === 'profile' && (
            <div className="col-span-12 lg:col-span-10 lg:col-start-2">
              <CharacterSheet />
            </div>
          )}

          {activeView === 'party' && (
            <div className="col-span-12 lg:col-span-10 lg:col-start-2">
              <PartyView currentUser={currentUser} />
            </div>
          )}

          {activeView === 'shop' && (
            <div className="col-span-12 lg:col-span-10 lg:col-start-2">
              <Shop />
            </div>
          )}

          {activeView === 'calendar' && (
            <div className="col-span-12 lg:col-span-10 lg:col-start-2">
              <CalendarView />
            </div>
          )}

          {activeView === 'diary' && (
            <div className="col-span-12 lg:col-span-10 lg:col-start-2 h-[calc(100vh-140px)]">
              <Diary />
            </div>
          )}

          {activeView === 'faq' && (
            <div className="col-span-12 lg:col-span-10 lg:col-start-2">
              <FAQ />
            </div>
          )}

          {activeView === 'studio' && (
            <div className="col-span-12 lg:col-span-10 lg:col-start-2">
              <CreationStudio currentUser={currentUser} />
            </div>
          )}

          {activeView === 'creations' && (
            <div className="col-span-12 lg:col-span-10 lg:col-start-2">
              <CreationGallery currentUser={currentUser} />
            </div>
          )}

          {activeView === 'admin' && currentUser?.is_admin && (
            <div className="col-span-12 lg:col-span-10 lg:col-start-2">
              <AdminPanel currentUser={currentUser} />
            </div>
          )}

          {activeView === 'settings' && (
            <div className="col-span-12 lg:col-span-10 lg:col-start-2">
              <Settings onClose={() => setActiveView('home')} />
            </div>
          )}

          {/* Mobile Tasks View */}
          {activeView === 'tasks' && (
            <div className="col-span-12">
              <h2 className="text-2xl font-heading font-bold text-rpg-gold mb-6 text-center text-shadow-glow md:hidden">QUEST LOG</h2>
              <TaskList isSidebar={false} setActiveView={setActiveView} />
            </div>
          )}

          {/* Mobile Create Task View */}
          {activeView === 'createTask' && (
            <div className="col-span-12">
              <TaskForm onClose={() => setActiveView('tasks')} />
            </div>
          )}

          {/* Mobile Create Habit View */}
          {activeView === 'createHabit' && (
            <div className="col-span-12">
              <HabitForm onClose={() => setActiveView('tasks')} />
            </div>
          )}

        </div>
      </Layout_v2>
      {showScreensaver && <Screensaver onDismiss={() => setShowScreensaver(false)} />}
      </>
    );
  } catch (err) {
    console.error("Critical rendering error in GameContent:", err);
    return (
      <div className="min-h-screen bg-rpg-bg flex flex-col items-center justify-center p-8 text-center">
        <div className="text-6xl mb-6">⚠️</div>
        <h2 className="text-2xl font-heading font-bold text-rpg-red mb-4 uppercase tracking-widest text-shadow-glow">Recovery System Active</h2>
        <p className="text-gray-400 max-w-md mb-8">
          A conflict in your profile data was detected. Don't worry, your data is safe! Please refresh the page to try again.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="glass-btn-primary px-8 py-4 font-bold text-lg shadow-rpg-gold/30"
        >
          FORCE RELOAD
        </button>
        <button 
          onClick={onLogout}
          className="mt-8 text-xs text-gray-600 hover:text-rpg-gold uppercase tracking-widest font-bold transition-colors"
        >
          Back to Profile Selection
        </button>
      </div>
    );
  }
}

import ProfileSelection from './components/ProfileSelection';
import TermsAndConditions from './components/TermsAndConditions';
import LegalNotice from './components/LegalNotice';

function App() {
  const [currentUser, setCurrentUser] = useState(null); // The actual logged-in web user
  const [familyData, setFamilyData] = useState(null); // The consolidated JSON of all profiles
  const [activeProfileId, setActiveProfileId] = useState(null); // The currently playing hero
  const [isLoading, setIsLoading] = useState(true); // Start true to check session
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'auth' | 'terms' | 'legal'
  const [globalUnreadMsgCount, setGlobalUnreadMsgCount] = useState(0);

  // Request Notification Permissions for PWA Push
  React.useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            console.log("Push Notifications enabled for Taskoria!");
          }
        });
      }
    }
  }, []);
  // Poll for unread messages
  React.useEffect(() => {
    if (!currentUser) return;
    const fetchUnread = async () => {
      try {
        const profileFilter = activeProfileId ? `&profile_id=${activeProfileId}` : '';
        const res = await fetch(`api/messages.php?action=unread_count&user_id=${currentUser.id}${profileFilter}`);
        const data = await res.json();
        if (data.success) {
          setGlobalUnreadMsgCount(data.total);
        }
      } catch (e) { }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [currentUser, activeProfileId]);
  // Check for persistent session on mount
  React.useEffect(() => {
    const savedSession = localStorage.getItem('taskoria_session');
    if (savedSession) {
      try {
        const user = JSON.parse(savedSession);
        // Automatically attempt login flow if we possess the user id
        handleLogin(user);
      } catch (e) {
        localStorage.removeItem('taskoria_session');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  // When user logs in with email/pass
  const handleLogin = async (user) => {
    setCurrentUser(user);
    // Persist session
    localStorage.setItem('taskoria_session', JSON.stringify({ id: user.id, username: user.username, email: user.email }));
    setIsLoading(true);
    try {
      // 1. Check local cache first in case we are offline
      const localDataStr = localStorage.getItem('taskoria_family_data_' + user.id);
      let localData = null;
      if (localDataStr) {
        try { localData = JSON.parse(localDataStr); } catch (e) { }
      }

      // 2. Attempt to fetch from server
      let data = null;
      try {
        const res = await fetch(`api/load_game.php?user_id=${user.id}`);
        const text = await res.text();
        data = JSON.parse(text);
      } catch (fetchErr) {
        console.warn("Failed to fetch from server, falling back to local cache if available", fetchErr);
        // data remains null
      }

      // 3. Fallback logic: Use server data if valid, otherwise local data
      let finalData = (data && !data.error) ? data : localData;

      if (finalData && finalData.profiles) {
        // It's already in the new Family format
        setFamilyData(migrateXpCurve(finalData));
      } else if (finalData && (finalData.character || finalData.tasks)) {
        // It's the old single-user format. Migrate them to Family format automatically.
        const migratedProfile = {
          id: 'prof_' + Date.now(),
          name: finalData.character?.name || 'Hero 1',
          state: finalData
        };
        setFamilyData(migrateXpCurve({
          profiles: [migratedProfile],
          lastActiveProfile: migratedProfile.id
        }));
      } else {
        // First time ever playing, empty family
        setFamilyData({ profiles: [] });
      }
    } catch (e) {
      console.error("Critical failure loading family structure", e);
      setFamilyData({ profiles: [] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear session and state
    localStorage.removeItem('taskoria_session');
    setCurrentUser(null);
    setFamilyData(null);
    setActiveProfileId(null);
    window.location.reload();
  };

  const handleCreateProfile = (name) => {
    const newProfile = {
      id: 'prof_' + Date.now() + Math.random().toString(36).substr(2, 5),
      name: name,
      state: {
        // Empty state, will be initialized inside GameProvider via RESTORE_STATE or default
        character: null
      }
    };

    const updatedFamily = {
      ...familyData,
      profiles: [...(familyData?.profiles || []), newProfile]
    };

    setFamilyData(updatedFamily);
    setActiveProfileId(newProfile.id);
  };

  const handleSelectProfile = (id) => {
    setActiveProfileId(id);
  };

  const handleSwitchProfile = () => {
    setActiveProfileId(null);
  };

  if (!currentUser) {
    if (currentView === 'landing') return <LandingPage onGoToLogin={() => setCurrentView('auth')} onGoToTerms={() => setCurrentView('terms')} onGoToLegal={() => setCurrentView('legal')} />;
    if (currentView === 'auth') return <Auth onLogin={handleLogin} onBackToLanding={() => setCurrentView('landing')} />;
    if (currentView === 'terms') return <TermsAndConditions onBack={() => setCurrentView('landing')} />;
    if (currentView === 'legal') return <LegalNotice onBack={() => setCurrentView('landing')} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-rpg-bg flex items-center justify-center font-heading text-rpg-gold text-2xl animate-pulse">
        Summoning Heroes...
      </div>
    );
  }

  // Phase 1: Not selected a profile yet
  if (!activeProfileId) {
    return (
      <ProfileSelection
        profiles={familyData?.profiles || []}
        onSelectProfile={handleSelectProfile}
        onCreateProfile={handleCreateProfile}
        onLogout={handleLogout}
      />
    );
  }

  // Phase 2: Playing the Game
  const activeProfile = familyData?.profiles?.find(p => p.id === activeProfileId);

  // We need to intercept the GameLogout to just "Switch Profile" instead of fully logging out of the web
  const onGameLogout = () => {
    if (confirm("Switch to a different hero?")) {
      handleSwitchProfile();
    }
  };

  return (
    <GameProvider
      currentUser={currentUser}
      familyData={familyData}
      activeProfileId={activeProfileId}
      setFamilyData={setFamilyData}
    >
      <GameContent currentUser={{ ...currentUser, unreadMessages: globalUnreadMsgCount }} onLogout={onGameLogout} />
    </GameProvider>
  );
}

export default App;
