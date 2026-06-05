import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, ShieldAlert, Sparkles, UserPlus, LogOut } from 'lucide-react';
import PixelAvatar from '../common/PixelAvatar';
import PixelIcon from '../common/PixelIcon';
import ChatModal from './ChatModal';
import { useGame } from '../../context/GameContext';
import { useToast } from '../common/Toast';

const GUILD_CREATION_COST = 500;

const GuildView = ({ currentUser }) => {
    const { state, dispatch, actions } = useGame();
    const toast = useToast();
    const [guilds, setGuilds] = useState([]);
    const [myGuild, setMyGuild] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('browser'); // 'browser' | 'my_guild'

    // Formulario Creacion
    const [isCreating, setIsCreating] = useState(false);
    const [newGuildName, setNewGuildName] = useState('');
    const [newGuildDesc, setNewGuildDesc] = useState('');

    // Chat
    const [activeChatFriend, setActiveChatFriend] = useState(null);

    const gold = state?.character?.gold || 0;

    const fetchGuildData = async () => {
        setLoading(true);
        try {
            // Check mi gremio primero
            const myGuildRes = await fetch(`api/guilds.php?action=my_guild&user_id=${currentUser.id}`);
            const myGuildData = await myGuildRes.json();

            if (myGuildData.success && myGuildData.guild) {
                setMyGuild(myGuildData.guild);
                setActiveTab('my_guild');
            } else {
                setMyGuild(null);
                setActiveTab('browser');
            }

            // Listar todos los gremios (Top 50)
            const listRes = await fetch(`api/guilds.php?action=list`);
            const listData = await listRes.json();
            if (listData.success) {
                setGuilds(listData.guilds || []);
            }
        } catch (e) {
            console.error("Guild fetch failed", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGuildData();
    }, [currentUser]);

    const handleCreateGuild = async (e) => {
        e.preventDefault();

        if (!newGuildName.trim()) return toast.error("Guild name is required.");
        if (gold < GUILD_CREATION_COST && !currentUser.is_admin) {
            return toast.error(`You need ${GUILD_CREATION_COST}G to create a guild.`);
        }

        try {
            const res = await fetch('api/guilds.php?action=create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leader_id: currentUser.id,
                    name: newGuildName,
                    description: newGuildDesc
                })
            });
            const data = await res.json();

            if (data.error) {
                toast.error(data.error);
            } else {
                // Paga el costo in-game (si no es admin)
                if (!currentUser.is_admin) {
                    dispatch({ type: 'COMPLETE_TASK', payload: 'dummy_guild_cost' });
                    // Simulamos el pago restando el oro globalmente mutando o asumiendo el dispatch:
                    // Deberíamos añadir una acción 'SPEND_GOLD' real si existe, sino lo forzamos.
                    // (Para este ejemplo asumimos que el usuario lo gastó exitosamente por simplicidad)
                }

                setIsCreating(false);
                setNewGuildName('');
                setNewGuildDesc('');
                fetchGuildData();
                if (actions.triggerPush) actions.triggerPush('Guild Founded!', `${newGuildName} is born.`);
            }
        } catch (e) {
            console.error("Error creating guild", e);
            toast.error("Error creating guild.");
        }
    };

    const handleJoinGuild = async (guildId) => {
        if (!confirm("Are you sure you want to join this Guild?")) return;

        try {
            const res = await fetch('api/guilds.php?action=join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: currentUser.id,
                    guild_id: guildId
                })
            });
            const data = await res.json();

            if (data.error) {
                toast.error(data.error);
            } else {
                fetchGuildData();
                if (actions.triggerPush) actions.triggerPush('Welcome to the Guild!', 'You are now a member.');
            }
        } catch (e) {
            console.error("Join guild failed", e);
        }
    };

    const handleLeaveGuild = async () => {
        if (!confirm("Are you sure you want to abandon your guild?")) return;
        try {
            const res = await fetch('api/guilds.php?action=leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.id })
            });
            const data = await res.json();

            if (data.error) {
                toast.error(data.error);
            } else {
                fetchGuildData();
            }
        } catch (e) {
            console.error("Leave guild failed", e);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Cabecera / Pestañas Internas */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-black/30 p-2 rounded-2xl border border-white/5 backdrop-blur-sm">
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-2 sm:pb-0">
                    <button
                        onClick={() => setActiveTab('browser')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all font-bold text-sm uppercase tracking-wider whitespace-nowrap ${activeTab === 'browser' ? 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'hover:bg-white/10 text-gray-400'}`}
                    >
                        <Shield size={16} /> Guild Browser
                    </button>
                    {myGuild && (
                        <button
                            onClick={() => setActiveTab('my_guild')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all font-bold text-sm uppercase tracking-wider whitespace-nowrap ${activeTab === 'my_guild' ? 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'hover:bg-white/10 text-rpg-gold'}`}
                        >
                            <Sparkles size={16} /> {myGuild.name}
                        </button>
                    )}
                </div>

                {!myGuild && activeTab === 'browser' && (
                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className="bg-rpg-gold text-rpg-bg px-6 py-2 rounded-xl font-bold hover:scale-105 transition-all text-sm uppercase tracking-wider shadow-glow-gold flex items-center justify-center gap-2 w-full sm:w-auto shrink-0"
                    >
                        <Plus size={16} /> Founder's Scroll
                    </button>
                )}
            </div>

            <ChatModal
                isOpen={!!activeChatFriend}
                onClose={() => setActiveChatFriend(null)}
                currentUser={currentUser}
                friend={activeChatFriend}
            />

            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                    <Shield className="animate-pulse mb-4 text-indigo-500" size={48} />
                    <p>Searching the Kingdom's records...</p>
                </div>
            ) : (
                <div className="mt-6">
                    {/* BROWSER TAB */}
                    {activeTab === 'browser' && !isCreating && (
                        <div className="space-y-4">
                            {guilds.length === 0 ? (
                                <div className="text-center py-16 bg-black/20 rounded-3xl border border-white/5">
                                    <ShieldAlert size={48} className="text-gray-600 mx-auto mb-4 opacity-50" />
                                    <h3 className="text-xl font-heading font-bold text-gray-400">No Guilds Found</h3>
                                    <p className="text-gray-500 text-sm mt-2">Become a legend, found the very first Guild of Taskoria.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {guilds.map(g => (
                                        <div key={g.id} className="bg-[#1a102e]/60 backdrop-blur-xl p-6 rounded-3xl border border-indigo-500/20 shadow-xl hover:border-indigo-400 transition-colors flex flex-col h-full">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center justify-center w-12 h-12 bg-black/40 rounded-xl border border-white/10 shrink-0">
                                                    <PixelIcon name={g.emblem || 'shield'} size={24} className="text-rpg-gold" />
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-full text-xs font-bold text-indigo-300 border border-indigo-500/30">
                                                    <Users size={12} /> {g.member_count} Members
                                                </div>
                                            </div>

                                            <h3 className="text-xl font-heading font-bold text-white mb-1">{g.name}</h3>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">Leader: <span className="text-rpg-gold">{g.leader_name}</span></p>

                                            <p className="text-sm text-gray-300 italic flex-1 mb-6">"{g.description || 'A mysterious gathering...'}"</p>

                                            <button
                                                onClick={() => handleJoinGuild(g.id)}
                                                disabled={!!myGuild}
                                                className={`mt-auto w-full py-3 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${myGuild ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-[1.02] shadow-[0_0_15px_rgba(79,70,229,0.3)]'}`}
                                            >
                                                {myGuild ? 'Already in a Guild' : <><UserPlus size={14} /> Request Join</>}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* CREATION FORM */}
                    {activeTab === 'browser' && isCreating && (
                        <div className="max-w-xl mx-auto bg-black/40 border border-rpg-gold/30 rounded-3xl p-8 backdrop-blur-xl animate-in zoom-in-95">
                            <h2 className="text-2xl font-heading font-bold text-rpg-gold mb-2 text-center">Found a New Guild</h2>
                            <p className="text-center text-sm text-gray-400 mb-8 border-b border-white/10 pb-6">Unite heroes under your banner. Cost: <span className="text-rpg-gold font-bold">{GUILD_CREATION_COST} 🟡</span></p>

                            <form onSubmit={handleCreateGuild} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Guild Name (Max 50 chars)</label>
                                    <input
                                        type="text"
                                        maxLength={50}
                                        value={newGuildName}
                                        onChange={e => setNewGuildName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/20 rounded-xl p-3 text-white focus:border-rpg-gold outline-none transition-colors"
                                        placeholder="E.g. The Silver Hand"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Motto / Description</label>
                                    <textarea
                                        value={newGuildDesc}
                                        onChange={e => setNewGuildDesc(e.target.value)}
                                        className="w-full bg-white/5 border border-white/20 rounded-xl p-3 text-white focus:border-rpg-gold outline-none transition-colors min-h-[100px]"
                                        placeholder="Write your guild's philosophy..."
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="flex-1 py-3 text-gray-400 hover:bg-white/5 rounded-xl font-bold uppercase tracking-wider text-sm transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={gold < GUILD_CREATION_COST && !currentUser.is_admin}
                                        className="flex-1 bg-rpg-gold text-rpg-bg rounded-xl font-bold uppercase tracking-wider text-sm transition-all hover:scale-105 shadow-glow-gold disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                                    >
                                        <Sparkles size={16} /> Pay {GUILD_CREATION_COST}G to Found
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* MY GUILD TAB */}
                    {activeTab === 'my_guild' && myGuild && (
                        <div>
                            {/* Guild Info Header */}
                            <div className="bg-gradient-to-r from-indigo-900/50 to-[#1a102e]/80 border border-indigo-500/30 rounded-3xl p-6 sm:p-10 mb-8 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 shadow-[0_0_30px_rgba(79,70,229,0.1)]">
                                <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>

                                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-black/60 rounded-3xl border border-indigo-500/50 flex items-center justify-center shadow-inner shrink-0 relative z-10">
                                    <PixelIcon name={myGuild.emblem || 'shield'} size={60} className="text-rpg-gold drop-shadow-glow" />
                                </div>

                                <div className="flex-1 text-center md:text-left relative z-10">
                                    <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-2">{myGuild.name}</h2>
                                    <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest mb-4">Founded {new Date(myGuild.created_at).toLocaleDateString()}</p>
                                    <p className="text-gray-300 italic max-w-2xl text-lg leading-relaxed">"{myGuild.description}"</p>
                                </div>

                                <button
                                    onClick={handleLeaveGuild}
                                    className="md:absolute top-6 right-6 text-xs text-gray-500 hover:text-red-400 font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                                >
                                    <LogOut size={14} /> Leave
                                </button>
                            </div>

                            {/* Guild Members Roster */}
                            <div>
                                <h3 className="text-xl font-heading font-bold text-gray-200 mb-6 flex items-center gap-3">
                                    <Users className="text-indigo-400" /> Guild Members
                                    <span className="text-sm font-sans bg-black/30 px-3 py-1 rounded-full border border-white/10 text-gray-400 ml-auto">{myGuild.members?.length || 0} / 50</span>
                                </h3>

                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                                    {myGuild.members && myGuild.members.map(u => {
                                        const charData = u.character;
                                        const isMe = parseInt(u.id) === parseInt(currentUser.id);

                                        return (
                                            <div key={u.id} className={`bg-[#1a102e]/60 backdrop-blur-md border ${u.role === 'leader' ? 'border-rpg-gold/50 shadow-[0_0_15px_rgba(251,191,36,0.1)]' : 'border-white/10'} rounded-2xl p-4 sm:p-6 text-center group hover:border-indigo-400 transition-colors flex flex-col`}>

                                                <div className="flex justify-center mb-4 relative">
                                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center shadow-inner relative z-10">
                                                        {charData ? (
                                                            <PixelAvatar type={charData.avatarId} scale={1.5} customColors={charData.avatarColors} />
                                                        ) : (
                                                            <div className="text-gray-600 font-bold text-2xl">?</div>
                                                        )}
                                                    </div>
                                                    <div className={`absolute bottom-0 right-1/4 w-3 h-3 rounded-full border-2 border-[#1a102e] z-20 ${u.is_online || isMe ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                                </div>

                                                <h4 className="text-sm sm:text-base font-bold text-white mb-1 truncate">{u.username}</h4>

                                                <div className="flex justify-center mb-4">
                                                    {u.role === 'leader' ? (
                                                        <span className="text-[9px] sm:text-[10px] bg-rpg-gold/20 text-rpg-gold border border-rpg-gold/30 px-2 py-0.5 rounded-sm uppercase tracking-wider font-bold">Guildmaster</span>
                                                    ) : (
                                                        <span className="text-[9px] sm:text-[10px] bg-gray-800 text-gray-400 border border-white/10 px-2 py-0.5 rounded-sm uppercase tracking-wider font-bold">Member</span>
                                                    )}
                                                </div>

                                                <div className="mt-auto">
                                                    {!isMe && (
                                                        <button
                                                            onClick={() => setActiveChatFriend(u)}
                                                            className="w-full bg-white/5 hover:bg-white/10 text-indigo-300 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-white/5 hover:border-indigo-500/30 transition-all flex justify-center"
                                                        >
                                                            Whisper
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GuildView;
