import React, { useEffect, useState } from 'react';
import PixelAvatar from '../common/PixelAvatar';
import PixelIcon from '../common/PixelIcon';
import CoFocusingArea from './CoFocusingArea';
import PetSanctuaryView from './PetSanctuaryView';
import ChatModal from './ChatModal';
import GuildView from './GuildView';
import BossArena from './BossArena';
import Shop from '../Shop';
import PlayableWorld from './world/PlayableWorld';
import { useGame } from '../../context/GameContext';

const PartyView = ({ currentUser, onOpenChat }) => {
    const { state, dispatch, actions, activeProfileId, familyData, setFamilyData } = useGame();
    const [familyMembers, setFamilyMembers] = useState([]);
    const [friends, setFriends] = useState([]);
    const [activeTab, setActiveTab] = useState('friends'); // friends | guilds | sanctuary | boss | shop

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // UI State
    const [loading, setLoading] = useState(true);
    const [battleResult, setBattleResult] = useState(null);
    const [activeChatFriend, setActiveChatFriend] = useState(null);

    const fetchUsers = () => {
        if (familyData) {
            // Local family
            if (familyData.profiles) {
                const family = familyData.profiles.filter(p => p.id !== activeProfileId);
                setFamilyMembers(family);
            }
            // Saved Friends
            if (familyData.friends) {
                setFriends(familyData.friends);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, [activeProfileId, familyData]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const res = await fetch(`api/search_users.php?current_user_id=${currentUser.id}&q=${encodeURIComponent(searchQuery.trim())}`);
            const data = await res.json();
            if (data.users) {
                // Filter out existing friends to prevent re-adding
                const existingFriendIds = (familyData?.friends || []).map(f => f.id);
                setSearchResults(data.users.filter(u => !existingFriendIds.includes(u.id)));
            }
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddFriend = (user) => {
        const newFriendsList = [...(familyData?.friends || []), user];

        // Update the global family data object directly
        const updatedFamilyData = {
            ...familyData,
            friends: newFriendsList
        };

        if (typeof setFamilyData === 'function') {
            setFamilyData(updatedFamilyData);
        }

        // Remove from search results
        setSearchResults(searchResults.filter(u => u.id !== user.id));
        setSearchQuery('');
    };

    const handleRemoveFriend = (friendId) => {
        if (!confirm("Remove from party?")) return;
        const newFriendsList = (familyData?.friends || []).filter(f => f.id !== friendId);
        if (typeof setFamilyData === 'function') {
            setFamilyData({
                ...familyData,
                friends: newFriendsList
            });
        }
    };

    const handleRemoveFamilyMember = (memberId) => {
        if (!confirm("Are you sure you want to permanently delete this family member from your account? This action cannot be undone.")) return;
        const newProfiles = (familyData?.profiles || []).filter(p => p.id !== memberId);
        if (typeof setFamilyData === 'function') {
            setFamilyData({
                ...familyData,
                profiles: newProfiles
            });
        }
    };

    const handleBattle = async (opponentId, isLocal) => {
        if (!confirm(`Challenge this player? ${isLocal ? "(Friendly Sparring!)" : "(Network Battle!)"}`)) return;

        const myChar = state.character;

        if (isLocal) {
            // Local PvP Simulator (Family)
            const opponent = familyMembers.find(u => u.id === opponentId);
            if (!opponent || !opponent.state || !opponent.state.character) {
                alert("This family member hasn't created a hero yet!");
                return;
            }

            const opChar = opponent.state.character;

            const myPower = myChar.level * 10 + (myChar.stats?.str || 10) + (myChar.stats?.int || 10) + (myChar.stats?.dex || 10) + Math.floor(Math.random() * 20);
            const opPower = opChar.level * 10 + (opChar.stats?.str || 10) + (opChar.stats?.int || 10) + (opChar.stats?.dex || 10) + Math.floor(Math.random() * 20);

            const iWon = myPower > opPower;

            if (iWon) {
                dispatch({ type: 'COMPLETE_TASK', payload: 'dummy_pvp_win' });
            }

            // Simulate pushing the combat log notification
            if (actions.triggerPush) {
                actions.triggerPush(
                    iWon ? `Victory against ${opChar.name}! ⚔️` : `Defeated by ${opChar.name}! 💀`,
                    iWon ? `Your ${myChar.class} overpowered them with ${myPower} power!` : `Their counterattack hit for ${opPower} power!`
                );
            }

            setBattleResult({
                winner: iWon ? 'attacker' : 'defender',
                log: iWon ?
                    `Your ${myChar.class} overpowered ${opChar.name}'s defenses!` :
                    `${opChar.name}'s counterattack caught you off guard!`,
                battleDetails: {
                    attacker: { total: myPower },
                    defender: { total: opPower }
                }
            });
        } else {
            // External PvP via Network (Friends)
            try {
                const res = await fetch('api/battle_pvp.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        attacker_id: currentUser.id,
                        defender_id: opponentId
                    })
                });
                const data = await res.json();

                if (data.error) {
                    alert(data.error);
                    return;
                }

                setBattleResult(data);

                // Update local state if we won/lost items
                if (data.newState) {
                    dispatch({ type: 'RESTORE_STATE', payload: data.newState });
                }

                if (actions.triggerPush) {
                    const isWin = data.winner === 'attacker';
                    actions.triggerPush(isWin ? 'Network Victory! ⚔️' : 'Network Defeat! 💀', data.log || (isWin ? 'You won the battle!' : 'You lost the battle.'));
                }

            } catch (e) {
                console.error("Battle failed", e);
                setBattleResult({
                    winner: Math.random() > 0.5 ? 'attacker' : 'defender',
                    log: "Network error. The battle simulation timed out!",
                    battleDetails: { attacker: { total: 0 }, defender: { total: 0 } }
                });
            }
        }
    };

    const renderUserCard = (u, isLocal) => {
        const charData = isLocal ? u.state?.character : u.character;
        const displayName = charData?.name || u.name || u.username;
        const displayLevel = charData?.level || 1;
        const displayClass = charData?.class || 'Novice';
        const displayAvatar = charData?.avatarId || 'warrior';
        const customColors = charData?.avatarColors;

        return (
            <div key={u.id} className="bg-[#1a102e]/60 backdrop-blur-xl p-3 sm:p-6 relative group border border-white/10 rounded-2xl shadow-xl hover:border-rpg-gold/50 hover:shadow-[0_0_30px_rgba(255,215,0,0.15)] transition-all duration-300">
                <button
                    onClick={() => isLocal ? handleRemoveFamilyMember(u.id) : handleRemoveFriend(u.id)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-red-400 bg-black/20 hover:bg-black/50 p-1.5 rounded-lg transition-colors"
                    title={isLocal ? "Delete Family Member" : "Remove from Party"}
                >
                    ×
                </button>

                {/* Avatar */}
                <div className="flex justify-center mb-3 sm:mb-6">
                    <div className="p-2 sm:p-4 bg-black/30 rounded-2xl border border-white/10 shadow-inner group-hover:shadow-[0_0_20px_rgba(255,215,0,0.1)] transition-all">
                        {charData ? (
                            <div className="relative flex justify-center items-center transform scale-75 sm:scale-100 origin-center mt-[-10px] sm:mt-0">
                                <PixelAvatar type={displayAvatar} scale={3} customColors={customColors} />
                                {!isLocal && (
                                    <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#1a102e] ${u.is_online ? 'bg-green-500' : 'bg-gray-500'}`} title={u.is_online ? "Online" : "Offline"}></div>
                                )}
                            </div>
                        ) : (
                            <div className="w-[48px] h-[48px] bg-gray-800 rounded-full flex items-center justify-center text-gray-600">?</div>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="text-center mb-4 sm:mb-6">
                    <h3 className="text-sm sm:text-xl font-heading font-bold text-white group-hover:text-rpg-gold transition-colors truncate">{displayName}</h3>
                    <p className="text-gray-400 text-[9px] sm:text-xs font-bold uppercase tracking-widest mt-1">
                        Lvl {displayLevel} <span className="text-white/20">|</span> {displayClass}
                    </p>
                </div>

                {/* Action */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => handleBattle(u.id, isLocal)}
                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/60 py-2 sm:py-3 rounded-xl text-xs sm:text-base font-bold flex items-center justify-center gap-1 sm:gap-2 transition-all duration-300 group/btn"
                    >
                        <PixelIcon name="sword" size={14} className="group-hover/btn:scale-125 transition-transform hidden sm:block" />
                        CHALLENGE
                    </button>
                    <button
                        onClick={() => {
                            if (onOpenChat) {
                                if (isLocal) {
                                    onOpenChat({
                                        id: currentUser.id,
                                        profile_id: u.id,
                                        username: u.name,
                                        character: u.state?.character,
                                        is_online: true
                                    });
                                } else {
                                    onOpenChat(u);
                                }
                            }
                        }}
                        className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:border-indigo-500/60 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300"
                    >
                        WHISPER
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 h-full pb-20 relative">
            {/* TABS */}
            <div className="flex gap-2 border-b border-white/10 pb-4 mb-4 overflow-x-auto overflow-y-hidden custom-scrollbar shrink-0 scroll-smooth pb-2">
                <button
                    onClick={() => setActiveTab('friends')}
                    className={`flex-1 min-w-[120px] py-3 font-bold uppercase tracking-widest text-[10px] sm:text-xs md:text-sm rounded-xl transition-all whitespace-nowrap px-4 ${activeTab === 'friends' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                    <PixelIcon name="users" size={14} className="inline mr-1 sm:mr-2" />
                    Friends
                </button>
                <button
                    onClick={() => setActiveTab('shop')}
                    className={`flex-1 min-w-[120px] py-3 font-bold uppercase tracking-widest text-[10px] sm:text-xs md:text-sm rounded-xl transition-all whitespace-nowrap px-4 ${activeTab === 'shop' ? 'bg-rpg-gold text-rpg-bg shadow-glow-gold' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                    <PixelIcon name="coins" size={14} className="inline mr-1 sm:mr-2" />
                    Market
                </button>
                <button
                    onClick={() => setActiveTab('guilds')}
                    className={`flex-1 min-w-[120px] py-3 font-bold uppercase tracking-widest text-[10px] sm:text-xs md:text-sm rounded-xl transition-all whitespace-nowrap px-4 ${activeTab === 'guilds' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                    <PixelIcon name="shield" size={14} className="inline mr-1 sm:mr-2" />
                    Guilds
                </button>
                <button
                    onClick={() => setActiveTab('boss')}
                    className={`flex-1 min-w-[120px] py-3 font-bold uppercase tracking-widest text-[10px] sm:text-xs md:text-sm rounded-xl transition-all whitespace-nowrap px-4 ${activeTab === 'boss' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                    <PixelIcon name="sword" size={14} className="inline mr-1 sm:mr-2" />
                    Boss Arena
                </button>
                <button
                    onClick={() => setActiveTab('sanctuary')}
                    className={`flex-1 min-w-[120px] py-3 font-bold uppercase tracking-widest text-[10px] sm:text-xs md:text-sm rounded-xl transition-all whitespace-nowrap px-4 ${activeTab === 'sanctuary' ? 'bg-emerald-500 text-black shadow-glow' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                    <PixelIcon name="heart" size={14} className="inline mr-1 sm:mr-2" />
                    Sanctuary
                </button>
            </div>

            <ChatModal
                isOpen={!!activeChatFriend}
                onClose={() => setActiveChatFriend(null)}
                currentUser={currentUser}
                friend={activeChatFriend}
            />

            {activeTab === 'friends' && (
                <>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl sm:text-2xl font-heading font-bold text-rpg-gold text-shadow-glow truncate pr-2">ADVENTURER'S CO-OP</h2>
                    </div>

                    {/* Integrated Playable World */}
                    <div className="mb-10 relative">
                        <h2 className="text-xl font-heading font-bold text-rpg-gold mb-2 uppercase tracking-widest flex items-center gap-2 drop-shadow-md">
                            <PixelIcon name="home" size={24} className="text-orange-400" />
                            Village Square (Co-Focusing)
                        </h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">A bustling medieval hub for your party!</p>
                        
                        <PlayableWorld 
                            className="relative w-full h-[500px] sm:h-[600px] bg-black border-4 border-[#1a102e] rounded-t-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                            currentUser={currentUser}
                            activeProfile={familyData?.profiles?.find(p => p.id === activeProfileId)}
                            familyMembers={familyMembers}
                            friends={friends}
                        />

                        {/* Legend / Status bar */}
                        <div className="bg-[#2b254a] p-3 border-x-4 border-b-4 border-[#1a102e] rounded-b-lg flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-widest mt-[-2px]">
                            <div className="flex items-center gap-4">
                                <span className="flex text-[10px] items-center gap-1"><span className="text-white">WASD</span> to walk</span>
                                <span className="flex text-[10px] items-center gap-1"><div className="w-2 h-2 rounded-full border border-dashed border-white"></div> Portals</span>
                            </div>
                            <div>{familyMembers.length + friends.length + 1} Heroes Online</div>
                        </div>
                    </div>

                    {/* Search/Invite Section */}
                    <div className="bg-[#1a102e]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-4 sm:p-6 mb-8">
                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search heroes by username..."
                                className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-rpg-gold focus:ring-1 focus:ring-rpg-gold/50 transition-all font-sans"
                            />
                            <button
                                type="submit"
                                disabled={isSearching || !searchQuery.trim()}
                                className="bg-rpg-gold text-rpg-bg px-6 rounded-xl font-bold shadow-glow-gold hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center min-w-[120px]"
                            >
                                {isSearching ? 'Scouting...' : 'Search'}
                            </button>
                        </form>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Found Heroes</h4>
                                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                                    {searchResults.map(u => (
                                        <div key={u.id} className="flex items-center justify-between bg-black/30 p-3 rounded-lg border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden">
                                                    {u.character ? (
                                                        <PixelAvatar type={u.character.avatarId} scale={1.5} customColors={u.character.avatarColors} />
                                                    ) : (
                                                        <PixelIcon name="user" size={14} className="text-gray-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white leading-none mb-1">{u.username}</div>
                                                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                                        {u.character ? `Lvl ${u.character.level} ${u.character.class}` : 'No Hero'}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleAddFriend(u)}
                                                className="text-xs bg-white/10 hover:bg-rpg-gold/20 hover:text-rpg-gold text-gray-300 px-3 py-1.5 rounded-lg font-bold transition-all border border-transparent hover:border-rpg-gold/50 flex items-center gap-1"
                                            >
                                                <span>+</span> Invite
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <p className="text-white font-heading animate-pulse flex items-center gap-2">
                                <PixelIcon name="user" size={24} className="animate-spin" /> Scouting for opponents...
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-10">

                            {/* Family Characters */}
                            {familyMembers.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-heading font-bold text-gray-300 mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
                                        <PixelIcon name="home" size={20} className="text-blue-400" /> Family Estate
                                    </h3>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                                        {familyMembers.map(u => renderUserCard(u, true))}
                                    </div>
                                </div>
                            )}

                            {/* External Friends */}
                            {friends.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-heading font-bold text-gray-300 mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
                                        <PixelIcon name="users" size={20} className="text-purple-400" /> Party Members
                                    </h3>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                                        {friends.map(u => renderUserCard(u, false))}
                                    </div>
                                </div>
                            )}

                            {familyMembers.length === 0 && friends.length === 0 && (
                                <div className="text-center py-12 glass-panel">
                                    <p className="text-gray-500 font-heading">No other adventurers found nearby.</p>
                                    <p className="text-sm text-gray-600 mt-2">Create more profiles for your family or search for friends above!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Battle Result Modal */}
                    {battleResult && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
                            <div className={`bg-[#1a102e]/90 backdrop-blur-3xl rounded-3xl p-8 max-w-sm w-full text-center border shadow-2xl ${battleResult.winner === 'attacker' ? 'border-green-500/50 shadow-[0_0_50px_rgba(45,204,112,0.2)]' : 'border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)]'}`}>
                                <div className="flex justify-center mb-6">
                                    {battleResult.winner === 'attacker' ? (
                                        <div className="p-4 bg-green-500/10 rounded-full border border-green-500/30 animate-bounce">
                                            <PixelIcon name="trophy" size={48} className="text-green-400" />
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-red-500/10 rounded-full border border-red-500/30">
                                            <PixelIcon name="skull" size={48} className="text-red-400" />
                                        </div>
                                    )}
                                </div>

                                <h2 className={`text-4xl font-heading font-bold mb-2 ${battleResult.winner === 'attacker' ? 'text-green-400' : 'text-red-400'}`}>
                                    {battleResult.winner === 'attacker' ? 'VICTORY!' : 'DEFEAT!'}
                                </h2>

                                <div className="glass-card p-4 mb-6 text-left text-sm space-y-3 bg-black/40">
                                    <p className="text-gray-300 italic leading-relaxed">"{battleResult.log}"</p>
                                    <div className="h-px bg-white/10 my-2" />
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                                        <span>You: <span className="text-white">{battleResult.battleDetails.attacker.total} Power</span></span>
                                        <span>Enemy: <span className="text-white">{battleResult.battleDetails.defender.total} Power</span></span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setBattleResult(null)}
                                    className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-8 py-3 rounded-xl font-bold transition-all w-full uppercase tracking-widest"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'guilds' && (
                <GuildView currentUser={currentUser} />
            )}

            {activeTab === 'boss' && (
                <BossArena />
            )}

            {activeTab === 'shop' && (
                <div className="h-full min-h-[600px] mt-4">
                    <Shop currentUser={currentUser} />
                </div>
            )}

            {activeTab === 'sanctuary' && (
                <PetSanctuaryView currentUser={currentUser} />
            )}
        </div>
    );
};

export default PartyView;
