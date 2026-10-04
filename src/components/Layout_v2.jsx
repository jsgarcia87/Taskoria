import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Menu, Bell, LogOut, Settings, HelpCircle, Shield, Cloud, CloudOff, RefreshCw, MessageSquare } from 'lucide-react'; // Retaining some small UI icons as vector for readability if needed, or we can replace all
import PixelIcon from './common/PixelIcon';
import ModernPixelAvatar from './common/ModernPixelAvatar';
import { NAV_DESTINATIONS, isDestinationActive } from './common/navDestinations';
import { CHARACTERS } from '../data/characters';
import { NumberTicker } from './common/NumberTicker';
import FeedbackButton from './common/FeedbackButton';
import BottomNav from './common/BottomNav';
import FloatingTextLayer from './common/FloatingTextLayer';
import ChatInbox from './dashboard/ChatInbox';
import ChatModal from './dashboard/ChatModal';
import NotificationDropdown from './dashboard/NotificationDropdown';
import DashboardLandscape from './dashboard/DashboardLandscape';
import { useGame, SYNC_STATUS } from '../context/GameContext';

const Layout_v2 = ({
    children,
    activeView,
    setActiveView,
    currentUser,
    onLogout,
    notificationCount = 0,
    unreadMessageCount = 0,
    friendRequestCount = 0,
    overdueTasks = []
}) => {
    const { state, syncStatus, activeProfileId } = useGame();
    const { character } = state || {}; // Handle case where GameContext might not be fully initialized or character doesn't exist
    const shouldReduce = useReducedMotion();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isInboxOpen, setIsInboxOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [confirmLogout, setConfirmLogout] = useState(false);
    const [activeChatFriend, setActiveChatFriend] = useState(null);

    // Determine ambient world lighting based on real-world time
    const getAtmosphereGlow = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 11) return 'from-amber-500/30 via-orange-500/10 to-transparent'; // Dawn/Morning
        if (hour >= 11 && hour < 16) return 'from-blue-500/20 via-sky-500/10 to-transparent'; // Day
        if (hour >= 16 && hour < 20) return 'from-orange-600/20 via-red-600/10 to-transparent'; // Sunset
        return 'from-purple-900/40 via-indigo-900/10 to-transparent'; // Night
    };

    const desktopNavItems = [...NAV_DESTINATIONS];

    if (currentUser?.is_admin) {
        desktopNavItems.push({ id: 'admin', label: 'Admin', icon: 'shield' });
    }

    // Spatial direction for view transitions — views have a conceptual
    // left-to-right order; navigating "right" slides content left and vice versa.
    const VIEW_ORDER = { home: 0, tasks: 1, createTask: 1, createHabit: 1, party: 2, creations: 3, studio: 3, diary: 4, calendar: 4, profile: 5, admin: 6 };
    const prevViewRef = useRef(activeView);
    const directionRef = useRef(1);
    if (prevViewRef.current !== activeView) {
        const prevIdx = VIEW_ORDER[prevViewRef.current] ?? 0;
        const nextIdx = VIEW_ORDER[activeView] ?? 0;
        directionRef.current = nextIdx >= prevIdx ? 1 : -1;
        prevViewRef.current = activeView;
    }
    const slideX = shouldReduce ? 0 : 12 * directionRef.current;

    return (
        <div className="min-h-screen text-white flex flex-col font-sans selection:bg-rpg-gold/30 bg-rpg-bg overflow-x-hidden">
            {/* --- TOP HUD HEADER --- */}
            <header className="h-20 px-4 md:px-6 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl bg-rpg-panelDark/80 border-b border-white/5 transition-all duration-300">

                {/* Logo Section */}
                <div className="flex items-center gap-4 group cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="w-16 h-16 flex items-center justify-center relative overflow-hidden -ml-2">
                        <div className="absolute inset-0 bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 z-20 mix-blend-overlay"></div>
                        <img src="./ico_sinbg.svg" alt="Taskoria Icon" className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                    </div>
                    <div className="flex flex-col">
                        <div className="text-xl font-heading font-bold tracking-tight text-white hidden md:block">
                            TASKORIA <span className="text-rpg-gold text-xs align-top">BETA</span>
                        </div>
                        <div className="hidden lg:block text-[9px] text-gray-500/60 font-mono tracking-widest uppercase">Gamified Productivity</div>
                    </div>
                </div>

                {/* --- DESKTOP / TABLET NAVIGATION — compact on tablet, generous on desktop --- */}
                <nav className="hidden md:flex items-center gap-1 lg:gap-2 bg-white/5 p-1 lg:p-1.5 rounded-2xl border border-white/5 backdrop-blur-md shadow-glass overflow-x-auto scrollbar-hide shrink min-w-0">
                    {desktopNavItems.map(item => {
                        const isActive = isDestinationActive(item, activeView);
                        return (
                            <motion.button
                                key={item.id}
                                onClick={() => setActiveView(item.id)}
                                whileTap={{ scale: 0.97 }}
                                transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                                className={`flex items-center gap-1.5 lg:gap-2 px-2.5 2xl:px-4 py-2 2xl:py-2.5 rounded-xl relative overflow-hidden transition-colors duration-200 shrink-0
                ${isActive
                                    ? 'text-rpg-gold'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                                aria-label={item.label}
                                aria-current={isActive ? 'page' : undefined}
                                title={item.label}
                            >
                                {/* Fondo activo — morfa entre tabs con layoutId */}
                                {isActive && (
                                    <motion.div
                                        layoutId="active-desktop-nav-bg"
                                        className="absolute inset-0 bg-rpg-bg shadow-inner border border-white/5 rounded-xl"
                                        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                                    />
                                )}
                                <span className="relative z-10 flex">
                                    <PixelIcon name={item.icon} size={16} className={isActive ? 'drop-shadow-glow' : ''} />
                                    {item.id === 'party' && friendRequestCount > 0 && (
                                        <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-[3px] rounded-full bg-rpg-gold text-rpg-bg text-[9px] font-bold flex items-center justify-center leading-none ring-2 ring-rpg-panelDark" aria-label={`${friendRequestCount} party requests`}>{friendRequestCount}</span>
                                    )}
                                </span>
                                <span className={`relative z-10 hidden 2xl:inline font-bold text-xs uppercase tracking-wider ${isActive ? 'text-rpg-gold' : ''}`}>
                                    {item.label}
                                </span>
                                {/* Barrita inferior activa — también morfa */}
                                {isActive && (
                                    <motion.div
                                        layoutId="active-desktop-nav-underline"
                                        className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-rpg-gold to-transparent opacity-70 z-10"
                                        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </nav>

                {/* User / Actions Section */}
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">

                    {/* Persistent HUD — compact on tablet (no time stat), full on desktop */}
                    {character && (
                        <div className="hidden md:flex items-center gap-2 lg:gap-3 bg-black/40 border border-white/10 rounded-xl px-2.5 lg:px-4 py-1.5 shadow-glass backdrop-blur-md">
                            <div className="flex items-center gap-1.5 min-w-[40px] lg:min-w-[50px]" title="Health Points">
                                <PixelIcon name="heart" size={14} color="#f87171" className="fill-current drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                                <NumberTicker value={character.hp?.current ?? 0} className="text-white text-xs font-bold font-mono" />
                                <span className="hidden xl:inline text-[8px] text-gray-500 uppercase tracking-wider font-bold">HP</span>
                            </div>
                            <div className="hidden lg:block h-4 w-px bg-white/20"></div>
                            <div className="hidden lg:flex items-center gap-1.5 min-w-[50px]" title="Time Points">
                                <PixelIcon name="clock" size={14} color="#60a5fa" className="fill-current drop-shadow-[0_0_5px_rgba(96,165,250,0.8)]" />
                                <NumberTicker value={character.timePoints ?? 0} className="text-white text-xs font-bold font-mono" />
                                <span className="hidden xl:inline text-[8px] text-gray-500 uppercase tracking-wider font-bold">TP</span>
                            </div>
                            <div className="h-4 w-px bg-white/20"></div>
                            <div className="flex items-center gap-1.5 min-w-[40px] lg:min-w-[50px]" title="Gold">
                                <PixelIcon name="coins" size={14} color="#fbbf24" className="fill-current drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
                                <NumberTicker value={character.gold ?? 0} className="text-white text-xs font-bold font-mono text-rpg-gold text-shadow-glow" />
                            </div>
                        </div>
                    )}

                    {/* Hero — avatar opens the profile on every screen size */}
                    {character && (() => {
                        const heroData = CHARACTERS.find(c => c.id === character.avatarId) || CHARACTERS.find(c => c.class === character.class) || CHARACTERS[0];
                        const onProfile = activeView === 'profile';
                        return (
                            <button
                                onClick={() => setActiveView('profile')}
                                aria-label={`Hero profile: ${character.name}, level ${character.level}`}
                                aria-current={onProfile ? 'page' : undefined}
                                title="Hero profile"
                                className={`flex items-center gap-2.5 rounded-full p-0.5 2xl:pr-4 transition-colors ${onProfile ? 'bg-rpg-gold/15 ring-2 ring-rpg-gold/60' : 'bg-black/25 ring-1 ring-white/15 hover:ring-rpg-gold/50'}`}
                            >
                                <span className="relative w-9 h-9 rounded-full overflow-hidden bg-rpg-panelDark flex items-center justify-center">
                                    <ModernPixelAvatar type={heroData.avatarType || heroData.id} headOnly scale={1.4} customColors={character.avatarColors} />
                                </span>
                                <span className="hidden 2xl:flex flex-col items-start leading-none">
                                    <span className="text-sm font-bold text-rpg-gold">{character.name}</span>
                                    <span className="mt-1 text-[11px] text-gray-400 flex items-center gap-1">
                                        {character.isResting && <PixelIcon name="moon" size={10} color="#c7d2fe" />}
                                        Lv {character.level}
                                    </span>
                                </span>
                            </button>
                        );
                    })()}

                    <div className="flex items-center gap-1 sm:gap-3">
                        {/* Sync Status Badge */}
                        <div className="hidden sm:flex items-center justify-center p-2 rounded-xl transition-all h-10 w-10">
                            {syncStatus === SYNC_STATUS.SAVING && (
                                <RefreshCw size={18} className="text-gray-400 animate-spin" title="Saving..." />
                            )}
                            {syncStatus === SYNC_STATUS.SAVED && (
                                <Cloud size={18} className="text-green-400" title="Saved to Cloud" />
                            )}
                            {syncStatus === SYNC_STATUS.ERROR && (
                                <CloudOff size={18} className="text-red-400" title="Offline - Saved Locally" />
                            )}
                            {syncStatus === SYNC_STATUS.IDLE && (
                                <Cloud size={18} className="text-gray-600" title="In Sync" />
                            )}
                        </div>

                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                type="button"
                                aria-label={notificationCount > 0 ? `Notifications (${notificationCount})` : 'Notifications'}
                                aria-expanded={isNotificationsOpen}
                                className="group relative p-2 rounded-xl hover:bg-white/5 transition-colors"
                                onClick={() => {
                                    setIsNotificationsOpen(!isNotificationsOpen);
                                    if (isMenuOpen) setIsMenuOpen(false);
                                    if (isInboxOpen) setIsInboxOpen(false);
                                }}
                            >
                                <Bell size={22} className={`transition-colors ${isNotificationsOpen ? 'text-rpg-gold' : 'text-gray-400 group-hover:text-rpg-gold'}`} />
                                {notificationCount > 0 && (
                                    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rpg-red ring-2 ring-rpg-panelDark flex items-center justify-center text-[10px] font-bold text-white leading-none">
                                        {notificationCount}
                                    </span>
                                )}
                            </button>

                            {isNotificationsOpen && (
                                <>
                                    <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={() => setIsNotificationsOpen(false)} />
                                    <div className="absolute right-0 top-full mt-4 z-50">
                                        <NotificationDropdown 
                                            isOpen={isNotificationsOpen}
                                            onClose={() => setIsNotificationsOpen(false)}
                                            overdueTasks={overdueTasks}
                                            friendRequests={friendRequestCount}
                                            setActiveView={setActiveView}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Messages Inbox */}
                        <div className="relative">
                            <button
                                type="button"
                                aria-label={unreadMessageCount > 0 ? `Messages (${unreadMessageCount} unread)` : 'Messages'}
                                aria-expanded={isInboxOpen}
                                className={`group relative p-2 rounded-xl transition-colors ${isInboxOpen ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400 hover:text-indigo-400'}`}
                                onClick={() => {
                                    setIsInboxOpen(!isInboxOpen);
                                    if (isMenuOpen) setIsMenuOpen(false);
                                    if (isNotificationsOpen) setIsNotificationsOpen(false);
                                }}
                            >
                                <MessageSquare size={22} className="transition-colors" />
                                {unreadMessageCount > 0 && (
                                    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-indigo-500 ring-2 ring-rpg-panelDark flex items-center justify-center text-[10px] font-bold text-white leading-none">
                                        {unreadMessageCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                className={`p-2 rounded-xl transition-all duration-200 ${isMenuOpen ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                onClick={() => { setIsMenuOpen(!isMenuOpen); setConfirmLogout(false); }}
                                aria-label="Menu"
                                aria-expanded={isMenuOpen}
                            >
                                <Menu size={24} />
                            </button>

                            {isMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
                                        onClick={() => { setIsMenuOpen(false); setConfirmLogout(false); }}
                                    />
                                    <div className="absolute right-0 top-full mt-4 w-60 bg-rpg-panel/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 p-2 z-50 shadow-2xl ring-1 ring-white/10">
                                        <div className="px-4 py-3 border-b border-white/5 mb-2">
                                            <p className="text-sm font-bold text-white">{currentUser.username}</p>
                                            <p className="text-xs text-gray-400">{character ? `${character.name} · Level ${character.level}` : 'No hero yet'}</p>
                                        </div>

                                        <button
                                            onClick={() => { setActiveView('profile'); setIsMenuOpen(false); }}
                                            className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-all flex items-center gap-3 group"
                                        >
                                            <PixelIcon name="user" size={16} className="group-hover:text-rpg-blue" />
                                            Hero profile
                                        </button>

                                        {currentUser?.is_admin && (
                                            <button
                                                onClick={() => { setActiveView('admin'); setIsMenuOpen(false); }}
                                                className="w-full text-left px-4 py-3 text-sm text-rpg-gold hover:bg-rpg-gold/10 hover:text-white rounded-xl transition-all flex items-center gap-3 group border border-transparent hover:border-rpg-gold/30"
                                            >
                                                <Shield size={16} className="group-hover:drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
                                                Super-User Admin
                                            </button>
                                        )}

                                        <button
                                            onClick={() => { setActiveView('faq'); setIsMenuOpen(false); }}
                                            className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-all flex items-center gap-3 group"
                                        >
                                            <HelpCircle size={16} className="group-hover:text-rpg-gold" />
                                            How to play
                                        </button>

                                        <button
                                            onClick={() => { window.dispatchEvent(new Event('taskoria:open-feedback')); setIsMenuOpen(false); }}
                                            className="lg:hidden w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-all flex items-center gap-3 group"
                                        >
                                            <MessageSquare size={16} className="group-hover:text-rpg-gold" />
                                            Send feedback
                                        </button>

                                        <button
                                            onClick={() => { setActiveView('settings'); setIsMenuOpen(false); }}
                                            className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-all flex items-center gap-3 group"
                                        >
                                            <Settings size={16} className="group-hover:text-gray-100" />
                                            Settings
                                        </button>

                                        <div className="h-px bg-white/5 my-2 mx-2"></div>

                                        <button
                                            onClick={onLogout}
                                            className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors flex items-center gap-3 group"
                                        >
                                            <PixelIcon name="users" size={16} />
                                            Switch hero
                                        </button>

                                        {confirmLogout ? (
                                            <button
                                                onClick={() => {
                                                    setConfirmLogout(false);
                                                    window.location.reload();
                                                }}
                                                onMouseLeave={() => setConfirmLogout(false)}
                                                className="w-full text-center px-4 py-3 text-sm text-red-100 bg-red-900/40 hover:bg-red-900 hover:text-white rounded-xl transition-colors flex items-center justify-center gap-2 group font-bold border border-red-500/50 mt-1"
                                            >
                                                <LogOut size={16} className="text-white" />
                                                Confirm log out
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmLogout(true)}
                                                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors flex items-center gap-3 group border border-transparent"
                                            >
                                                <LogOut size={16} className="group-hover:text-red-400" />
                                                Log out
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* --- MAIN CONTENT & GRADIENT OVERLAY --- */}
            <main className="flex-1 relative transition-colors duration-1000 overflow-x-hidden overflow-y-auto w-full">
                {/* Mesh Gradient Ambient Background */}
                <div className={`absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b ${getAtmosphereGlow()} blur-[100px] pointer-events-none mix-blend-screen opacity-70 user-select-none transition-all duration-1000`} />

                {/* Camp landscape — silueta pixel-art de fondo (solo en Camp).
                    Vive aquí, fuera del motion.div transformado, para que su
                    `position: fixed` se resuelva contra el viewport. */}
                {activeView === 'home' && <DashboardLandscape />}

                {/* Content Container — crossfade + micro-slide entre vistas.
                    `initial={false}` evita animar en el primer mount de la sesión. */}
                <div className="max-w-7xl mx-auto p-4 md:p-6 pb-40 md:pb-8 relative z-10 w-full min-h-[calc(100vh-80px)] overflow-x-hidden">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={activeView}
                            initial={shouldReduce ? { opacity: 0 } : { opacity: 0, x: slideX }}
                            animate={shouldReduce ? { opacity: 1 } : { opacity: 1, x: 0 }}
                            exit={shouldReduce ? { opacity: 0 } : { opacity: 0, x: -slideX }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {React.Children.map(children, child => {
                                if (React.isValidElement(child)) {
                                    return React.cloneElement(child, { onOpenChat: setActiveChatFriend });
                                }
                                return child;
                            })}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* --- MOBILE BOTTOM NAVIGATION --- */}
            <BottomNav activeView={activeView} setActiveView={setActiveView} badges={{ party: friendRequestCount }} />

            {/* --- BETA FEEDBACK BUTTON (floating, all views) --- */}
            <FeedbackButton currentUser={currentUser} activeProfileId={activeProfileId} />

            {/* Inbox (rendered at root so its fixed positioning is viewport-relative, not trapped by the blurred header) */}
            {isInboxOpen && (
                <>
                    <div className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[1px]" onClick={() => setIsInboxOpen(false)} />
                    <ChatInbox
                        isOpen={isInboxOpen}
                        onClose={() => setIsInboxOpen(false)}
                        currentUser={currentUser}
                        onOpenChat={(friend) => {
                            setActiveChatFriend(friend);
                            setIsInboxOpen(false);
                        }}
                    />
                </>
            )}

            <ChatModal
                isOpen={!!activeChatFriend}
                onClose={() => setActiveChatFriend(null)}
                currentUser={currentUser}
                friend={activeChatFriend}
            />

            <FloatingTextLayer />
        </div>
    );
};

export default Layout_v2;
