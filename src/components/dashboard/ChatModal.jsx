import React, { useState, useEffect, useRef } from 'react';
import PixelAvatar from '../common/PixelAvatar';
import { Send, X, MessageSquare } from 'lucide-react';
import { useGame } from '../../context/GameContext';

const ChatModal = ({ isOpen, onClose, currentUser, friend, onUpdateUnread }) => {
    const { activeProfileId } = useGame();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const pollInterval = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        if (!isOpen || !friend) return;

        try {
            // Include profile IDs if available
            const p1 = activeProfileId || '';
            const p2 = friend.profile_id || ''; // friend might have a profile_id if it's a family member
            const res = await fetch(`api/messages.php?action=get_chat&user1=${currentUser.id}&user2=${friend.id}&p1=${p1}&p2=${p2}`);
            const data = await res.json();

            if (data.success) {
                // Use String() for safe comparison of IDs that might be numeric or string
                const unreadFromFriend = data.messages.some(m => !m.is_read && String(m.sender_id) === String(friend.id));

                setMessages(data.messages);

                if (unreadFromFriend) {
                    await fetch('api/messages.php?action=mark_read', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            user_id: currentUser.id, 
                            other_id: friend.id,
                            profile_id: activeProfileId,
                            other_profile_id: friend.profile_id
                        })
                    });
                    if (onUpdateUnread) onUpdateUnread(); // Tell parent to decrease bell counter
                }
            }
        } catch (e) {
            console.error("Failed to fetch messages", e);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchMessages();
            // Start polling for this specific chat
            pollInterval.current = setInterval(fetchMessages, 5000);
        } else {
            if (pollInterval.current) clearInterval(pollInterval.current);
            setMessages([]);
        }

        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [isOpen, friend]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const tempMessage = {
            id: Date.now(), // temp id
            sender_id: currentUser.id,
            receiver_id: friend.id,
            sender_profile_id: activeProfileId,
            receiver_profile_id: friend.profile_id,
            message: newMessage,
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, tempMessage]);
        setNewMessage('');
        setIsLoading(true);

        try {
            const res = await fetch('api/messages.php?action=send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_id: parseInt(currentUser.id, 10),
                    receiver_id: parseInt(friend.id, 10),
                    sender_profile_id: activeProfileId,
                    receiver_profile_id: friend.profile_id,
                    message: tempMessage.message
                })
            });
            const data = await res.json();
            if (!data.success) {
                console.error("Failed to send message", data.error);
                // If failed, remove the temporary message to show it wasn't sent
                setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
                alert("Failed to send message: " + (data.error || "Unknown error"));
            } else {
                await fetchMessages(); // Refresh to get the real ID and exact timestamp
            }
        } catch (e) {
            console.error("Error sending message", e);
            setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !friend) return null;

    const friendChar = friend.character || {};

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1a102e]/95 border border-white/10 rounded-3xl shadow-2xl w-full max-w-md h-[600px] max-h-[90vh] flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden">
                            {friendChar.avatarId ? (
                                <PixelAvatar type={friendChar.avatarId} scale={1.5} customColors={friendChar.avatarColors} headOnly={true} />
                            ) : (
                                <div className="text-gray-500 font-bold">?</div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-white font-bold">{friend.username}</h3>
                            <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${friend.is_online ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                    {friend.is_online ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3">
                            <MessageSquare size={48} className="opacity-20" />
                            <p className="font-heading italic">Say hello to your fellow adventurer!</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            // If same user IDs (family), check profiles. Otherwise check user ID.
                            const isMe = String(msg.sender_id) === String(currentUser.id) && 
                                         (msg.sender_profile_id ? String(msg.sender_profile_id) === String(activeProfileId) : true);

                            // Simple formatting for timestamp
                            const date = new Date(msg.created_at);
                            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                            return (
                                <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div
                                        className={`max-w-[80%] p-3 rounded-2xl text-sm ${isMe
                                            ? 'bg-indigo-600/80 text-white rounded-br-sm shadow-[0_0_15px_rgba(79,70,229,0.2)]'
                                            : 'bg-black/50 border border-white/10 text-gray-200 rounded-bl-sm'
                                            }`}
                                    >
                                        {msg.message}
                                    </div>
                                    <span className="text-[9px] text-gray-500 mt-1 font-mono">{timeStr}</span>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-black/40 flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Message..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 focus:bg-white/10 transition-all placeholder:text-gray-600"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isLoading}
                        className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20"
                    >
                        <Send size={18} />
                    </button>
                </form>

            </div>
        </div>
    );
};

export default ChatModal;
