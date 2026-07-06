import React from 'react';
import PixelIcon from './PixelIcon';
import { motion } from 'motion/react';

// Spring compartido para los elementos con layoutId — todos morfan al mismo ritmo.
const PILL_SPRING = { type: 'spring', stiffness: 320, damping: 34 };

export const NavItem = ({ icon: Icon, iconName, label, active, onClick }) => (
    <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.94 }}
        animate={{ y: active ? -8 : 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        className="relative flex flex-col items-center justify-center p-2 min-w-[64px] rounded-xl"
    >
        {/* Píldora activa — layoutId hace morph entre tabs */}
        {active && (
            <motion.div
                layoutId="active-mobile-nav-pill"
                className="absolute inset-x-2 inset-y-2 bg-gradient-to-br from-rpg-gold/20 to-orange-500/20 ring-1 ring-rpg-gold/50 rounded-xl"
                transition={PILL_SPRING}
            />
        )}

        {/* Dot superior — también morfa entre tabs */}
        {active && (
            <motion.div
                layoutId="active-mobile-nav-dot"
                className="absolute -top-1 w-1 h-1 bg-rpg-gold rounded-full shadow-glow-gold"
                transition={PILL_SPRING}
            />
        )}

        <div className={`relative z-10 p-2 rounded-full ${active ? 'text-rpg-gold' : 'text-gray-400 hover:text-white'}`}>
            <Icon name={iconName} size={active ? 24 : 20} className={active ? 'drop-shadow-glow' : ''} />
        </div>

        {/* Label — fade simple (no layoutId porque el texto cambia por tab) */}
        {active && (
            <motion.span
                key={label}
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="absolute -bottom-4 text-[10px] font-bold tracking-wider text-rpg-gold z-10 whitespace-nowrap"
            >
                {label}
            </motion.span>
        )}
    </motion.button>
);

const BottomNav = ({ activeView, setActiveView, currentUser }) => {
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
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-md">
            <nav className="flex items-center justify-between glass-panel px-3 py-3 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] bg-rpg-panel/90 backdrop-blur-xl border-t border-white/10 relative">
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
                    <motion.button
                        onClick={() => setActiveView('createTask')}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.94 }}
                        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
                        className="w-16 h-16 bg-rpg-gold text-black rounded-full shadow-[0_0_20px_rgba(251,191,36,0.6)] border-4 border-rpg-panel flex items-center justify-center group-hover:shadow-[0_0_30px_rgba(251,191,36,0.8)] transition-shadow duration-300"
                    >
                        <PixelIcon name="checkSquare" size={32} color="black" />
                    </motion.button>
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
