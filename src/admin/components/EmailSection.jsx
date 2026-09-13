import React, { useState, useEffect, useCallback, useRef } from 'react';

const EmailSection = ({ adminFetch }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ slug: '', name: '', subject: '', body_html: '', variables: '' });
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testStatus, setTestStatus] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const data = await adminFetch('list', {}, 'email_templates');
      setTemplates(data.templates || []);
    } catch { setTemplates([]); }
  }, [adminFetch]);

  useEffect(() => {
    fetchTemplates().finally(() => setLoading(false));
  }, [fetchTemplates]);

  const openEditor = async (slug) => {
    try {
      const data = await adminFetch('get', { slug }, 'email_templates');
      const t = data.template;
      setForm({ slug: t.slug, name: t.name, subject: t.subject, body_html: t.body_html, variables: t.variables || '' });
      setEditing(t.slug);
      setShowPreview(false);
      setTestStatus('');
    } catch { /* handled */ }
  };

  const startNew = () => {
    setForm({ slug: '', name: '', subject: '', body_html: '', variables: '' });
    setEditing('__new__');
    setShowPreview(false);
    setTestStatus('');
  };

  const handleSave = async () => {
    if (!form.slug || !form.name || !form.subject || !form.body_html) return;
    setSaving(true);
    try {
      await adminFetch('save', form, 'email_templates');
      await fetchTemplates();
      setEditing(null);
    } catch { /* handled */ }
    setSaving(false);
  };

  const handleDelete = async (slug) => {
    try {
      await adminFetch('delete', { slug }, 'email_templates');
      if (editing === slug) setEditing(null);
      await fetchTemplates();
    } catch { /* handled */ }
  };

  const handleTestSend = async () => {
    if (!testEmail || !form.slug) return;
    setTestStatus('sending');
    try {
      const data = await adminFetch('test_send', { slug: form.slug, to: testEmail }, 'email_templates');
      setTestStatus(data.success ? 'sent' : 'failed');
    } catch {
      setTestStatus('failed');
    }
  };

  const updatePreview = useCallback(() => {
    if (previewRef.current) {
      const doc = previewRef.current.contentDocument;
      doc.open();
      doc.write(form.body_html || '<p style="color:#888;font-family:sans-serif;text-align:center;padding:40px;">No content yet</p>');
      doc.close();
    }
  }, [form.body_html]);

  useEffect(() => {
    if (showPreview) updatePreview();
  }, [showPreview, updatePreview]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-400 py-12 justify-center">
        <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        Loading templates...
      </div>
    );
  }

  if (editing) {
    return (
      <div className="max-w-5xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setEditing(null)}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            &larr; Back to templates
          </button>
          <div className="flex gap-2">
            {form.slug && editing !== '__new__' && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  showPreview ? 'bg-cyan-500/15 text-cyan-400' : 'bg-white/[0.03] text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {showPreview ? 'Hide Preview' : 'Preview'}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !form.slug || !form.name || !form.subject}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-40 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>

        <div className={`grid gap-4 ${showPreview ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {/* Editor */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">Slug</label>
                <input
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value.replace(/[^a-z0-9_]/g, '') }))}
                  disabled={editing !== '__new__'}
                  placeholder="welcome_email"
                  className="w-full bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/40 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Welcome Email"
                  className="w-full bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/40"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">Subject</label>
              <input
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Welcome to Taskoria!"
                className="w-full bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/40"
              />
            </div>

            <div>
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">
                Variables <span className="text-neutral-600">(comma separated)</span>
              </label>
              <input
                value={form.variables}
                onChange={e => setForm(f => ({ ...f, variables: e.target.value }))}
                placeholder="username, password"
                className="w-full bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/40"
              />
              {form.variables && (
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {form.variables.split(',').map(v => v.trim()).filter(Boolean).map(v => (
                    <span key={v} className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">
                      {'{{' + v + '}}'}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">HTML Body</label>
              <textarea
                value={form.body_html}
                onChange={e => setForm(f => ({ ...f, body_html: e.target.value }))}
                rows={16}
                placeholder="<html>..."
                className="w-full bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/40 resize-y font-mono leading-relaxed"
              />
            </div>

            {/* Test send */}
            {editing !== '__new__' && (
              <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
                <span className="text-[10px] text-neutral-500">Send test:</span>
                <input
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  type="email"
                  className="flex-1 bg-black/20 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/40"
                />
                <button
                  onClick={handleTestSend}
                  disabled={!testEmail || testStatus === 'sending'}
                  className="px-3 py-1.5 text-xs rounded-lg bg-cyan-600/80 text-white hover:bg-cyan-500 disabled:opacity-40 transition-colors"
                >
                  {testStatus === 'sending' ? 'Sending...' : 'Send Test'}
                </button>
                {testStatus === 'sent' && <span className="text-[10px] text-emerald-400">Sent!</span>}
                {testStatus === 'failed' && <span className="text-[10px] text-red-400">Failed</span>}
              </div>
            )}
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="rounded-xl border border-white/[0.06] overflow-hidden" style={{ background: '#ffffff' }}>
              <div className="bg-neutral-800 px-3 py-1.5 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500/60" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
                <div className="w-2 h-2 rounded-full bg-green-500/60" />
                <span className="text-[10px] text-neutral-400 ml-2 truncate">{form.subject || 'Preview'}</span>
              </div>
              <iframe
                ref={previewRef}
                title="Email Preview"
                className="w-full border-0"
                style={{ height: '500px' }}
                sandbox="allow-same-origin"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Email Templates</h2>
        <button
          onClick={startNew}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors"
        >
          + New Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.08] p-10 text-center" style={{ background: 'var(--admin-card)' }}>
          <p className="text-sm text-neutral-500">No email templates yet</p>
          <p className="text-xs text-neutral-600 mt-1">Create your first template to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map(t => (
            <div
              key={t.slug}
              className="rounded-xl border border-white/[0.04] p-4 flex items-center justify-between group hover:border-white/[0.08] transition-colors"
              style={{ background: 'var(--admin-card)' }}
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-neutral-200">{t.name}</div>
                <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-2">
                  <span className="font-mono text-neutral-600">{t.slug}</span>
                  <span>&middot;</span>
                  <span>Subject: {t.subject}</span>
                </div>
                {t.variables && (
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {t.variables.split(',').map(v => v.trim()).filter(Boolean).map(v => (
                      <span key={v} className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">
                        {'{{' + v + '}}'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditor(t.slug)}
                  className="text-[11px] px-3 py-1 rounded-lg bg-white/[0.04] text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(t.slug)}
                  className="text-[11px] px-3 py-1 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmailSection;
