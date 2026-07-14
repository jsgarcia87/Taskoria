import React, { useState, useEffect, Suspense } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { GameProvider, useGame } from './context/GameContext';
import { useToast } from './components/common/Toast';
import CharacterCreation from './components/CharacterCreation';
import CharacterSheet from './components/CharacterSheet';
// Shop drags the entire items catalog + 757KB sprite sheet URL; defer it.
const Shop = React.lazy(() => import('./components/Shop'));
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
// Heavy / rarely-used routes are lazy-loaded so the initial bundle stays small.
// Each becomes its own chunk via vite.config manualChunks. Suspense boundary
// below the providers shows a minimal loader while the chunk arrives.
const LandingPage = React.lazy(() => import('./components/LandingPage'));

// Lightweight inline loader shown while a lazy chunk downloads — kept dependency-free
// so it ships in the main bundle and never triggers another network round-trip.
const ChunkLoader = ({ label = 'Loading…' }) => (
  <div className="min-h-[200px] flex flex-col items-center justify-center gap-3 text-rpg-gold animate-pulse">
    <div className="w-6 h-6 border-2 border-rpg-gold border-t-transparent rounded-full animate-spin" />
    <div className="text-[10px] uppercase tracking-widest font-bold">{label}</div>
  </div>
);
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

// Motion preset compartido para todas las transiciones de vista.
// y: 6 + duration 0.2 = casi imperceptible pero se nota el "cuidado".
const VIEW_MOTION = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
};

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
// Admin + Studio are admin-only / opt-in features → split into separate chunks.
const AdminPanel = React.lazy(() => import('./components/dashboard/AdminPanel'));
const CreationStudio = React.lazy(() => import('./components/dashboard/CreationStudio'));
const StudioAccessGate = React.lazy(() => import('./components/dashboard/StudioAccessGate'));
const CreationGallery = React.lazy(() => import('./components/dashboard/CreationGallery'));
import LevelUpModal from './components/common/LevelUpModal';
import DailyRewardModal from './components/dashboard/DailyRewardModal';
import Tutorial from './components/Tutorial';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import DailyMissions from './components/dashboard/DailyMissions';
import { usePetWarnings } from './utils/usePetWarnings';
import Settings from './components/Settings';
import Screensaver from './components/common/Screensaver';

const GameContent = ({ currentUser, onLogout }) => {
  const { state, actions, dispatch, activeProfileId } = useGame();
  const toast = useToast();
  // Edge-triggered toast warnings when a pet stat dips below 25%
  usePetWarnings(state.character?.pets);
  const { character, tasks } = state;
  const [activeView, setActiveView] = useState('home'); // home | profile | shop | party | tasks (mobile)

  // Beta welcome — fires once per profile, 3.5s after the tutorial dismisses,
  // pointing testers at the feedback button. Keeps the tone quiet: single toast,
  // no modal, no CTA. Persisted in localStorage so it never fires twice.
  useEffect(() => {
    if (!character || character.hasSeenTutorial !== true || !activeProfileId) return;
    const key = `beta-welcomed-${activeProfileId}`;
    if (localStorage.getItem(key)) return;
    const t = setTimeout(() => {
      toast.info("You're in closed beta. Spot an Archive rift or a spark of an idea? Tap the book icon on the corner — Archivist Ledgar will log it at the Tavern.");
      localStorage.setItem(key, '1');
    }, 3500);
    return () => clearTimeout(t);
  }, [character?.hasSeenTutorial, activeProfileId, toast]);
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

          <AnimatePresence>
            {state.showLevelUpModal && (
              <LevelUpModal
                key="level-up"
                data={state.newLevelData}
                onClose={() => actions.closeLevelUpModal()}
              />
            )}
          </AnimatePresence>

          {state.showDailyRewardModal && (
            <DailyRewardModal
              isOpen={state.showDailyRewardModal}
              data={state.dailyRewardData}
              onClose={() => actions.closeDailyReward()}
            />
          )}

          {/* First-time tutorial — runs once per character */}
          {state.character && state.character.hasSeenTutorial === false && !state.showDailyRewardModal && !state.showLevelUpModal && (
            <Tutorial onDismiss={() => dispatch({ type: 'DISMISS_TUTORIAL' })} />
          )}

          {/* PWA install prompt — surfaces only after Lvl 2+, dismissible, 14-day cooldown */}
          <PWAInstallPrompt />

          {/* View transitions — sutil fade + micro-slide sincronizado entre vistas */}
          <AnimatePresence mode="wait">
            {activeView === 'home' && (
              <motion.div key="home" {...VIEW_MOTION} className="col-span-12">
                <Dashboard setActiveView={setActiveView} />
              </motion.div>
            )}

            {activeView === 'profile' && (
              <motion.div key="profile" {...VIEW_MOTION} className="col-span-12 lg:col-span-10 lg:col-start-2">
                <CharacterSheet setActiveView={setActiveView} />
              </motion.div>
            )}

            {activeView === 'party' && (
              <motion.div key="party" {...VIEW_MOTION} className="col-span-12 lg:col-span-10 lg:col-start-2">
                <PartyView currentUser={currentUser} />
              </motion.div>
            )}

            {activeView === 'shop' && (
              <motion.div key="shop" {...VIEW_MOTION} className="col-span-12 lg:col-span-10 lg:col-start-2">
                <Suspense fallback={<ChunkLoader label="Loading shop…" />}>
                  <Shop />
                </Suspense>
              </motion.div>
            )}

            {activeView === 'calendar' && (
              <motion.div key="calendar" {...VIEW_MOTION} className="col-span-12 lg:col-span-10 lg:col-start-2">
                <CalendarView />
              </motion.div>
            )}

            {activeView === 'diary' && (
              <motion.div key="diary" {...VIEW_MOTION} className="col-span-12 lg:col-span-10 lg:col-start-2 h-[calc(100vh-140px)]">
                <Diary />
              </motion.div>
            )}

            {activeView === 'faq' && (
              <motion.div key="faq" {...VIEW_MOTION} className="col-span-12 lg:col-span-10 lg:col-start-2">
                <FAQ />
              </motion.div>
            )}

            {activeView === 'studio' && (
              <motion.div key="studio" {...VIEW_MOTION} className="col-span-12 lg:col-span-10 lg:col-start-2">
                <Suspense fallback={<ChunkLoader label="Loading Pixel Studio…" />}>
                  <StudioAccessGate currentUser={currentUser}>
                    <CreationStudio currentUser={currentUser} />
                  </StudioAccessGate>
                </Suspense>
              </motion.div>
            )}

            {activeView === 'creations' && (
              <motion.div key="creations" {...VIEW_MOTION} className="col-span-12 lg:col-span-10 lg:col-start-2">
                <Suspense fallback={<ChunkLoader label="Loading gallery…" />}>
                  <CreationGallery currentUser={currentUser} />
                </Suspense>
              </motion.div>
            )}

            {activeView === 'admin' && currentUser?.is_admin && (
              <motion.div key="admin" {...VIEW_MOTION} className="col-span-12 lg:col-span-10 lg:col-start-2">
                <Suspense fallback={<ChunkLoader label="Loading admin panel…" />}>
                  <AdminPanel currentUser={currentUser} />
                </Suspense>
              </motion.div>
            )}

            {activeView === 'settings' && (
              <motion.div key="settings" {...VIEW_MOTION} className="col-span-12 lg:col-span-10 lg:col-start-2">
                <Settings onClose={() => setActiveView('home')} currentUser={currentUser} />
              </motion.div>
            )}

            {/* Mobile Tasks View */}
            {activeView === 'tasks' && (
              <motion.div key="tasks" {...VIEW_MOTION} className="col-span-12 space-y-4">
                <h2 className="text-2xl font-heading font-bold text-rpg-gold mb-2 text-center text-shadow-glow md:hidden">QUEST LOG</h2>
                <DailyMissions />
                <TaskList isSidebar={false} setActiveView={setActiveView} />
              </motion.div>
            )}

            {/* Mobile Create Task View */}
            {activeView === 'createTask' && (
              <motion.div key="createTask" {...VIEW_MOTION} className="col-span-12">
                <TaskForm onClose={() => setActiveView('tasks')} />
              </motion.div>
            )}

            {/* Mobile Create Habit View */}
            {activeView === 'createHabit' && (
              <motion.div key="createHabit" {...VIEW_MOTION} className="col-span-12">
                <HabitForm onClose={() => setActiveView('tasks')} />
              </motion.div>
            )}
          </AnimatePresence>

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
        {/* Surface the real error so we can diagnose instead of guessing */}
        <pre className="max-w-xl text-left text-[10px] text-red-300/80 bg-black/60 border border-red-500/20 rounded-lg p-3 mb-6 overflow-auto whitespace-pre-wrap break-all">
          {String(err?.message || err)}
          {err?.stack && '\n\n' + err.stack.split('\n').slice(0, 5).join('\n')}
        </pre>
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
import CookieBanner from './components/common/CookieBanner';

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
    if (currentView === 'landing') return (
      <Suspense fallback={<ChunkLoader label="Loading…" />}>
        <LandingPage onGoToLogin={() => setCurrentView('auth')} onGoToTerms={() => setCurrentView('terms')} onGoToLegal={() => setCurrentView('legal')} />
        <CookieBanner />
      </Suspense>
    );
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
      <CookieBanner />
    </GameProvider>
  );
}

export default App;
