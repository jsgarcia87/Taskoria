import React from 'react';
import PixelIcon from '../common/PixelIcon';

const FAQ = () => {
    return (
        <div className="space-y-6 h-full pb-20">
            <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
                <div className="w-12 h-12 bg-rpg-gold/20 rounded-xl border-2 border-rpg-gold flex items-center justify-center">
                    <PixelIcon name="star" size={24} className="text-rpg-gold drop-shadow-glow" />
                </div>
                <div>
                    <h2 className="text-2xl font-heading font-bold text-white text-shadow-glow uppercase tracking-wider">How to Play (FAQ)</h2>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">A Hero's Guide to Taskoria</p>
                </div>
            </div>

            <div className="glass-panel p-6 mb-6">
                <h3 className="text-xl font-heading font-bold text-rpg-gold mb-4 border-b border-white/10 pb-2">The Basics</h3>
                <p className="text-gray-300 font-bold leading-relaxed mb-4">
                    Taskoria is a gamified productivity app where your real-world tasks give you XP (Experience Points) and Gold! Level up your character, buy cool gear, and adventure with your friends.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                        <h4 className="text-green-400 font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Habits (Good & Bad)
                        </h4>
                        <p className="text-sm text-gray-400">
                            Habits are things you do often, without a strict schedule. Clicking "+" on a good habit gives XP and Gold. Clicking "-" on a bad habit makes you lose HP (Health).
                        </p>
                    </div>

                    <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                        <h4 className="text-blue-400 font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Dailies
                        </h4>
                        <p className="text-sm text-gray-400">
                            Tasks scheduled for specific days (e.g. "Water Plants on Mondays"). Checking them off gives great rewards. If you miss them, you take damage at the end of the day!
                        </p>
                    </div>

                    <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                        <h4 className="text-rpg-gold font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span> To-Dos
                        </h4>
                        <p className="text-sm text-gray-400">
                            One-time tasks. Once you complete a To-Do, it's gone forever. They give moderate XP and Gold based on how hard they are.
                        </p>
                    </div>

                    <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                        <h4 className="text-red-400 font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> Chores
                        </h4>
                        <p className="text-sm text-gray-400">
                            Special household tasks that reward a lot of Gold but very little XP. Perfect for saving up money to buy powerful gear!
                        </p>
                    </div>
                </div>
            </div>

            <div className="glass-panel p-6">
                <h3 className="text-xl font-heading font-bold text-rpg-gold mb-4 border-b border-white/10 pb-2">Hero Mechanics</h3>

                <div className="space-y-4">
                    <div>
                        <h4 className="font-bold text-white uppercase tracking-wider mb-1">What happens when I level up?</h4>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            When your XP bar fills up, you level up! Your MAX HP increases, meaning you can take more damage from missed Dailies or bad habits before dying. You also get a full heal.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-white uppercase tracking-wider mb-1">What are Stats (STR, DEX, INT)?</h4>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Right now, stats are determined by your Class. STR gives a bonus to fighting, DEX helps you dodge damage, and INT boosts the XP you gain. Future updates will let you allocate stat points freely!
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-white uppercase tracking-wider mb-1">Are there any legal constraints?</h4>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            <strong>Yes.</strong> Taskoria and its features were developed and ideated by <strong>Sangar Studio</strong>. The codebase and design are protected. Copying, redistributing, or claiming this software as your own is strictly prohibited by law. We take pride in our original RPG productivity concept and appreciate your support.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-white uppercase tracking-wider mb-1">How does the Party work?</h4>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Go to the Party tab to see your Family and invited Friends. You can see who is currently focusing (studying, working) and you can even challenge them to a PvP battle using a simulated D20 dice roll against their stats!
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default FAQ;
