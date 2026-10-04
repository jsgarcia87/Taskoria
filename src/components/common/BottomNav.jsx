import React from 'react';
import PixelIcon from './PixelIcon';
import { motion, AnimatePresence } from 'motion/react';
import { NAV_DESTINATIONS, isDestinationActive } from './navDestinations';

const PILL_SPRING = { type: 'spring', stiffness: 320, damping: 34 };

// Views where "add quest" is the natural next action; elsewhere the screen
// has its own primary control (world joystick, diary entry, studio tools).
const FAB_VIEWS = ['home', 'tasks'];

export const NavItem = ({ iconName, label, active, onClick, badge = 0 }) => (
    <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        className="relative flex flex-col items-center justify-center gap-1 py-2 rounded-xl"
    >
        {active && (
            <motion.div
                layoutId="active-mobile-nav-pill"
                className="absolute inset-x-1 inset-y-0 bg-rpg-gold/10 ring-1 ring-rpg-gold/30 rounded-xl"
                transition={PILL_SPRING}
            />
        )}
        <span className="relative z-10 flex">
            <PixelIcon name={iconName} size={20} color={active ? '#fbbf24' : '#9ca3af'} />
            {badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] px-[3px] rounded-full bg-rpg-gold text-rpg-bg text-[10px] font-bold flex items-center justify-center leading-none ring-2 ring-rpg-panel" aria-label={`${badge} new`}>{badge}</span>
            )}
        </span>
        <span className={`relative z-10 text-[10px] font-bold tracking-wide leading-none ${active ? 'text-rpg-gold' : 'text-gray-400'}`}>
            {label}
        </span>
    </motion.button>
);

const BottomNav = ({ activeView, setActiveView, badges = {} }) => (
    <>
        <AnimatePresence>
            {FAB_VIEWS.includes(activeView) && (
                <motion.button
                    key="add-quest-fab"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 340, damping: 26 }}
                    onClick={() => setActiveView('createTask')}
                    aria-label="Add quest"
                    title="Add quest"
                    className="md:hidden fixed z-50 right-4 bottom-[96px] w-14 h-14 rounded-full bg-rpg-gold shadow-[0_8px_24px_rgba(0,0,0,0.45)] ring-4 ring-rpg-bg/70 flex items-center justify-center"
                >
                    <PixelIcon name="plus" size={22} color="#1c1622" />
                </motion.button>
            )}
        </AnimatePresence>

        <div className="md:hidden fixed bottom-4 inset-x-3 z-50 max-w-md mx-auto">
            <nav
                aria-label="Main"
                className="grid grid-cols-5 gap-0.5 glass-panel px-1.5 py-1.5 bg-rpg-panel/90 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]"
            >
                {NAV_DESTINATIONS.map(item => (
                    <NavItem
                        key={item.id}
                        iconName={item.icon}
                        label={item.label}
                        active={isDestinationActive(item, activeView)}
                        badge={badges[item.id] || 0}
                        onClick={() => setActiveView(item.id)}
                    />
                ))}
            </nav>
        </div>
    </>
);

export default BottomNav;
