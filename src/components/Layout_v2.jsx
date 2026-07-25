import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Menu, Bell, LogOut, Settings, HelpCircle, Shield, Cloud, CloudOff, RefreshCw, MessageSquare } from 'lucide-react'; // Retaining some small UI icons as vector for readability if needed, or we can replace all
import PixelIcon from './common/PixelIcon';
import { NumberTicker } from './common/NumberTicker';
import FeedbackButton from './common/FeedbackButton';
import BottomNav from './common/BottomNav';
import FloatingTextLayer from './common/FloatingTextLayer';
import ChatInbox from './dashboard/ChatInbox';
import ChatModal from './dashboard/ChatModal';
import NotificationDropdown from './dashboard/NotificationDropdown';
import { useGame, SYNC_STATUS } from '../context/GameContext';

const Layout_v2 = ({
    children,
    activeView,
    setActiveView,
    currentUser,
    onLogout,
    notificationCount = 0,
    unreadMessageCount = 0,
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

    const desktopNavItems = [
        { id: 'home', label: 'Camp', icon: 'home' },
        { id: 'party', label: 'Town', icon: 'users' },
        { id: 'diary', label: 'Diary', icon: 'book' },
        { id: 'profile', label: 'Hero', icon: 'user' },
        { id: 'studio', label: 'Studio', icon: 'sword' },
        { id: 'creations', label: 'World', icon: 'trophy' },
    ];

    if (currentUser?.is_admin) {
        desktopNavItems.push({ id: 'admin', label: 'Admin', icon: 'shield' });
    }

    // Spatial direction for view transitions — views have a conceptual
    // left-to-right order; navigating "right" slides content left and vice versa.
    const VIEW_ORDER = { home: 0, tasks: 0, createTask: 0, party: 1, diary: 2, profile: 3, studio: 4, creations: 5, admin: 6 };
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
        <div className="min-h-screen text-white flex flex-col font-sans selection:bg-rpg-gold/30 bg-rpg-bg">
            {/* --- TOP HUD HEADER --- */}
            <header className="h-20 px-6 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl bg-rpg-panelDark/80 border-b border-white/5 transition-all duration-300">

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
                        <div className="hidden lg:block text-[10px] text-gray-400 font-mono tracking-widest uppercase">Gamified Productivity</div>
                    </div>
                </div>

                {/* --- DESKTOP / TABLET NAVIGATION — compact on tablet, generous on desktop --- */}
                <nav className="hidden md:flex items-center gap-1 lg:gap-2 bg-white/5 p-1 lg:p-1.5 rounded-2xl border border-white/5 backdrop-blur-md shadow-glass">
                    {desktopNavItems.map(item => {
                        const isActive = activeView === item.id;
                        return (
                            <motion.button
                                key={item.id}
                                onClick={() => setActiveView(item.id)}
                                whileTap={{ scale: 0.97 }}
                                transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                                className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-5 py-2 lg:py-2.5 rounded-xl relative overflow-hidden transition-colors duration-200
                ${isActive
                                    ? 'text-rpg-gold'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {/* Fondo activo — morfa entre tabs con layoutId */}
                                {isActive && (
                                    <motion.div
                                        layoutId="active-desktop-nav-bg"
                                        className="absolute inset-0 bg-rpg-bg shadow-inner border border-white/5 rounded-xl"
                                        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                                    />
                                )}
                                <PixelIcon name={item.icon} size={16} className={`relative z-10 ${isActive ? 'drop-shadow-glow' : ''}`} />
                                <span className={`relative z-10 hidden lg:inline font-bold text-xs uppercase tracking-wider ${isActive ? 'text-rpg-gold' : ''}`}>
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
                <div className="flex items-center gap-4 shrink-0">

                    {/* Persistent HUD — compact on tablet (no time stat), full on desktop */}
                    {character && (
                        <div className="hidden md:flex items-center gap-2 lg:gap-3 bg-black/40 border border-white/10 rounded-xl px-2.5 lg:px-4 py-1.5 shadow-glass backdrop-blur-md">
                            <div className="flex items-center gap-1.5 min-w-[40px] lg:min-w-[50px]">
                                <PixelIcon name="heart" size={14} color="#f87171" className="fill-current drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                                <NumberTicker value={character.hp?.current ?? 0} className="text-white text-xs font-bold font-mono" />
                            </div>
                            <div className="hidden lg:block h-4 w-px bg-white/20"></div>
                            <div className="hidden lg:flex items-center gap-1.5 min-w-[50px]">
                                <PixelIcon name="clock" size={14} color="#60a5fa" className="fill-current drop-shadow-[0_0_5px_rgba(96,165,250,0.8)]" />
                                <NumberTicker value={character.timePoints ?? 0} className="text-white text-xs font-bold font-mono" />
                            </div>
                            <div className="h-4 w-px bg-white/20"></div>
                            <div className="flex items-center gap-1.5 min-w-[40px] lg:min-w-[50px]">
                                <PixelIcon name="coins" size={14} color="#fbbf24" className="fill-current drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
                                <NumberTicker value={character.gold ?? 0} className="text-white text-xs font-bold font-mono text-rpg-gold text-shadow-glow" />
                            </div>
                        </div>
                    )}

                    {/* Level/XP Pill (Desktop) */}
                    <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-black/20 rounded-xl border border-white/10 hover:border-rpg-gold/30 transition-colors cursor-default">
                        {character?.isResting ? (
                            <span className="text-[14px] leading-none select-none drop-shadow-glow" title="Resting at the Inn">🌙</span>
                        ) : (
                            <div className="w-2.5 h-2.5 rounded-full bg-rpg-green shadow-[0_0_10px_rgba(45,204,112,0.6)] animate-pulse"></div>
                        )}
                        <span className="text-sm font-medium text-gray-300">
                            <span className="text-rpg-gold font-bold mr-1">{currentUser?.username}</span>
                            <span className="text-xs text-gray-500 hidden xl:inline">LVL {currentUser?.level || 1}</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
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
                            <div 
                                className="group cursor-pointer p-2 rounded-xl hover:bg-white/5 transition-colors"
                                onClick={() => {
                                    setIsNotificationsOpen(!isNotificationsOpen);
                                    if (isMenuOpen) setIsMenuOpen(false);
                                    if (isInboxOpen) setIsInboxOpen(false);
                                }}
                            >
                                <Bell size={22} className={`transition-colors ${isNotificationsOpen ? 'text-rpg-gold' : 'text-gray-400 group-hover:text-rpg-gold'}`} />
                                {notificationCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rpg-red opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-rpg-red items-center justify-center text-[8px] font-bold text-white">{notificationCount}</span>
                                    </span>
                                )}
                            </div>

                            {isNotificationsOpen && (
                                <>
                                    <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={() => setIsNotificationsOpen(false)} />
                                    <div className="absolute right-0 top-full mt-4 z-50">
                                        <NotificationDropdown 
                                            isOpen={isNotificationsOpen}
                                            onClose={() => setIsNotificationsOpen(false)}
                                            overdueTasks={overdueTasks}
                                            setActiveView={setActiveView}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Messages Inbox */}
                        <div className="relative">
                            <div
                                className={`group cursor-pointer p-2 rounded-xl transition-colors ${isInboxOpen ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400 hover:text-indigo-400'}`}
                                onClick={() => {
                                    setIsInboxOpen(!isInboxOpen);
                                    if (isMenuOpen) setIsMenuOpen(false);
                                    if (isNotificationsOpen) setIsNotificationsOpen(false);
                                }}
                            >
                                <MessageSquare size={22} className="transition-colors" />
                                {unreadMessageCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 items-center justify-center text-[8px] font-bold text-white">{unreadMessageCount}</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                className={`p-2 rounded-xl transition-all duration-200 ${isMenuOpen ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                onClick={() => { setIsMenuOpen(!isMenuOpen); setConfirmLogout(false); }}
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
                                            <p className="text-xs text-gray-400">Hero Level {currentUser.level || 1}</p>
                                        </div>

                                        <button
                                            onClick={() => { setActiveView('profile'); setIsMenuOpen(false); }}
                                            className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-all flex items-center gap-3 group"
                                        >
                                            <PixelIcon name="user" size={16} className="group-hover:text-rpg-blue" />
                                            Profile Settings
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
                                            How to Play (FAQ)
                                        </button>

                                        <button
                                            onClick={() => { setActiveView('settings'); setIsMenuOpen(false); }}
                                            className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-all flex items-center gap-3 group"
                                        >
                                            <Settings size={16} className="group-hover:text-gray-100" />
                                            App Settings
                                        </button>

                                        <div className="h-px bg-white/5 my-2 mx-2"></div>

                                        <button
                                            onClick={onLogout}
                                            className="w-full text-left px-4 py-3 text-sm text-rpg-gold hover:bg-white/5 hover:text-yellow-300 rounded-xl transition-colors flex items-center gap-3 group font-bold tracking-widest border border-transparent hover:border-rpg-gold/20"
                                        >
                                            <PixelIcon name="users" size={16} className="group-hover:text-yellow-400" />
                                            SWITCH HERO
                                        </button>

                                        {confirmLogout ? (
                                            <button
                                                onClick={() => {
                                                    setConfirmLogout(false);
                                                    window.location.reload();
                                                }}
                                                onMouseLeave={() => setConfirmLogout(false)}
                                                className="w-full text-center px-4 py-3 text-[10px] text-red-100 bg-red-900/40 hover:bg-red-900 hover:text-white rounded-xl transition-colors flex items-center justify-center gap-2 group font-bold font-pixel tracking-widest border border-red-500/50 mt-1 shadow-[0_0_10px_rgba(220,38,38,0.3)]"
                                            >
                                                <LogOut size={16} className="text-white" />
                                                SURE TO QUIT?
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmLogout(true)}
                                                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors flex items-center gap-3 group border border-transparent"
                                            >
                                                <LogOut size={16} className="group-hover:text-red-400" />
                                                Logout Domain
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
            <main className="flex-1 relative transition-colors duration-1000 overflow-x-hidden w-full max-w-[100vw]">
                {/* Mesh Gradient Ambient Background */}
                <div className={`absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b ${getAtmosphereGlow()} blur-[100px] pointer-events-none mix-blend-screen opacity-70 user-select-none transition-all duration-1000`} />

                {/* Content Container — crossfade + micro-slide entre vistas.
                    `initial={false}` evita animar en el primer mount de la sesión. */}
                <div className="max-w-7xl mx-auto p-4 md:p-6 pb-28 lg:pb-8 relative z-10 w-full min-h-[calc(100vh-80px)] overflow-x-hidden">
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
            <BottomNav activeView={activeView} setActiveView={setActiveView} currentUser={currentUser} />

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
