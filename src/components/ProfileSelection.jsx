import React, { useState } from 'react';
import { UserPlus, User } from 'lucide-react';
import ModernPixelAvatar from './common/ModernPixelAvatar';
import { PressButton } from './common/PressButton';

const ProfileSelection = ({ profiles, onSelectProfile, onCreateProfile, onLogout }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newProfileName, setNewProfileName] = useState('');

    const handleCreate = (e) => {
        e.preventDefault();
        if (newProfileName.trim()) {
            onCreateProfile(newProfileName.trim());
            setNewProfileName('');
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-rpg-bg flex items-center justify-center p-4 selection:bg-rpg-gold/30">
            <div className="w-full max-w-4xl flex flex-col items-center">

                <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-2 tracking-widest text-shadow-glow text-center">
                    TASKORIA <span className="text-rpg-gold">FAMILY</span>
                </h1>
                <p className="text-gray-400 mb-12 uppercase tracking-widest text-sm font-bold text-center">Who is adventuring today?</p>

                {isCreating ? (
                    <div className="glass-panel p-8 w-full max-w-md animate-in zoom-in-95 duration-300">
                        <h2 className="text-xl font-heading font-bold text-rpg-gold mb-2 text-center">NEW PROFILE</h2>
                        <p className="text-xs text-gray-400 text-center mb-6">One profile per family member. You'll pick a hero class next.</p>
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Profile Name</label>
                                <input
                                    type="text"
                                    value={newProfileName}
                                    onChange={(e) => setNewProfileName(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-500 focus:border-rpg-gold focus:ring-1 focus:ring-rpg-gold/50 outline-none transition-all font-sans"
                                    placeholder="e.g. Alex, Kids, Sarah..."
                                    autoFocus
                                    maxLength={15}
                                    required
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-colors font-bold text-sm uppercase"
                                >
                                    Cancel
                                </button>
                                <PressButton
                                    type="submit"
                                    disabled={!newProfileName.trim()}
                                    className="flex-1 py-3 bg-rpg-gold text-rpg-bg rounded-xl font-bold text-sm uppercase shadow-glow-gold disabled:opacity-50"
                                >
                                    Create
                                </PressButton>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="flex flex-wrap justify-center gap-6 md:gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {profiles.map((profile) => (
                            <div
                                key={profile.id}
                                onClick={() => onSelectProfile(profile.id)}
                                className="flex flex-col items-center gap-4 cursor-pointer group w-32 md:w-40"
                            >
                                <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-black/40 border-2 border-white/10 flex items-center justify-center p-2 group-hover:border-rpg-gold group-hover:bg-white/5 group-hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] transition-all duration-300 transform group-hover:-translate-y-2 overflow-hidden relative">
                                    {/* Default avatar fallback if profile doesn't have one set up yet */}
                                    {profile.state?.character?.avatarId ? (
                                        <ModernPixelAvatar type={profile.state.character.avatarId} scale={4.0} customColors={profile.state.character.avatarColors} headOnly={true} />
                                    ) : (
                                        <User size={48} className="text-gray-500 group-hover:text-rpg-gold transition-colors" />
                                    )}
                                </div>
                                <span className="text-lg font-heading font-bold text-gray-400 group-hover:text-white transition-colors text-center w-full truncate">
                                    {profile.name}
                                </span>
                            </div>
                        ))}

                        {/* Add New Profile Button */}
                        <div
                            onClick={() => setIsCreating(true)}
                            className="flex flex-col items-center gap-4 cursor-pointer group w-32 md:w-40"
                        >
                            <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-black/20 border-2 border-dashed border-white/20 flex items-center justify-center group-hover:border-white/50 group-hover:bg-white/5 transition-all duration-300 transform group-hover:-translate-y-2">
                                <UserPlus size={40} className="text-gray-500 group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-lg font-heading font-bold text-gray-500 group-hover:text-gray-300 transition-colors">
                                Add Profile
                            </span>
                        </div>
                    </div>
                )}

                <div className="mt-20">
                    <button
                        onClick={onLogout}
                        className="text-xs text-gray-600 hover:text-red-400 uppercase tracking-widest font-bold transition-colors"
                    >
                        Sign Out of Taskoria
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileSelection;
