import React, { useState, useEffect, useCallback } from 'react';

const STATUS_BADGE = {
  draft: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  published: 'text-green-400 bg-green-500/10 border-green-500/20',
};

const CATEGORY_LABEL = {
  blog: 'Blog',
  news: 'News',
  changelog: 'Changelog',
};

const PostEditor = ({ post, onSave, onCancel, saving }) => {
  const [form, setForm] = useState({
    title: post?.title || '',
    slug: post?.slug || '',
    excerpt: post?.excerpt || '',
    body: post?.body || '',
    status: post?.status || 'draft',
    category: post?.category || 'blog',
    cover_image: post?.cover_image || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)] mb-1">Title</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/40" placeholder="Post title" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)] mb-1">Slug</label>
          <input value={form.slug} onChange={e => set('slug', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/40" placeholder="auto-generated" />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)] mb-1">Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/5 text-sm text-white focus:outline-none focus:border-purple-500/40">
              <option value="blog">Blog</option>
              <option value="news">News</option>
              <option value="changelog">Changelog</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)] mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/5 text-sm text-white focus:outline-none focus:border-purple-500/40">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
        <div className="col-span-2">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)] mb-1">Excerpt</label>
          <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/40 resize-none" placeholder="Short summary..." />
        </div>
        <div className="col-span-2">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)] mb-1">Body (HTML)</label>
          <textarea value={form.body} onChange={e => set('body', e.target.value)} rows={10} className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/5 text-sm text-white font-mono text-[12px] placeholder:text-white/20 focus:outline-none focus:border-purple-500/40 resize-y" placeholder="<p>Write your post...</p>" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-xs text-[var(--admin-text-muted)] hover:text-white transition-colors">Cancel</button>
        <button onClick={() => onSave({ ...form, id: post?.id })} disabled={saving || !form.title} className="px-4 py-2 rounded-lg bg-purple-500 text-white text-xs font-semibold hover:brightness-110 disabled:opacity-40 transition-all">
          {saving ? 'Saving...' : 'Save Post'}
        </button>
      </div>
    </div>
  );
};

const BlogSection = ({ adminFetch }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = list, 'new' = new, {post} = editing
  const [saving, setSaving] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const data = await adminFetch('list_posts', {}, 'cms');
      setPosts(data.posts || []);
    } catch { /* silent */ }
    setLoading(false);
  }, [adminFetch]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const savePost = async (form) => {
    setSaving(true);
    try {
      await adminFetch('save_post', form, 'cms');
      setEditing(null);
      loadPosts();
    } catch { /* silent */ }
    setSaving(false);
  };

  const deletePost = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await adminFetch('delete_post', { id }, 'cms');
      loadPosts();
    } catch { /* silent */ }
  };

  const editPost = async (id) => {
    try {
      const data = await adminFetch('get_post', { id }, 'cms');
      setEditing(data.post);
    } catch { /* silent */ }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (editing) {
    return (
      <div className="max-w-3xl">
        <h3 className="text-sm font-semibold text-white mb-4">
          {editing === 'new' ? 'New Post' : `Editing: ${editing.title}`}
        </h3>
        <div className="rounded-xl border border-white/[0.04] p-5" style={{ background: 'var(--admin-card)' }}>
          <PostEditor
            post={editing === 'new' ? null : editing}
            onSave={savePost}
            onCancel={() => setEditing(null)}
            saving={saving}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[var(--admin-text-muted)]">{posts.length} posts</span>
        <button
          onClick={() => setEditing('new')}
          className="px-3 py-2 rounded-lg bg-purple-500/15 text-purple-400 text-xs font-semibold hover:bg-purple-500/25 transition-colors border border-purple-500/20"
        >
          + New Post
        </button>
      </div>

      <div className="rounded-xl border border-white/[0.04] overflow-hidden" style={{ background: 'var(--admin-card)' }}>
        {posts.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-[var(--admin-text-muted)]">No posts yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">Title</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">Category</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">Date</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(p => (
                <tr key={p.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{p.title}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">
                      {CATEGORY_LABEL[p.category] || p.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_BADGE[p.status] || ''}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">
                    {(p.published_at || p.created_at) ? new Date(p.published_at || p.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => editPost(p.id)} className="text-[11px] text-white/40 hover:text-white transition-colors">Edit</button>
                    <button onClick={() => deletePost(p.id, p.title)} className="text-[11px] text-red-400/60 hover:text-red-400 transition-colors">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default BlogSection;
