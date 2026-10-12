import React, { useEffect, useRef, useState, Suspense } from 'react';
import ModernPixelAvatar from '../common/ModernPixelAvatar';
import PixelIcon from '../common/PixelIcon';
import CoFocusingArea from './CoFocusingArea';
import PetSanctuaryView from './PetSanctuaryView';
import ChatModal from './ChatModal';
import GuildView from './GuildView';
import BossArena from './BossArena';
import { useConfirm } from '../../context/ConfirmContext';
import DuelArena from '../duel/DuelArena';
import { buildCombatant, runDuel, randomRoll } from '../../utils/duelEngine';
import {
    previewDuel, sendChallenge, answerChallenge, cancelChallenge, fetchDuelInbox, watchDuel, announceDuelsChanged, DUELS_CHANGED,
} from '../../utils/duelApi';
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

const hoursLeft = (iso) => {
    const h = Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 3600000));
    return h <= 1 ? 'under an hour left' : `${h}h left`;
};

const sameIds = (a = [], b = []) => a.length === b.length && a.every(x => b.some(y => String(y.id) === String(x.id)));

const PartyView = ({ currentUser, onOpenChat }) => {
    const { state, dispatch, activeProfileId, familyData, setFamilyData } = useGame();
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
    const [duel, setDuel] = useState(null);
    // Challenges between friends: the rival decides, so they live on the server.
    const [duels, setDuels] = useState({ me: null, incoming: [], outgoing: [], finished: [] });

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

    const loadDuels = async () => {
        if (!canUseServer) return;
        try { setDuels(await fetchDuelInbox(currentUser.id)); } catch (e) { console.error('Could not load duels', e); }
    };

    useEffect(() => {
        if (!canUseServer) return;
        loadFriends();
        loadDuels();
        const timer = setInterval(() => { loadFriends(); loadDuels(); }, 30000);
        window.addEventListener(DUELS_CHANGED, loadDuels);
        return () => { clearInterval(timer); window.removeEventListener(DUELS_CHANGED, loadDuels); };
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

    // A duel is played like a tabletop session (components/duel). Network duels are rolled and
    // decided on the server; family sparring is rolled here with the same rules and no stakes.
    const handleBattle = async (opponentId, isLocal) => {
        const myChar = state.character;
        const today = new Date().toLocaleDateString('en-CA');

        if (isLocal) {
            const opponent = familyMembers.find(u => u.id === opponentId);
            if (!opponent || !opponent.state || !opponent.state.character) {
                toast.info("This family member hasn't created a hero yet.");
                return;
            }
            const me = buildCombatant(myChar, { today });
            const foe = buildCombatant(opponent.state.character, { today });
            setDuel({
                me, foe,
                stakes: 'A friendly sparring match between allies — nothing is lost.',
                fight: async (stance) => {
                    const r = runDuel(me, foe, { a: stance }, randomRoll);
                    if (r.winner === 'a') dispatch({ type: 'COMPLETE_TASK', payload: 'dummy_pvp_win' });
                    return { events: r.events, spoils: null, local: true };
                },
            });
            return;
        }

        try {
            const sheets = await previewDuel(currentUser.id, opponentId);
            setDuel({
                mode: 'send', viewerSide: 'a', me: sheets.a, foe: sheets.b,
                stakes: `${sheets.b.name} has to accept before a single die is rolled — and picks their own stance. It's a duel of honor: nothing is taken from either hero.`,
                fight: async (stance) => {
                    try {
                        const sent = await sendChallenge(currentUser.id, opponentId, stance);
                        loadDuels(); announceDuelsChanged();
                        return { message: `${sheets.b.name} has ${hoursLeft(sent.expiresAt).replace(' left', '')} to answer.` };
                    } catch (e) { toast.error(e.message); throw e; }
                },
            });
        } catch (e) {
            toast.error(e.message || 'Could not reach the arena. Try again in a moment.');
        }
    };

    // The challenged friend sits at the table as side B and chooses their own stance.
    const openChallenge = (c) => {
        if (!duels.me || !c.other) { toast.info('That hero is not ready yet.'); return; }
        setDuel({
            mode: 'answer', viewerSide: 'b', me: duels.me, foe: c.other,
            stakes: 'Accept and the dice roll right now. A duel of honor — nothing is taken from either hero.',
            fight: async (stance) => {
                try {
                    const data = await answerChallenge(currentUser.id, c.id, 'accept', stance);
                    loadDuels(); announceDuelsChanged();
                    return { events: data.duel.events, local: true };
                } catch (e) { toast.error(e.message); loadDuels(); throw e; }
            },
            decline: async () => {
                try {
                    await answerChallenge(currentUser.id, c.id, 'decline');
                    toast.info(`Challenge from ${c.other.name} declined.`);
                    setDuel(null); loadDuels(); announceDuelsChanged();
                } catch (e) { toast.error(e.message); loadDuels(); throw e; }
            },
        });
    };

    const declineChallenge = async (c) => {
        try {
            await answerChallenge(currentUser.id, c.id, 'decline');
            toast.info(`Challenge from ${c.other?.name || 'your friend'} declined.`);
        } catch (e) { toast.error(e.message); }
        loadDuels(); announceDuelsChanged();
    };

    const withdrawChallenge = async (c) => {
        try { await cancelChallenge(currentUser.id, c.id); toast.info('Challenge withdrawn.'); }
        catch (e) { toast.error(e.message); }
        loadDuels(); announceDuelsChanged();
    };

    const watchFinished = async (c) => {
        try {
            const data = await watchDuel(currentUser.id, c.id);
            setDuel({ mode: 'watch', viewerSide: data.viewerSide, initial: { events: data.duel.events, local: true } });
            loadDuels(); announceDuelsChanged();
        } catch (e) { toast.error(e.message); }
    };

    const closeDuel = () => {
        setDuel(null);
        loadDuels();
    };

    const openWith = new Set([...duels.incoming, ...duels.outgoing].map(c => String(c.otherId)));

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
                        disabled={!isLocal && openWith.has(String(u.id))}
                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/60 py-2 sm:py-3 rounded-xl text-xs sm:text-base font-bold flex items-center justify-center gap-1 sm:gap-2 transition-all duration-300 group/btn disabled:opacity-50 disabled:cursor-default disabled:hover:bg-red-500/10 disabled:hover:border-red-500/30"
                    >
                        <PixelIcon name="sword" size={14} className="group-hover/btn:scale-125 transition-transform hidden sm:block" />
                        {!isLocal && openWith.has(String(u.id)) ? 'DUEL PENDING' : isLocal ? 'SPAR' : 'CHALLENGE'}
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
                                                {r.character ? <ModernPixelAvatar type={r.character.avatarId} scale={1.6} headOnly customColors={r.character.avatarColors} cosmetics={r.character.cosmetics} /> : <PixelIcon name="user" size={16} color="#6b7280" />}
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

                        {/* Duels: challenges waiting for you, sent by you, and the latest results */}
                        {(duels.incoming.length > 0 || duels.outgoing.length > 0 || duels.finished.length > 0) && (
                            <div className="mb-6">
                                <h3 className="text-sm font-heading font-bold text-gray-300 mb-3 border-b border-white/10 pb-2 flex items-center gap-2 uppercase tracking-wider">
                                    <PixelIcon name="sword" size={16} className="text-red-400" /> Duels
                                    {duels.incoming.length > 0 && <span className="text-[11px] text-rpg-gold ml-auto font-sans">{duels.incoming.length} waiting</span>}
                                </h3>
                                <div className="flex flex-col gap-2">
                                    {duels.incoming.map(c => (
                                        <div key={`in-${c.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-2.5 p-3 rounded-xl bg-red-500/[0.07] ring-1 ring-red-400/25">
                                            <div className="w-11 h-11 rounded-xl bg-black/30 overflow-hidden flex items-center justify-center shrink-0">
                                                {c.other && <ModernPixelAvatar type={c.other.avatarId} scale={1.6} headOnly customColors={c.other.avatarColors} />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-white truncate">{c.other?.name || 'A friend'} challenges you</p>
                                                <p className="text-xs text-gray-400 truncate">{c.other ? `Lv ${c.other.level} ${c.other.className} · ` : ''}{hoursLeft(c.expiresAt)}</p>
                                            </div>
                                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                                <button onClick={() => declineChallenge(c)} className="px-3.5 py-2 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors">Decline</button>
                                                <button onClick={() => openChallenge(c)} className="px-4 py-2 rounded-lg text-xs font-bold bg-rpg-gold text-rpg-bg hover:brightness-105 transition-[filter]">Answer</button>
                                            </div>
                                        </div>
                                    ))}
                                    {duels.outgoing.map(c => (
                                        <div key={`out-${c.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] ring-1 ring-white/10">
                                            <div className="w-11 h-11 rounded-xl bg-black/30 overflow-hidden flex items-center justify-center shrink-0">
                                                {c.other && <ModernPixelAvatar type={c.other.avatarId} scale={1.6} headOnly customColors={c.other.avatarColors} />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-white truncate">Waiting for {c.other?.name || 'your friend'}</p>
                                                <p className="text-xs text-gray-400 truncate">Your stance is sealed · {hoursLeft(c.expiresAt)}</p>
                                            </div>
                                            <button onClick={() => withdrawChallenge(c)} className="px-3.5 py-2 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors">Withdraw</button>
                                        </div>
                                    ))}
                                    {duels.finished.slice(0, 5).map(c => {
                                        const name = c.other?.name || 'your friend';
                                        const text = c.status === 'accepted'
                                            ? (c.won ? `You beat ${name}` : `${name} bested you`)
                                            : c.status === 'declined' ? (c.me === 'challenger' ? `${name} declined` : `You declined ${name}`)
                                            : `Challenge with ${name} expired`;
                                        return (
                                            <div key={`done-${c.id}`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02]">
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.unseen ? 'bg-rpg-gold' : 'bg-transparent'}`} aria-label={c.unseen ? 'New result' : undefined} />
                                                <p className={`text-sm min-w-0 flex-1 truncate ${c.status === 'accepted' && c.won ? 'text-emerald-300' : 'text-gray-400'}`}>{text}{c.rounds ? <span className="text-gray-600"> · {c.rounds} rounds</span> : null}</p>
                                                {c.status === 'accepted' && <button onClick={() => watchFinished(c)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors">Watch</button>}
                                            </div>
                                        );
                                    })}
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
                                                        <ModernPixelAvatar type={u.character.avatarId} scale={1.5} customColors={u.character.avatarColors} cosmetics={u.character.cosmetics} />
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

                    {duel && (
                        <DuelArena mode={duel.mode || 'fight'} me={duel.me} foe={duel.foe} stakes={duel.stakes} viewerSide={duel.viewerSide || 'a'}
                            initial={duel.initial} onFight={duel.fight} onDecline={duel.decline} onClose={closeDuel} />
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
