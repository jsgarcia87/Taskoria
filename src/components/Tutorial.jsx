import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, X, Sword, ShoppingBag, Map, Users } from 'lucide-react';

/**
 * Tutorial — 4-step interactive welcome shown to brand-new characters.
 * Renders on top of everything as a modal carousel. Step 1 is invitational,
 * the rest point at the actual systems (Quests, Shop, World, Social).
 * Closing or finishing dispatches DISMISS_TUTORIAL so it never re-shows.
 */
const STEPS = [
    {
        icon: Sword,
        accent: 'text-rpg-gold',
        bg: 'bg-rpg-gold/15',
        border: 'border-rpg-gold/40',
        title: 'Welcome to Taskoria',
        body: (
            <>
                <p className="mb-3">Your real-life tasks and habits are <strong className="text-rpg-gold">quests</strong>. Complete them to earn XP, gold and loot — just like in any RPG.</p>
                <p className="text-sm text-gray-400">This tour takes 30 seconds. You can skip it any time.</p>
            </>
        ),
    },
    {
        icon: Sword,
        accent: 'text-amber-300',
        bg: 'bg-amber-500/15',
        border: 'border-amber-500/40',
        title: 'Quests &amp; Habits',
        body: (
            <>
                <p className="mb-3">Add a <strong className="text-amber-300">Quest</strong> from the Quests tab. Higher difficulty = more XP and gold.</p>
                <p className="mb-3"><strong className="text-amber-300">Habits</strong> are smaller daily drips — tick them every day to keep your streak.</p>
                <p className="text-sm text-gray-400">Tip: a daily quest of difficulty 3 is the single most rewarding action you can take.</p>
            </>
        ),
    },
    {
        icon: ShoppingBag,
        accent: 'text-emerald-300',
        bg: 'bg-emerald-500/15',
        border: 'border-emerald-500/40',
        title: 'Shop &amp; Gear',
        body: (
            <>
                <p className="mb-3">Use your gold in the <strong className="text-emerald-300">Shop</strong>. Buy weapons, armor and consumables.</p>
                <p className="mb-3">Each class has a themed <strong className="text-emerald-300">set</strong>. Equip 2 pieces for a bonus, 3 pieces for a major one.</p>
                <p className="text-sm text-gray-400">Tip: equip a set of 3 to multiply your main stat.</p>
            </>
        ),
    },
    {
        icon: Map,
        accent: 'text-blue-300',
        bg: 'bg-blue-500/15',
        border: 'border-blue-500/40',
        title: 'The Open World',
        body: (
            <>
                <p className="mb-3">Explore the <strong className="text-blue-300">map</strong> — Town Square, Mystic Forest, Taskoria Keep…</p>
                <p className="mb-3">Wander around, chat with NPCs and meet other players online. Offline friends sleep where they last were (with floating zzz's).</p>
                <p className="text-sm text-gray-400">Tip: a fresh <strong className="text-blue-300">daily mission</strong> waits for you every day.</p>
            </>
        ),
    },
];

const Tutorial = ({ onDismiss }) => {
    const [step, setStep] = useState(0);
    const current = STEPS[step];
    const Icon = current.icon;
    const isLast = step === STEPS.length - 1;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <div className={`relative w-full max-w-md ${current.bg} border-2 ${current.border} rounded-3xl p-7 shadow-2xl animate-in zoom-in-95 duration-300`}>
                {/* Skip button */}
                <button
                    onClick={onDismiss}
                    className="absolute top-3 right-3 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Skip tutorial"
                >
                    <X size={18} />
                </button>

                {/* Step indicator */}
                <div className="flex gap-1 mb-5 justify-center">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all ${i === step ? 'w-8 bg-rpg-gold' : i < step ? 'w-4 bg-rpg-gold/40' : 'w-4 bg-white/15'}`}
                        />
                    ))}
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 mx-auto rounded-2xl ${current.bg} border ${current.border} flex items-center justify-center mb-4`}>
                    <Icon size={28} className={current.accent} />
                </div>

                {/* Content */}
                <h2 className={`text-2xl font-heading font-bold text-center mb-3 ${current.accent}`}>{current.title}</h2>
                <div className="text-gray-200 text-center leading-relaxed mb-6">{current.body}</div>

                {/* Navigation */}
                <div className="flex gap-3">
                    {step > 0 ? (
                        <button
                            onClick={() => setStep(s => s - 1)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/15 text-gray-300 hover:bg-white/5 font-bold uppercase tracking-widest text-xs transition-colors"
                        >
                            <ChevronLeft size={14} /> Back
                        </button>
                    ) : (
                        <button
                            onClick={onDismiss}
                            className="flex-1 px-4 py-3 rounded-xl text-gray-400 hover:text-white font-bold uppercase tracking-widest text-xs transition-colors"
                        >
                            Skip
                        </button>
                    )}
                    <button
                        onClick={() => (isLast ? onDismiss() : setStep(s => s + 1))}
                        className="flex-[2] flex items-center justify-center gap-2 bg-rpg-gold text-rpg-bg hover:brightness-110 px-4 py-3 rounded-xl font-heading font-bold uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(251,191,36,0.35)] transition-all"
                    >
                        {isLast ? 'Start the adventure' : 'Next'} <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Tutorial;
