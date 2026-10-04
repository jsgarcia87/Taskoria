import React, { useEffect, useRef, useState, Suspense } from 'react';
import ModernPixelAvatar from '../common/ModernPixelAvatar';
import PixelIcon from '../common/PixelIcon';
import CoFocusingArea from './CoFocusingArea';
import PetSanctuaryView from './PetSanctuaryView';
import ChatModal from './ChatModal';
import GuildView from './GuildView';
import BossArena from './BossArena';
import { useConfirm } from '../../context/ConfirmContext';
// Shop carries the full items catalog + sprite sheet URL → defer until needed.
const Shop = React.lazy(() => import('../Shop'));
// PlayableWorld is the biggest single component (~1000 lines + world/sprites/
// prefabs registry). Lazy-load it so the Party landing isn't gated on it.
const PlayableWorld = React.lazy(() => import('./world/PlayableWorld'));
import { useGame } from '../../context/GameContext';
import { useToast } from '../common/Toast';
import {
    fetchFriends, sendFriendRequest, respondToRequest, removeFriend, importLegacyFriends,
} from '../../utils/friendsApi';

const sameIds = (a = [], b = []) => a.length === b.length && a.every(x => b.some(y => String(y.id) === String(x.id)));

const PartyView = ({ currentUser, onOpenChat }) => {
    const { state, dispatch, actions, activeProfileId, familyData, setFamilyData } = useGame();
    const toast = useToast();
    const confirm = useConfirm();
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

    // Friendships live on the server and only count once both sides agreed.
    // `familyData.friends` mirrors the accepted list so chat and the world keep working offline.
    const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
    const [busyIds, setBusyIds] = useState([]);
    const canUseServer = !!currentUser?.id && !currentUser?.is_guest && currentUser.id !== 'guest';
    const familyDataRef = useRef(familyData);
    useEffect(() => { familyDataRef.current = familyData; }, [familyData]);
    const migrationRef = useRef(null);

    // One path for the first load and the polling: wait for the one-time move of the
    // old local lists, read the server, then mirror it into familyData in a single write.
    const loadFriends = async () => {
        if (!canUseServer) return;
        try {
            const first = familyDataRef.current;
            if (!migrationRef.current && first && !first.friendsMigrated) {
                const legacyIds = (first.friends || []).map(f => f.id);
                migrationRef.current = (legacyIds.length ? importLegacyFriends(currentUser.id, legacyIds) : Promise.resolve())
                    .catch(e => { migrationRef.current = null; throw e; });
            }
            if (migrationRef.current) await migrationRef.current;

            const data = await fetchFriends(currentUser.id);
            setRequests({ incoming: data.incoming, outgoing: data.outgoing });
            const current = familyDataRef.current;
            if (current && typeof setFamilyData === 'function'
                && (!current.friendsMigrated || !sameIds(current.friends || [], data.friends))) {
                setFamilyData({ ...current, friendsMigrated: true, friends: data.friends });
            }
        } catch (e) {
            console.error('Could not load friends', e);
        }
    };

    useEffect(() => {
        if (!canUseServer) return;
        loadFriends();
        const timer = setInterval(loadFriends, 30000);
        return () => clearInterval(timer);
    }, [currentUser?.id]);
    const [activeChatFriend, setActiveChatFriend] = useState(null);
    const [areaName, setAreaName] = useState('Town Square');

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
                const existingFriendIds = (familyData?.friends || []).map(f => String(f.id));
                setSearchResults(data.users.filter(u => !existingFriendIds.includes(String(u.id))));
            }
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsSearching(false);
        }
    };

    const withBusy = async (id, fn) => {
        setBusyIds(ids => [...ids, id]);
        try { await fn(); } finally { setBusyIds(ids => ids.filter(x => x !== id)); }
    };

    const relationOf = (userId) => {
        if (requests.outgoing.some(r => String(r.id) === String(userId))) return 'outgoing';
        if (requests.incoming.some(r => String(r.id) === String(userId))) return 'incoming';
        return null;
    };

    const handleAddFriend = (user) => withBusy(user.id, async () => {
        const name = user.character?.name || user.username;
        try {
            const res = await sendFriendRequest(currentUser.id, user.id);
            toast.success(res.status === 'accepted' ? `${name} has joined your party.` : `Request sent to ${name}. They need to accept it.`);
            await loadFriends();
        } catch (e) {
            toast.error(e.message);
        }
    });

    const handleRespond = (request, accept) => withBusy(request.id, async () => {
        const name = request.character?.name || request.username;
        try {
            await respondToRequest(currentUser.id, request.request_id, accept);
            toast[accept ? 'success' : 'info'](accept ? `${name} has joined your party.` : `Request from ${name} declined.`);
            await loadFriends();
        } catch (e) {
            toast.error(e.message);
        }
    });

    const handleCancelRequest = (request) => withBusy(request.id, async () => {
        try {
            await removeFriend(currentUser.id, request.id);
            await loadFriends();
        } catch (e) {
            toast.error(e.message);
        }
    });

    const handleRemoveFriend = async (friendId) => {
        if (!await confirm({ title: 'Dismiss Ally?', message: 'This hero will leave your party, and you will leave theirs.', variant: 'warning', confirmText: 'Dismiss' })) return;
        const friend = (familyData?.friends || []).find(f => f.id === friendId);
        try {
            await removeFriend(currentUser.id, friendId);
            // Drop it locally right away; the next sync confirms it.
            if (typeof setFamilyData === 'function') {
                setFamilyData({ ...familyDataRef.current, friends: (familyDataRef.current.friends || []).filter(f => f.id !== friendId) });
            }
            toast.info(`${friend?.character?.name || friend?.username || 'Hero'} has left the party.`);
            await loadFriends();
        } catch (e) {
            toast.error(e.message);
        }
    };

    const handleShareInvite = async () => {
        const shareUrl = `${window.location.origin}${window.location.pathname}`;
        const shareData = {
            title: 'Taskoria — Join my party!',
            text: `${state.character?.name || 'A hero'} invites you to Taskoria. Turn your tasks into quests!`,
            url: shareUrl,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (e) {
                if (e.name !== 'AbortError') {
                    await navigator.clipboard.writeText(shareUrl);
                    toast.success('Link copied — share it with your allies.');
                }
            }
        } else {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Link copied — share it with your allies.');
        }
    };

    const handleRemoveFamilyMember = async (memberId) => {
        if (!await confirm({ title: 'Delete Hero?', message: 'This family member will be permanently removed from your account. All their data will be lost.', variant: 'danger', confirmText: 'Delete Forever' })) return;
        const newProfiles = (familyData?.profiles || []).filter(p => p.id !== memberId);
        if (typeof setFamilyData === 'function') {
            setFamilyData({
                ...familyData,
                profiles: newProfiles
            });
        }
    };

    const handleBattle = async (opponentId, isLocal) => {
        if (!await confirm({ title: 'Issue Challenge?', message: isLocal ? 'A friendly sparring match between allies.' : 'A network battle against this player.', variant: 'quest', confirmText: 'Fight!' })) return;

        const myChar = state.character;

        if (isLocal) {
            // Local PvP Simulator (Family)
            const opponent = familyMembers.find(u => u.id === opponentId);
            if (!opponent || !opponent.state || !opponent.state.character) {
                toast.info("This family member hasn't created a hero yet.");
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
                    iWon ? `Victory against ${opChar.name}!` : `Defeated by ${opChar.name}!`,
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
                    toast.error(data.error);
                    return;
                }

                setBattleResult(data);

                // Update local state if we won/lost items
                if (data.newState) {
                    dispatch({ type: 'RESTORE_STATE', payload: data.newState });
                }

                if (actions.triggerPush) {
                    const isWin = data.winner === 'attacker';
                    actions.triggerPush(isWin ? 'Network Victory!' : 'Network Defeat!', data.log || (isWin ? 'You won the battle!' : 'You lost the battle.'));
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
            <div key={u.id} className="bg-rpg-panel/60 backdrop-blur-xl p-3 sm:p-6 relative group border border-white/10 rounded-2xl shadow-xl hover:border-rpg-gold/50 hover:shadow-[0_0_30px_rgba(255,215,0,0.15)] transition-all duration-300">
                <button
                    onClick={() => isLocal ? handleRemoveFamilyMember(u.id) : handleRemoveFriend(u.id)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-red-400 bg-black/20 hover:bg-black/50 p-1.5 rounded-lg transition-colors"
                    title={isLocal ? "Delete Family Member" : "Remove from Party"}
                >
                    ×
                </button>

                {/* Avatar */}
                <div className="flex justify-center mb-3 sm:mb-6">
                    <div className="relative w-16 h-16 sm:w-24 sm:h-24 bg-black/30 rounded-2xl border border-white/10 shadow-inner overflow-hidden flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(255,215,0,0.1)] transition-all">
                        {charData ? (
                            <ModernPixelAvatar type={displayAvatar} scale={2} headOnly={true} customColors={customColors} />
                        ) : (
                            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-600 text-sm">?</div>
                        )}
                        {!isLocal && charData && (
                            <div className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-rpg-panel z-10 ${u.is_online ? 'bg-green-500' : 'bg-gray-500'}`} title={u.is_online ? "Online" : "Offline"}></div>
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
            <div className="flex gap-1 border-b border-white/5 overflow-x-auto custom-scrollbar shrink-0">
                {[
                    { id: 'friends', label: 'Friends', icon: 'users' },
                    { id: 'shop', label: 'Market', icon: 'coins' },
                    { id: 'guilds', label: 'Guilds', icon: 'shield' },
                    { id: 'boss', label: 'Arena', icon: 'sword' },
                    { id: 'sanctuary', label: 'Sanctuary', icon: 'heart' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                            ? 'border-rpg-gold/60 text-white'
                            : 'border-transparent text-gray-600 hover:text-gray-400'}`}
                    >
                        <PixelIcon name={tab.icon} size={11} color={activeTab === tab.id ? '#fbbf24' : undefined} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
                        {tab.id === 'friends' && requests.incoming.length > 0 && (
                            <span className="min-w-[16px] h-4 px-1 rounded-full bg-rpg-gold text-rpg-bg text-[10px] font-bold flex items-center justify-center leading-none" aria-label={`${requests.incoming.length} party requests`}>
                                {requests.incoming.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <ChatModal
                isOpen={!!activeChatFriend}
                onClose={() => setActiveChatFriend(null)}
                currentUser={currentUser}
                friend={activeChatFriend}
            />

            {activeTab === 'friends' && (
                <>
                        {/* Requests waiting for you */}
                        {requests.incoming.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-heading font-bold text-gray-300 mb-3 border-b border-white/10 pb-2 flex items-center gap-2 uppercase tracking-wider">
                                    <PixelIcon name="scroll" size={16} className="text-rpg-gold" /> Party requests
                                    <span className="text-[11px] text-rpg-gold ml-auto font-sans">{requests.incoming.length}</span>
                                </h3>
                                <div className="flex flex-col gap-2">
                                    {requests.incoming.map(r => (
                                        <div key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-2.5 p-3 rounded-xl bg-rpg-gold/[0.06] ring-1 ring-rpg-gold/25">
                                            <div className="w-11 h-11 rounded-xl bg-black/30 overflow-hidden flex items-center justify-center shrink-0">
                                                {r.character ? <ModernPixelAvatar type={r.character.avatarId} scale={1.6} headOnly customColors={r.character.avatarColors} /> : <PixelIcon name="user" size={16} color="#6b7280" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-white truncate">{r.character?.name || r.username}</p>
                                                <p className="text-xs text-gray-400 truncate">wants to join your party{r.character ? ` · Lv ${r.character.level} ${r.character.class}` : ''}</p>
                                            </div>
                                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                                <button onClick={() => handleRespond(r, false)} disabled={busyIds.includes(r.id)} className="px-3.5 py-2 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50">Decline</button>
                                                <button onClick={() => handleRespond(r, true)} disabled={busyIds.includes(r.id)} className="px-4 py-2 rounded-lg text-xs font-bold bg-rpg-gold text-rpg-bg hover:brightness-105 transition-[filter] disabled:opacity-50">Accept</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    {/* ── Playable World: explore zone (below party list) ── */}
                    <div className="mb-10 relative">
                        <h3 className="text-sm font-heading font-bold text-gray-300 mb-3 border-b border-white/10 pb-2 flex items-center gap-2 uppercase tracking-wider">
                            <PixelIcon name="home" size={16} className="text-orange-400" /> {areaName}
                            <span className="text-[10px] text-gray-500 ml-auto font-sans">{1 + friends.filter(f => f.is_online).length} online</span>
                        </h3>

                        <Suspense fallback={
                            <div className="relative w-full h-[500px] sm:h-[600px] bg-black border-4 border-rpg-panel rounded-t-xl flex items-center justify-center text-rpg-gold animate-pulse">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-2 border-rpg-gold border-t-transparent rounded-full animate-spin" />
                                    <div className="text-[10px] uppercase tracking-widest font-bold">Loading world…</div>
                                </div>
                            </div>
                        }>
                            <PlayableWorld
                                className="relative w-full h-[500px] sm:h-[600px] bg-black border-4 border-rpg-panel rounded-t-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                                currentUser={currentUser}
                                activeProfile={familyData?.profiles?.find(p => p.id === activeProfileId)}
                                familyMembers={familyMembers}
                                friends={friends}
                                onAreaChange={setAreaName}
                                onInteract={(target) => {
                                    if (target.target === 'ledgar') {
                                        window.dispatchEvent(new CustomEvent('taskoria:open-feedback'));
                                        return;
                                    }
                                    setActiveTab(target.target);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                            />
                        </Suspense>

                        <div className="bg-[#2b254a] p-3 border-x-4 border-b-4 border-rpg-panel rounded-b-lg flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-widest mt-[-2px]">
                            <div className="flex items-center gap-4">
                                <span className="flex text-[10px] items-center gap-1"><span className="text-white">WASD</span> to walk</span>
                                <span className="flex text-[10px] items-center gap-1"><div className="w-2 h-2 rounded-full border border-dashed border-white"></div> Portals</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Search + Invite: always visible at the top ── */}
                    <div className="bg-rpg-panel/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 sm:p-5 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Find or invite heroes</h3>
                            <button
                                onClick={handleShareInvite}
                                className="text-[10px] text-rpg-gold font-bold uppercase tracking-wider hover:text-white transition-colors flex items-center gap-1.5"
                            >
                                <PixelIcon name="scroll" size={12} />
                                Share invite
                            </button>
                        </div>
                        <form onSubmit={handleSearch} className="flex gap-3">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by username..."
                                className="flex-1 bg-black/40 border border-white/10 px-3 py-2.5 rounded-xl text-sm text-white outline-none focus:border-rpg-gold focus:ring-1 focus:ring-rpg-gold/50 transition-all font-sans"
                            />
                            <button
                                type="submit"
                                disabled={isSearching || !searchQuery.trim()}
                                className="bg-rpg-gold text-rpg-bg px-5 py-2.5 rounded-xl text-sm font-bold shadow-glow-gold hover:scale-[1.03] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shrink-0"
                            >
                                {isSearching ? (
                                    <div className="w-4 h-4 border-2 border-rpg-bg border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <PixelIcon name="checkSquare" size={14} color="#1a1a2e" />
                                )}
                                {isSearching ? 'Scouting...' : 'Search'}
                            </button>
                        </form>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/10">
                                <h4 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">Found Heroes</h4>
                                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                                    {searchResults.map(u => (
                                        <div key={u.id} className="flex items-center justify-between bg-black/30 p-2.5 rounded-lg border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden">
                                                    {u.character ? (
                                                        <ModernPixelAvatar type={u.character.avatarId} scale={1.5} customColors={u.character.avatarColors} />
                                                    ) : (
                                                        <PixelIcon name="user" size={14} className="text-gray-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white leading-none mb-0.5">{u.username}</div>
                                                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                                        {u.character ? `Lvl ${u.character.level} ${u.character.class}` : 'New adventurer'}
                                                    </div>
                                                </div>
                                            </div>
                                            {relationOf(u.id) === 'outgoing' ? (
                                                <span className="text-xs text-gray-400 font-semibold px-3 py-1.5">Request sent</span>
                                            ) : (
                                                <button
                                                    onClick={() => handleAddFriend(u)}
                                                    disabled={busyIds.includes(u.id)}
                                                    className="text-xs bg-rpg-gold/10 hover:bg-rpg-gold/20 text-rpg-gold px-3 py-1.5 rounded-lg font-bold transition-all border border-rpg-gold/30 hover:border-rpg-gold/60 flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    {relationOf(u.id) === 'incoming' ? 'Accept' : 'Send request'}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* No results feedback */}
                        {searchQuery.trim() && searchResults.length === 0 && !isSearching && (
                            <div className="mt-3 pt-3 border-t border-white/10 text-center py-3">
                                <p className="text-sm text-gray-500">No heroes found matching "{searchQuery}"</p>
                                <button
                                    onClick={handleShareInvite}
                                    className="mt-2 text-xs text-rpg-gold font-bold hover:text-white transition-colors"
                                >
                                    Invite them with a link instead
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ── Party Members + Family ── */}
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <p className="text-gray-400 text-sm font-bold animate-pulse flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-rpg-gold border-t-transparent rounded-full animate-spin" /> Scouting for heroes...
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8 mb-8">
                            {/* Requests you sent */}
                            {requests.outgoing.length > 0 && (
                                <div>
                                    <h3 className="text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Waiting for a reply</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {requests.outgoing.map(r => (
                                            <span key={r.id} className="inline-flex items-center gap-2 pl-3 pr-1 py-1 rounded-full bg-white/[0.05] text-xs text-gray-300">
                                                {r.character?.name || r.username}
                                                <button onClick={() => handleCancelRequest(r)} disabled={busyIds.includes(r.id)} aria-label={`Cancel request to ${r.username}`} className="w-5 h-5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center disabled:opacity-50">×</button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* External Friends */}
                            {friends.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-heading font-bold text-gray-300 mb-3 border-b border-white/10 pb-2 flex items-center gap-2 uppercase tracking-wider">
                                        <PixelIcon name="users" size={16} className="text-purple-400" /> Party Members
                                        <span className="text-[10px] text-gray-500 ml-auto font-sans">{friends.length}</span>
                                    </h3>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                                        {friends.map(u => renderUserCard(u, false))}
                                    </div>
                                </div>
                            )}

                            {/* Family Characters */}
                            {familyMembers.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-heading font-bold text-gray-300 mb-3 border-b border-white/10 pb-2 flex items-center gap-2 uppercase tracking-wider">
                                        <PixelIcon name="home" size={16} className="text-blue-400" /> Family Estate
                                        <span className="text-[10px] text-gray-500 ml-auto font-sans">{familyMembers.length}</span>
                                    </h3>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                                        {familyMembers.map(u => renderUserCard(u, true))}
                                    </div>
                                </div>
                            )}

                            {familyMembers.length === 0 && friends.length === 0 && (
                                <div className="text-center py-10 glass-panel rounded-2xl">
                                    <PixelIcon name="users" size={32} className="text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400 font-bold text-sm">The town square is quiet today.</p>
                                    <p className="text-xs text-gray-600 mt-1.5 max-w-[260px] mx-auto">Search for heroes above or share an invite link. A hero joins your party once they accept.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Battle Result Modal */}
                    {battleResult && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
                            <div className={`bg-rpg-panel/90 backdrop-blur-3xl rounded-3xl p-8 max-w-sm w-full text-center border shadow-2xl ${battleResult.winner === 'attacker' ? 'border-green-500/50 shadow-[0_0_50px_rgba(45,204,112,0.2)]' : 'border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)]'}`}>
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
                    <Suspense fallback={
                        <div className="min-h-[400px] flex items-center justify-center text-rpg-gold animate-pulse">
                            <div className="w-6 h-6 border-2 border-rpg-gold border-t-transparent rounded-full animate-spin" />
                        </div>
                    }>
                        <Shop currentUser={currentUser} />
                    </Suspense>
                </div>
            )}

            {activeTab === 'sanctuary' && (
                <PetSanctuaryView currentUser={currentUser} />
            )}
        </div>
    );
};

export default PartyView;
