import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Users } from 'lucide-react';
import PixelAvatar from '../common/PixelAvatar';
import ChatModal from './ChatModal';
import { useGame } from '../../context/GameContext';

const ChatInbox = ({ isOpen, onClose, currentUser, onOpenChat }) => {
    const { familyData, activeProfileId } = useGame();
    const [recentChats, setRecentChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const pollInterval = useRef(null);

    const fetchRecentChats = async () => {
        if (!isOpen || !currentUser) return;
        try {
            // Re-utilizamos el unread_count que ya existe para saber quién nos ha hablado,
            // pero para una "Bandeja de entrada", idealmente queremos los últimos N mensajes agrupados.
            // Puesto que messages.php no tiene un 'get_inbox' específico, cruzamos datos con nuestros amigos:

            const friends = familyData?.friends || [];
            const familyProfiles = familyData?.profiles || [];

            // 1. Conseguimos el unread_count (filtrado por nuestro perfil actual)
            const res = await fetch(`api/messages.php?action=unread_count&user_id=${currentUser.id}&profile_id=${activeProfileId}`);
            const unreadData = await res.json();

            // 2. Combinamos amigos y familiares
            const combinedList = [
                ...friends.map(f => ({ ...f, type: 'friend' })),
                ...familyProfiles
                    .filter(p => p.id !== activeProfileId)
                    .map(p => ({
                        id: currentUser.id,
                        profile_id: p.id,
                        username: p.name,
                        character: p.state?.character,
                        is_online: true,
                        type: 'family'
                    }))
            ];

            // 3. Mapeamos para ver quién tiene chats no leídos o activos
            const inboxList = combinedList.map(item => {
                let unread = 0;
                if (item.type === 'family') {
                    unread = unreadData.by_profile?.[item.profile_id] || 0;
                } else {
                    unread = unreadData.by_sender?.[item.id] || 0;
                }
                return {
                    ...item,
                    unreadCount: unread
                };
            });

            // Ordenamos: Los que tienen mensajes sin leer arriba
            inboxList.sort((a, b) => b.unreadCount - a.unreadCount);

            setRecentChats(inboxList);
            setLoading(false);

        } catch (e) {
            console.error("Error fetching inbox", e);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchRecentChats();
            pollInterval.current = setInterval(fetchRecentChats, 10000);
        } else {
            if (pollInterval.current) clearInterval(pollInterval.current);
        }
        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [isOpen, currentUser, familyData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-x-4 top-[80px] bottom-24 md:inset-auto md:absolute md:right-0 md:top-full md:mt-4 md:w-80 bg-[#1a102e]/95 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50 shadow-2xl ring-1 ring-white/10 flex flex-col md:max-h-[70vh]">

            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
                <h3 className="text-white font-bold font-heading flex items-center gap-2">
                    <MessageSquare size={18} className="text-indigo-400" />
                    Message Inbox
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <X size={18} />
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {loading ? (
                    <div className="text-center p-6 text-gray-500 text-sm animate-pulse">
                        Loading carrier pigeons...
                    </div>
                ) : recentChats.length === 0 ? (
                    <div className="text-center p-6 text-gray-500 flex flex-col items-center gap-2">
                        <Users size={32} className="opacity-20 mb-2" />
                        <p className="text-sm">Your inbox is empty.</p>
                        <p className="text-xs">Add friends in the Party to start chatting!</p>
                    </div>
                ) : (
                    recentChats.map(friend => {
                        const charData = friend.character || {};
                        const uniqueKey = friend.type === 'family' ? `family-${friend.profile_id}` : `friend-${friend.id}`;
                        return (
                            <button
                                key={uniqueKey}
                                onClick={() => onOpenChat && onOpenChat(friend)}
                                className="w-full text-left p-3 hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3 group relative"
                            >
                                <div className="w-10 h-10 shrink-0 rounded-full bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden">
                                    {charData.avatarId ? (
                                        <PixelAvatar type={charData.avatarId} scale={1.2} customColors={charData.avatarColors} headOnly={true} />
                                    ) : (
                                        <div className="text-gray-500 font-bold">?</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                                        {friend.username}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                        {friend.is_online ? <span className="text-green-500">Online</span> : 'Offline'}
                                    </div>
                                </div>
                                {friend.unreadCount > 0 && (
                                    <div className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                                        {friend.unreadCount} New
                                    </div>
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ChatInbox;
