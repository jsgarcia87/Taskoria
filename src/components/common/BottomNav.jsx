import React from 'react';
import PixelIcon from './PixelIcon';

export const NavItem = ({ icon: Icon, iconName, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-2 min-w-[64px] transition-all duration-300 rounded-xl relative
      ${active
                ? 'text-rpg-gold shadow-glow-gold -translate-y-2'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
    >
        <div className={`p-2 rounded-full transition-all duration-300 ${active ? 'bg-gradient-to-br from-rpg-gold/20 to-orange-500/20 ring-1 ring-rpg-gold/50' : ''}`}>
            <Icon name={iconName} size={active ? 24 : 20} className={active ? "drop-shadow-glow" : ""} />
        </div>

        {active && (
            <span className="absolute -bottom-4 text-[10px] font-bold tracking-wider text-rpg-gold animate-in fade-in slide-in-from-bottom-1">
                {label}
            </span>
        )}

        {/* Active Indicator Dot */}
        {active && (
            <div className="absolute -top-1 w-1 h-1 bg-rpg-gold rounded-full shadow-glow-gold"></div>
        )}
    </button>
);

const BottomNav = ({ activeView, setActiveView, currentUser }) => {
    const navItems = [
        { id: 'home', label: 'Home', icon: 'home' },
        { id: 'tasks', label: 'Quests', icon: 'checkSquare' },
        { id: 'timer', label: 'Timer', icon: 'clock' }, // Added Timer placeholder if needed
        { id: 'items', label: 'Items', icon: 'shoppingBag' }, // Mapped Shop to Items per Figma
        { id: 'boss', label: 'Boss', icon: 'sword' },   // Added Boss shortcut
        { id: 'profile', label: 'Hero', icon: 'user' }, // Moved Profile to end
    ];

    // Filter to core 5 items for mobile to prevent overcrowding if needed, 
    // but Figma showed 6: Home, Quests, Timer, Items, Boss, PvP.
    // We'll stick to 5 core ones for now that map to current views + maybe Timer if we have it?
    // Current views: home, tasks, party, shop, profile.
    // Let's map: 
    // Home -> Home
    // Quests -> Tasks
    // Timer -> (We don't have a dedicated full page timer yet, it's on dashboard, but we can add a view or just keep 5)
    // Let's use: Home, Quests, Party, Market, Hero

    const mobileNavItems = [
        { id: 'home', label: 'Camp', icon: 'home' },
        { id: 'tasks', label: 'Quests', icon: 'checkSquare' },
        { id: 'party', label: 'Town', icon: 'users' },
        { id: 'diary', label: 'Diary', icon: 'book' },
    ];

    if (currentUser?.is_admin) {
        mobileNavItems.push({ id: 'admin', label: 'Admin', icon: 'shield' });
    }

    return (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-sm">
            <nav className="flex items-center justify-between glass-panel px-3 py-3 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] bg-[#1a102e]/90 backdrop-blur-xl border-t border-white/10 relative">
                {/* Left Side Items (Home, Quests) */}
                <div className="flex gap-1">
                    {mobileNavItems.slice(0, 2).map((item) => (
                        <NavItem
                            key={item.id}
                            icon={PixelIcon}
                            iconName={item.icon}
                            label={item.label}
                            active={activeView === item.id}
                            onClick={() => setActiveView(item.id)}
                        />
                    ))}
                </div>

                {/* Central Add Button */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-8 group">
                    <button
                        onClick={() => setActiveView('createTask')}
                        className="w-16 h-16 bg-rpg-gold text-black rounded-full shadow-[0_0_20px_rgba(251,191,36,0.6)] border-4 border-[#1a102e] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group-hover:shadow-[0_0_30px_rgba(251,191,36,0.8)]"
                    >
                        <PixelIcon name="checkSquare" size={32} color="black" />
                    </button>
                    <div className="mt-1 text-[10px] font-bold text-rpg-gold text-center uppercase tracking-widest drop-shadow-glow">Add Quest</div>
                </div>

                {/* Right Side Items (Town, Diary, [Admin]) */}
                <div className="flex gap-1">
                    {mobileNavItems.slice(2).map((item) => (
                        <NavItem
                            key={item.id}
                            icon={PixelIcon}
                            iconName={item.icon}
                            label={item.label}
                            active={activeView === item.id}
                            onClick={() => setActiveView(item.id)}
                        />
                    ))}
                </div>
            </nav>
        </div>
    );
};

export default BottomNav;
