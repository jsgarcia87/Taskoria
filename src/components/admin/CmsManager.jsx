import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Image, Save, ArrowLeft, FileText, Bell, GitCommit, Upload } from 'lucide-react';
import PixelIcon from '../common/PixelIcon';
import { useToast } from '../common/Toast';
import Modal from '../common/Modal';

const CATEGORIES = [
    { value: 'blog', label: 'Blog' },
    { value: 'news', label: 'News' },
    { value: 'changelog', label: 'Changelog' },
];

const CATEGORY_ICONS = { blog: FileText, news: Bell, changelog: GitCommit };

const TOOLBAR_ACTIONS = [
    { cmd: 'bold', icon: 'B', title: 'Bold', style: 'font-bold' },
    { cmd: 'italic', icon: 'I', title: 'Italic', style: 'italic' },
    { cmd: 'underline', icon: 'U', title: 'Underline', style: 'underline' },
    { sep: true },
    { cmd: 'formatBlock', val: 'h2', icon: 'H2', title: 'Heading 2' },
    { cmd: 'formatBlock', val: 'h3', icon: 'H3', title: 'Heading 3' },
    { cmd: 'formatBlock', val: 'p', icon: 'P', title: 'Paragraph' },
    { sep: true },
    { cmd: 'insertUnorderedList', icon: '•', title: 'Bullet list' },
    { cmd: 'insertOrderedList', icon: '1.', title: 'Numbered list' },
    { sep: true },
    { cmd: 'createLink', icon: '🔗', title: 'Insert link' },
];

const RichEditor = ({ value, onChange, adminId }) => {
    const editorRef = useRef(null);
    const fileInputRef = useRef(null);
    const initialized = useRef(false);

    useEffect(() => {
        if (editorRef.current && !initialized.current) {
            editorRef.current.innerHTML = value || '';
            initialized.current = true;
        }
    }, []);

    useEffect(() => {
        if (editorRef.current && value === '' && initialized.current) {
            editorRef.current.innerHTML = '';
        }
    }, [value]);

    const handleInput = useCallback(() => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    }, [onChange]);

    const execCmd = (cmd, val) => {
        if (cmd === 'createLink') {
            val = prompt('URL:');
            if (!val) return;
        }
        document.execCommand(cmd, false, val || null);
        editorRef.current?.focus();
        handleInput();
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);
        formData.append('admin_id', adminId);

        try {
            const res = await fetch('api/cms.php?action=upload_image', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success && data.url) {
                document.execCommand('insertImage', false, data.url);
                handleInput();
            }
        } catch (err) {
            console.error('Upload failed', err);
        }
        e.target.value = '';
    };

    return (
        <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20">
            <div className="flex flex-wrap items-center gap-0.5 p-2 bg-white/5 border-b border-white/10">
                {TOOLBAR_ACTIONS.map((a, i) =>
                    a.sep ? <div key={i} className="w-px h-5 bg-white/10 mx-1" /> : (
                        <button key={i} type="button" title={a.title}
                            onMouseDown={(e) => { e.preventDefault(); execCmd(a.cmd, a.val); }}
                            className={`px-2 py-1 text-xs rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors ${a.style || ''}`}>
                            {a.icon}
                        </button>
                    )
                )}
                <div className="w-px h-5 bg-white/10 mx-1" />
                <button type="button" title="Insert image" onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                    className="px-2 py-1 text-xs rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors">
                    <Image size={14} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
            <div ref={editorRef} contentEditable suppressContentEditableWarning
                onInput={handleInput}
                className="min-h-[300px] p-4 text-gray-200 text-sm leading-relaxed focus:outline-none prose prose-invert prose-sm max-w-none
                    [&_h2]:text-lg [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-4 [&_h2]:mb-2
                    [&_h3]:text-base [&_h3]:font-display [&_h3]:font-bold [&_h3]:text-white [&_h3]:mt-3 [&_h3]:mb-1
                    [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-3
                    [&_a]:text-rpg-gold [&_a]:underline
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
            />
        </div>
    );
};

const PostEditor = ({ post, onSave, onCancel, adminId }) => {
    const [form, setForm] = useState({
        id: post?.id || 0,
        title: post?.title || '',
        slug: post?.slug || '',
        excerpt: post?.excerpt || '',
        body: post?.body || '',
        cover_image: post?.cover_image || '',
        status: post?.status || 'draft',
        category: post?.category || 'blog',
    });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const coverInputRef = useRef(null);
    const toast = useToast();

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleCoverUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);
        formData.append('admin_id', adminId);
        try {
            const res = await fetch('api/cms.php?action=upload_image', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) set('cover_image', data.url);
        } catch (err) { toast.error('Upload failed'); }
        setUploading(false);
        e.target.value = '';
    };

    const handleSave = async (status) => {
        if (!form.title.trim()) { toast.error('Title is required'); return; }
        setSaving(true);
        try {
            const res = await fetch('api/cms.php?action=save_post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, status, admin_id: adminId }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(status === 'published' ? 'Published!' : 'Draft saved');
                onSave();
            } else {
                toast.error(data.error || 'Failed to save');
            }
        } catch (err) { toast.error('Network error'); }
        setSaving(false);
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <button onClick={onCancel} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={16} /> Back to list
                </button>
                <div className="flex gap-2">
                    <button onClick={() => handleSave('draft')} disabled={saving}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg border border-white/10 transition-colors disabled:opacity-50">
                        <Save size={14} className="inline mr-1.5 -mt-0.5" /> Save Draft
                    </button>
                    <button onClick={() => handleSave('published')} disabled={saving}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-rpg-gold/20 hover:bg-rpg-gold/30 text-rpg-gold rounded-lg border border-rpg-gold/30 transition-colors disabled:opacity-50">
                        <Eye size={14} className="inline mr-1.5 -mt-0.5" /> Publish
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 space-y-4">
                    <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Post title"
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white font-display font-bold text-lg placeholder:text-gray-600 focus:outline-none focus:border-rpg-gold/40" />
                    <RichEditor value={form.body} onChange={v => set('body', v)} adminId={adminId} />
                </div>

                <div className="space-y-4">
                    <div className="glass-card p-4 space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Settings</h4>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Category</label>
                            <select value={form.category} onChange={e => set('category', e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Slug</label>
                            <input value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="auto-generated"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Excerpt</label>
                            <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={3} placeholder="Short summary..."
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none resize-none" />
                        </div>
                    </div>

                    <div className="glass-card p-4 space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Cover Image</h4>
                        {form.cover_image ? (
                            <div className="relative group">
                                <img src={form.cover_image} alt="Cover" className="w-full rounded-lg border border-white/10" />
                                <button onClick={() => set('cover_image', '')}
                                    className="absolute top-2 right-2 p-1 bg-black/60 rounded-lg text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => coverInputRef.current?.click()} disabled={uploading}
                                className="w-full py-8 border-2 border-dashed border-white/10 rounded-xl text-gray-500 hover:text-gray-300 hover:border-white/20 transition-colors text-sm flex flex-col items-center gap-2">
                                <Upload size={20} />
                                {uploading ? 'Uploading...' : 'Upload cover image'}
                            </button>
                        )}
                        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const ModalEditor = ({ modal, onSave, onCancel, adminId }) => {
    const [form, setForm] = useState({
        id: modal?.id || 0,
        title: modal?.title || '',
        body: modal?.body || '',
        cta_text: modal?.cta_text || '',
        cta_url: modal?.cta_url || '',
        image: modal?.image || '',
        trigger_type: modal?.trigger_type || 'manual',
        is_active: modal?.is_active ?? false,
        active_from: modal?.active_from?.slice(0, 16) || '',
        active_until: modal?.active_until?.slice(0, 16) || '',
    });
    const [saving, setSaving] = useState(false);
    const toast = useToast();
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSave = async () => {
        if (!form.title.trim()) { toast.error('Title is required'); return; }
        setSaving(true);
        try {
            const res = await fetch('api/cms.php?action=save_modal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, admin_id: adminId }),
            });
            const data = await res.json();
            if (data.success) { toast.success('Modal saved'); onSave(); }
            else toast.error(data.error || 'Failed');
        } catch (err) { toast.error('Network error'); }
        setSaving(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <button onClick={onCancel} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={16} /> Back
                </button>
                <button onClick={handleSave} disabled={saving}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-rpg-gold/20 hover:bg-rpg-gold/30 text-rpg-gold rounded-lg border border-rpg-gold/30 transition-colors disabled:opacity-50">
                    <Save size={14} className="inline mr-1.5 -mt-0.5" /> Save Modal
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                    <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Modal title"
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white font-bold placeholder:text-gray-600 focus:outline-none focus:border-rpg-gold/40" />
                    <RichEditor value={form.body} onChange={v => set('body', v)} adminId={adminId} />
                </div>
                <div className="space-y-3">
                    <div className="glass-card p-4 space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Config</h4>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Trigger</label>
                            <select value={form.trigger_type} onChange={e => set('trigger_type', e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                                <option value="manual">Manual (admin activates)</option>
                                <option value="first_visit">First visit only</option>
                                <option value="always">Every visit</option>
                                <option value="date_range">Date range</option>
                            </select>
                        </div>
                        {form.trigger_type === 'date_range' && (
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">From</label>
                                    <input type="datetime-local" value={form.active_from} onChange={e => set('active_from', e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Until</label>
                                    <input type="datetime-local" value={form.active_until} onChange={e => set('active_until', e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none" />
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">CTA Button</label>
                            <div className="grid grid-cols-2 gap-2">
                                <input value={form.cta_text} onChange={e => set('cta_text', e.target.value)} placeholder="Button text"
                                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none" />
                                <input value={form.cta_url} onChange={e => set('cta_url', e.target.value)} placeholder="URL"
                                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none" />
                            </div>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer py-2">
                            <div className={`w-10 h-5 rounded-full transition-colors ${form.is_active ? 'bg-emerald-500' : 'bg-white/10'} relative`}>
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </div>
                            <span className="text-sm text-gray-300 font-bold">Active</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CmsManager = ({ currentUser }) => {
    const toast = useToast();
    const [tab, setTab] = useState('posts');
    const [posts, setPosts] = useState([]);
    const [modals, setModals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null); // null | 'new' | post/modal object
    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchPosts = async () => {
        try {
            const res = await fetch('api/cms.php?action=list_posts', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: currentUser.id }),
            });
            const data = await res.json();
            if (data.success) setPosts(data.posts || []);
        } catch (e) { console.error(e); }
    };

    const fetchModals = async () => {
        try {
            const res = await fetch('api/cms.php?action=list_modals', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: currentUser.id }),
            });
            const data = await res.json();
            if (data.success) setModals(data.modals || []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchPosts(), fetchModals()]).finally(() => setLoading(false));
    }, []);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        const action = tab === 'posts' ? 'delete_post' : 'delete_modal';
        try {
            await fetch(`api/cms.php?action=${action}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: deleteTarget.id, admin_id: currentUser.id }),
            });
            toast.success('Deleted');
            if (tab === 'posts') fetchPosts(); else fetchModals();
        } catch (e) { toast.error('Failed'); }
        setDeleteTarget(null);
    };

    const loadPostForEdit = async (post) => {
        try {
            const res = await fetch('api/cms.php?action=get_post', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: post.id, admin_id: currentUser.id }),
            });
            const data = await res.json();
            if (data.success) setEditing(data.post);
        } catch (e) { toast.error('Failed to load post'); }
    };

    if (editing) {
        if (tab === 'posts') {
            return <PostEditor post={editing === 'new' ? null : editing} adminId={currentUser.id}
                onSave={() => { setEditing(null); fetchPosts(); }}
                onCancel={() => setEditing(null)} />;
        }
        return <ModalEditor modal={editing === 'new' ? null : editing} adminId={currentUser.id}
            onSave={() => { setEditing(null); fetchModals(); }}
            onCancel={() => setEditing(null)} />;
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                    {[{ id: 'posts', label: 'Posts' }, { id: 'modals', label: 'Modals' }].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${tab === t.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>
                <button onClick={() => setEditing('new')}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-rpg-gold/20 hover:bg-rpg-gold/30 text-rpg-gold rounded-lg border border-rpg-gold/30 transition-colors">
                    <Plus size={14} /> New {tab === 'posts' ? 'Post' : 'Modal'}
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : tab === 'posts' ? (
                posts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <FileText size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="font-bold">No posts yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {posts.map(p => {
                            const CatIcon = CATEGORY_ICONS[p.category] || FileText;
                            return (
                                <div key={p.id} className="glass-card p-4 flex items-center justify-between group hover:border-white/20 transition-all">
                                    <div className="flex items-center gap-4 min-w-0">
                                        {p.cover_image && <img src={p.cover_image} alt="" className="w-12 h-12 rounded-lg object-cover border border-white/10 flex-shrink-0" />}
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <CatIcon size={12} className="text-gray-500 flex-shrink-0" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{p.category}</span>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${p.status === 'published' ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-500 bg-white/5'}`}>
                                                    {p.status}
                                                </span>
                                            </div>
                                            <h4 className="text-white font-bold text-sm truncate">{p.title}</h4>
                                            {p.excerpt && <p className="text-gray-500 text-xs truncate mt-0.5">{p.excerpt}</p>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                        <button onClick={() => loadPostForEdit(p)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => setDeleteTarget(p)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                modals.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Bell size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="font-bold">No modals yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {modals.map(m => (
                            <div key={m.id} className="glass-card p-4 flex items-center justify-between group hover:border-white/20 transition-all">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className={`w-2 h-2 rounded-full ${m.is_active ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{m.trigger_type}</span>
                                    </div>
                                    <h4 className="text-white font-bold text-sm">{m.title}</h4>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                    <button onClick={() => setEditing(m)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => setDeleteTarget(m)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {deleteTarget && (
                <Modal onClose={() => setDeleteTarget(null)}>
                    <div className="text-center p-6">
                        <Trash2 size={32} className="mx-auto mb-4 text-red-400" />
                        <h3 className="text-white font-bold text-lg mb-2">Delete "{deleteTarget.title}"?</h3>
                        <p className="text-gray-400 text-sm mb-6">This action cannot be undone.</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg border border-white/10">Cancel</button>
                            <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/30">Delete</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default CmsManager;
