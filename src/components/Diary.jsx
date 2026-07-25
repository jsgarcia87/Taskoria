import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Book, Plus, Trash2, Calendar, Share2, CheckSquare, Square, Type, ListTodo, Edit2 } from 'lucide-react';
import CalendarView from './dashboard/CalendarView';
import { useToast } from './common/Toast';

const Diary = () => {
    const toast = useToast();
    const { state, actions } = useGame();
    const { character } = state;

    // Fallback if character.notes doesn't exist yet
    const notes = character?.notes || [];

    const [isWriting, setIsWriting] = useState(false);
    const [diaryTab, setDiaryTab] = useState('notes'); // 'notes' | 'calendar'
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [noteType, setNoteType] = useState('text'); // 'text' | 'list'
    const [newTitle, setNewTitle] = useState('');
    const [newText, setNewText] = useState('');

    // List drafting state
    const [listItems, setListItems] = useState([]);
    const [newItemText, setNewItemText] = useState('');

    const handleSaveNote = () => {
        if (!newTitle.trim() && !newText.trim() && listItems.length === 0) return;

        const timestamp = new Date().toISOString();

        if (editingNoteId) {
            // Update existing note
            const updatedNotes = notes.map(n => {
                if (n.id === editingNoteId) {
                    return {
                        ...n,
                        type: noteType,
                        title: newTitle || (noteType === 'list' ? 'Quest List' : 'Untitled thought...'),
                        text: newText,
                        items: noteType === 'list' ? listItems : [],
                        // Keep original date or update it? Usually keep original creation date and maybe add modified, 
                        // but sticking to simple 'date' update is fine or keeping old date. Let's keep original date for diary feel.
                    };
                }
                return n;
            });
            actions.updateCharacter({ notes: updatedNotes });
        } else {
            // Create new note
            const note = {
                id: Date.now(),
                type: noteType,
                title: newTitle || (noteType === 'list' ? 'New Quest List' : 'Untitled thought...'),
                text: newText,
                items: noteType === 'list' ? listItems : [],
                date: timestamp
            };
            actions.updateCharacter({ notes: [note, ...notes] });
        }

        resetDraft();
    };

    const handleEditNote = (note) => {
        setEditingNoteId(note.id);
        setNoteType(note.type || 'text');
        setNewTitle(note.title || '');
        setNewText(note.text || '');
        setListItems(note.items || []);
        setIsWriting(true);
    };

    const resetDraft = () => {
        setIsWriting(false);
        setEditingNoteId(null);
        setNewTitle('');
        setNewText('');
        setNoteType('text');
        setListItems([]);
        setNewItemText('');
    };

    const handleDeleteNote = (id) => {
        actions.updateCharacter({ notes: notes.filter(n => n.id !== id) });
    };

    const handleToggleListItem = (noteId, itemId) => {
        const updatedNotes = notes.map(n => {
            if (n.id === noteId && n.type === 'list') {
                return {
                    ...n,
                    items: n.items.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item)
                };
            }
            return n;
        });
        actions.updateCharacter({ notes: updatedNotes });
    };

    const handleShareNote = async (note) => {
        let textToShare = `${note.title}\n\n`;
        if (note.type === 'list') {
            textToShare += note.items.map(i => `${i.completed ? '✅' : '☐'} ${i.text}`).join('\n');
        } else {
            textToShare += note.text;
        }

        if (navigator.share) {
            try {
                await navigator.share({
                    title: note.title,
                    text: textToShare,
                });
            } catch (err) {
                // Ignore AbortError if they cancelled sharing
                if (err.name !== 'AbortError') {
                    console.error('Error sharing', err);
                }
            }
        } else {
            navigator.clipboard.writeText(textToShare);
            toast.success('Ledgar copied the entry to your scroll.');
        }
    };

    const handleAddListItem = (e) => {
        e.preventDefault();
        if (!newItemText.trim()) return;
        setListItems([...listItems, { id: Date.now(), text: newItemText.trim(), completed: false }]);
        setNewItemText('');
    };

    const handleRemoveDraftItem = (id) => {
        setListItems(listItems.filter(item => item.id !== id));
    };

    if (!character) return null;

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <header className="px-6 pb-6 pt-2 shrink-0 border-b border-white/5 relative z-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="relative">
                        <div className="absolute -inset-4 bg-rpg-gold/10 blur-xl rounded-full opacity-50"></div>
                        <h1 className="text-3xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 drop-shadow-md relative z-10 flex items-center gap-3">
                            <Book className="text-rpg-gold" size={28} />
                            Traveler's Diary
                        </h1>
                        <p className="text-rpg-gold/80 text-xs font-bold uppercase tracking-[0.2em] mt-1 relative z-10">
                            Chronicles of {character.name}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5 relative z-10">
                            <button 
                                onClick={() => setDiaryTab('notes')} 
                                className={`px-4 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${diaryTab === 'notes' ? 'bg-rpg-gold text-black shadow-glow-gold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                Journal
                            </button>
                            <button 
                                onClick={() => setDiaryTab('calendar')} 
                                className={`px-4 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1 ${diaryTab === 'calendar' ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <Calendar size={12} className="md:w-3.5 md:h-3.5" /> Events
                            </button>
                        </div>

                        {!isWriting && diaryTab === 'notes' && (
                            <button
                                onClick={() => setIsWriting(true)}
                                className="glass-btn-primary px-3 py-1.5 md:px-4 md:py-2 flex items-center gap-1.5 text-[10px] md:text-sm uppercase tracking-wider font-bold shadow-glow whitespace-nowrap"
                            >
                                <Plus size={14} className="md:w-4 md:h-4" /> Jot Entry
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">

                {/* Decorative background parchment texture wrapper */}
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

                {diaryTab === 'calendar' ? (
                    <div className="max-w-4xl mx-auto relative z-10 w-full animate-in fade-in slide-in-from-right-4 duration-300">
                        <CalendarView />
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto space-y-6 relative z-10 animate-in fade-in slide-in-from-left-4 duration-300">

                        {/* Drafting Area */}
                    {isWriting && (
                        <div className="glass-panel p-6 border-l-4 border-l-rpg-gold relative overflow-hidden animate-in slide-in-from-top-4">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-rpg-gold/10 rounded-bl-full blur-2xl pointer-events-none"></div>

                            {/* Type Selector */}
                            <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
                                <button
                                    onClick={() => setNoteType('text')}
                                    className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${noteType === 'text' ? 'bg-rpg-gold text-rpg-bg shadow-glow-gold' : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Type size={14} /> Journal Entry
                                </button>
                                <button
                                    onClick={() => setNoteType('list')}
                                    className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${noteType === 'list' ? 'bg-rpg-gold text-rpg-bg shadow-glow-gold' : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <ListTodo size={14} /> Quest List
                                </button>
                            </div>

                            <input
                                type="text"
                                placeholder={noteType === 'list' ? "Quest List Title (e.g., Weekend Shopping)..." : "A compelling title..."}
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="w-full bg-transparent border-0 border-b border-white/10 text-xl font-heading font-bold text-white placeholder:text-gray-500 py-2 mb-4 focus:ring-0 focus:border-rpg-gold outline-none"
                            />

                            {noteType === 'text' ? (
                                <textarea
                                    placeholder="What adventures did you have today? Or perhaps a note for tomorrow?"
                                    value={newText}
                                    onChange={(e) => setNewText(e.target.value)}
                                    className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-gray-300 placeholder:text-gray-600 resize-none focus:border-rpg-gold/50 outline-none custom-scrollbar"
                                ></textarea>
                            ) : (
                                <div className="space-y-3">
                                    <form onSubmit={handleAddListItem} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newItemText}
                                            onChange={(e) => setNewItemText(e.target.value)}
                                            placeholder="Add an item to the list..."
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-rpg-gold outline-none"
                                        />
                                        <button type="submit" disabled={!newItemText.trim()} className="bg-white/10 hover:bg-white/20 text-white px-4 rounded-xl disabled:opacity-50 flex items-center justify-center transition-colors">
                                            <Plus size={16} />
                                        </button>
                                    </form>
                                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                        {listItems.map((item, index) => (
                                            <div key={item.id} className="flex items-center justify-between gap-3 bg-black/20 border border-white/5 p-3 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-rpg-gold/50 text-xs font-mono">{index + 1}.</span>
                                                    <span className="text-gray-300 text-sm">{item.text}</span>
                                                </div>
                                                <button onClick={() => handleRemoveDraftItem(item.id)} className="text-gray-500 hover:text-red-400 p-1">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                                <button
                                    onClick={resetDraft}
                                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveNote}
                                    className="px-4 py-2 glass-btn-primary text-xs font-bold uppercase tracking-wider shadow-glow-gold"
                                    disabled={!newTitle.trim() && !newText.trim() && listItems.length === 0}
                                >
                                    {editingNoteId ? 'Update Page' : 'Seal Page'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Notes List */}
                    {notes.length === 0 && !isWriting ? (
                        <div className="text-center py-16 glass-panel border-dashed border-white/10 opacity-70 flex flex-col items-center justify-center">
                            <Book size={48} className="text-gray-600 mb-4" />
                            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">The Pages Lie Blank</div>
                            <div className="text-[10px] text-gray-500 mt-1">Ledgar awaits your first entry. Every journey deserves a record.</div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 items-start">
                            {notes.map(note => {
                                const d = new Date(note.date);
                                const dateStr = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

                                return (
                                    <div key={note.id} className="glass-card p-5 group relative overflow-hidden transition-all hover:bg-white/5 hover:border-rpg-gold/30 flex flex-col h-full">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rpg-gold/50 to-amber-900/50 opacity-50 group-hover:opacity-100 transition-opacity"></div>

                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2">
                                                {note.type === 'list' ? <ListTodo size={16} className="text-rpg-gold" /> : <Type size={16} className="text-blue-400" />}
                                                <h3 className="text-lg font-bold text-amber-50 relative z-10">{note.title}</h3>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={() => handleEditNote(note)}
                                                    className="p-2 md:p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                                                    title="Edit Entry"
                                                >
                                                    <Edit2 size={16} className="md:w-3.5 md:h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleShareNote(note)}
                                                    className="p-2 md:p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
                                                    title="Share Entry"
                                                >
                                                    <Share2 size={16} className="md:w-3.5 md:h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteNote(note.id)}
                                                    className="p-2 md:p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                                    title="Tear page out"
                                                >
                                                    <Trash2 size={16} className="md:w-3.5 md:h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            {note.type === 'list' && (
                                                <div className="space-y-2 relative z-10 mb-4">
                                                    {note.items?.map(item => (
                                                        <div
                                                            key={item.id}
                                                            onClick={() => handleToggleListItem(note.id, item.id)}
                                                            className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${item.completed ? 'opacity-50 bg-black/20' : 'hover:bg-white/5'}`}
                                                        >
                                                            <div className="mt-0.5 text-rpg-gold">
                                                                {item.completed ? <CheckSquare size={16} className="text-green-500" /> : <Square size={16} />}
                                                            </div>
                                                            <span className={`text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                                                                {item.text}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {note.text && (
                                                <div className="text-sm text-gray-400 whitespace-pre-wrap font-sans relative z-10 leading-relaxed italic border-l-2 border-white/10 pl-3">
                                                    {note.text}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={10} /> {dateStr}
                                            </span>
                                            {note.type === 'list' && note.items && (
                                                <span className="bg-black/40 px-2 py-1 rounded">
                                                    {note.items.filter(i => i.completed).length}/{note.items.length} Done
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    </div>
                )}
            </div>
        </div>
    );
};

export default Diary;
