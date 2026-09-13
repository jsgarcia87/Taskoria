import React, { useState, useEffect, useCallback, useRef } from 'react';

const STATUS_COLORS = {
  pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  approved: 'text-green-400 bg-green-500/10 border-green-500/20',
  rejected: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const PAYLOAD_LABELS = { pixels: 'Sprite', house: 'House', map: 'Map' };

function PixelPreview({ pixels, gridSize, size = 128 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pixels) return;
    let buf;
    try { buf = typeof pixels === 'string' ? JSON.parse(pixels) : pixels; } catch { return; }
    if (!Array.isArray(buf) || buf.length === 0) return;
    const frame = Array.isArray(buf[0]) && typeof buf[0] !== 'string' && !buf[0]?.c ? buf[0] : buf;
    const gs = gridSize || Math.round(Math.sqrt(frame.length)) || 64;
    canvas.width = gs;
    canvas.height = gs;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, gs, gs);
    for (let i = 0; i < frame.length; i++) {
      const c = frame[i];
      if (!c || c === 'transparent') continue;
      ctx.fillStyle = c;
      ctx.fillRect(i % gs, Math.floor(i / gs), 1, 1);
    }
  }, [pixels, gridSize]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, imageRendering: 'pixelated', background: '#0a0a14' }}
      className="rounded border border-white/[0.06]"
    />
  );
}

const StudioSection = ({ adminFetch }) => {
  const [requests, setRequests] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('creations');
  const [selectedCreation, setSelectedCreation] = useState(null);
  const [moderating, setModerating] = useState(false);

  const load = useCallback(async () => {
    try {
      const [reqData, designData] = await Promise.all([
        adminFetch('list_studio_requests'),
        adminFetch('list_designs'),
      ]);
      setRequests(reqData.requests || []);
      setDesigns(designData.designs || []);
    } catch { /* silent */ }
  }, [adminFetch]);

  const loadCreations = useCallback(async () => {
    try {
      const data = await adminFetch('list_pending', {}, 'creations');
      setCreations(data.items || []);
    } catch { setCreations([]); }
  }, [adminFetch]);

  useEffect(() => {
    Promise.all([load(), loadCreations()]).finally(() => setLoading(false));
  }, [load, loadCreations]);

  const moderate = async (targetId, decision, reason = null) => {
    try {
      await adminFetch('moderate_studio_request', { target_id: targetId, decision, reason });
      load();
    } catch { /* silent */ }
  };

  const moderateCreation = async (id, decision, reason = null, priceOverride = null) => {
    setModerating(true);
    try {
      const body = { id, decision };
      if (reason) body.reason = reason;
      if (priceOverride !== null) body.price = priceOverride;
      await adminFetch('moderate', body, 'creations');
      setSelectedCreation(null);
      await loadCreations();
    } catch { /* silent */ }
    setModerating(false);
  };

  const deleteDesign = async (id) => {
    if (!window.confirm('Delete this design permanently?')) return;
    try {
      await adminFetch('delete_design', { design_id: id });
      setDesigns(d => d.filter(x => x.id !== id));
    } catch { /* silent */ }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="max-w-5xl space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.02] rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('creations')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${tab === 'creations' ? 'bg-cyan-500/15 text-cyan-400' : 'text-[var(--admin-text-muted)] hover:text-white'}`}
        >
          Creations {creations.length > 0 && <span className="ml-1 text-amber-400">({creations.length})</span>}
        </button>
        <button
          onClick={() => setTab('requests')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${tab === 'requests' ? 'bg-purple-500/15 text-purple-400' : 'text-[var(--admin-text-muted)] hover:text-white'}`}
        >
          Access Requests {pendingCount > 0 && <span className="ml-1 text-amber-400">({pendingCount})</span>}
        </button>
        <button
          onClick={() => setTab('designs')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${tab === 'designs' ? 'bg-purple-500/15 text-purple-400' : 'text-[var(--admin-text-muted)] hover:text-white'}`}
        >
          Design Library ({designs.length})
        </button>
      </div>

      {/* Creations Moderation */}
      {tab === 'creations' && (
        <div className="space-y-3">
          {creations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.08] p-10 text-center" style={{ background: 'var(--admin-card)' }}>
              <p className="text-sm text-neutral-500">No pending creations to review</p>
              <p className="text-xs text-neutral-600 mt-1">Submissions from House Builder, Pixel Studio, and Map Editor appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {creations.map(c => {
                  const payloadType = c.payload_type || 'pixels';
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCreation(c)}
                      className={`w-full text-left rounded-xl border p-3 flex gap-3 items-center transition-colors ${
                        selectedCreation?.id === c.id
                          ? 'border-cyan-500/30 bg-cyan-500/[0.04]'
                          : 'border-white/[0.04] hover:border-white/[0.08]'
                      }`}
                      style={{ background: selectedCreation?.id === c.id ? undefined : 'var(--admin-card)' }}
                    >
                      {payloadType === 'pixels' && c.pixels && (
                        <PixelPreview pixels={c.pixels} gridSize={c.grid_size} size={48} />
                      )}
                      {payloadType !== 'pixels' && (
                        <div className="w-12 h-12 rounded bg-white/[0.04] flex items-center justify-center text-lg shrink-0">
                          {payloadType === 'house' ? '🏠' : '🗺️'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-neutral-200 truncate">{c.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] uppercase tracking-wider text-neutral-500">{c.category}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-neutral-400">
                            {PAYLOAD_LABELS[payloadType] || payloadType}
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-600 mt-0.5">
                          by {c.username} · {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                        </div>
                      </div>
                      <div className="text-xs font-['VT323'] text-amber-400 shrink-0">{c.price}g</div>
                    </button>
                  );
                })}
              </div>

              {/* Detail panel */}
              {selectedCreation ? (
                <div className="rounded-xl border border-white/[0.04] p-5 space-y-4 sticky top-0" style={{ background: 'var(--admin-card)' }}>
                  <div>
                    <h3 className="text-base font-semibold text-white">{selectedCreation.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase tracking-wider text-neutral-500">{selectedCreation.category}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-neutral-400">
                        {PAYLOAD_LABELS[selectedCreation.payload_type || 'pixels']}
                      </span>
                      <span className="text-[10px] text-neutral-600">by {selectedCreation.username}</span>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="flex justify-center py-2">
                    {(selectedCreation.payload_type || 'pixels') === 'pixels' && selectedCreation.pixels ? (
                      <PixelPreview pixels={selectedCreation.pixels} gridSize={selectedCreation.grid_size} size={192} />
                    ) : (selectedCreation.payload_type === 'house') ? (
                      <div className="w-48 h-48 rounded-lg bg-white/[0.02] border border-white/[0.06] flex flex-col items-center justify-center gap-2">
                        <span className="text-4xl">🏠</span>
                        <span className="text-[10px] text-neutral-500">Parametric House</span>
                        {selectedCreation.pixels && (
                          <PixelPreview pixels={selectedCreation.pixels} gridSize={selectedCreation.grid_size || 96} size={120} />
                        )}
                      </div>
                    ) : (
                      <div className="w-48 h-48 rounded-lg bg-white/[0.02] border border-white/[0.06] flex flex-col items-center justify-center gap-2">
                        <span className="text-4xl">🗺️</span>
                        <span className="text-[10px] text-neutral-500">Map Data</span>
                        {selectedCreation.params && (() => {
                          try {
                            const p = typeof selectedCreation.params === 'string' ? JSON.parse(selectedCreation.params) : selectedCreation.params;
                            return <span className="text-[10px] text-neutral-400">{p.mapW}×{p.mapH} tiles</span>;
                          } catch { return null; }
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Params preview for house */}
                  {selectedCreation.payload_type === 'house' && selectedCreation.params && (
                    <div className="text-[10px] bg-black/20 rounded-lg p-3 font-mono text-neutral-400 max-h-32 overflow-auto">
                      {(() => {
                        try {
                          const p = typeof selectedCreation.params === 'string' ? JSON.parse(selectedCreation.params) : selectedCreation.params;
                          return Object.entries(p).map(([k, v]) => (
                            <div key={k}><span className="text-neutral-600">{k}:</span> {typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>
                          ));
                        } catch { return 'Invalid params'; }
                      })()}
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-neutral-500">Price:</span>
                    <span className="font-['VT323'] text-lg text-amber-400">{selectedCreation.price}g</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-white/[0.04]">
                    <button
                      onClick={() => moderateCreation(selectedCreation.id, 'approved')}
                      disabled={moderating}
                      className="flex-1 px-4 py-2 rounded-lg bg-green-500/15 text-green-400 text-xs font-semibold hover:bg-green-500/25 transition-colors border border-green-500/20 disabled:opacity-40"
                    >
                      {moderating ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => {
                        const reason = window.prompt('Rejection reason (optional):');
                        if (reason !== null) moderateCreation(selectedCreation.id, 'rejected', reason);
                      }}
                      disabled={moderating}
                      className="flex-1 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors border border-red-500/20 disabled:opacity-40"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/[0.06] flex items-center justify-center p-12" style={{ background: 'var(--admin-card)' }}>
                  <p className="text-xs text-neutral-600">Select a creation to review</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Access Requests */}
      {tab === 'requests' && (
        <div className="rounded-xl border border-white/[0.04]" style={{ background: 'var(--admin-card)' }}>
          {requests.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-[var(--admin-text-muted)]">No studio access requests</p>
          ) : (
            <div className="divide-y divide-white/[0.02]">
              {requests.map(r => (
                <div key={r.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{r.username}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_COLORS[r.status] || ''}`}>
                        {r.status}
                      </span>
                    </div>
                    {r.studio_reject_reason && (
                      <p className="text-[11px] text-red-400/60 mt-1">Reason: {r.studio_reject_reason}</p>
                    )}
                    <p className="text-[10px] text-[var(--admin-text-muted)] mt-0.5">
                      Requested {r.studio_requested_at ? new Date(r.studio_requested_at).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => moderate(r.id, 'approved')}
                        className="px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 text-[11px] font-semibold hover:bg-green-500/25 transition-colors border border-green-500/20"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const reason = window.prompt('Rejection reason (optional):');
                          moderate(r.id, 'rejected', reason);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[11px] font-semibold hover:bg-red-500/20 transition-colors border border-red-500/20"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {r.status !== 'pending' && (
                    <button
                      onClick={() => moderate(r.id, 'none')}
                      className="text-[11px] text-[var(--admin-text-muted)] hover:text-white transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Design Library */}
      {tab === 'designs' && (
        <div className="rounded-xl border border-white/[0.04]" style={{ background: 'var(--admin-card)' }}>
          {designs.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-[var(--admin-text-muted)]">No saved designs</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">Name</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">Type</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">Created</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {designs.map(d => (
                  <tr key={d.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{d.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)] bg-white/[0.04] px-2 py-0.5 rounded">
                        {d.tool}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">
                      {d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteDesign(d.id)}
                        className="text-[11px] text-red-400/60 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default StudioSection;
