import React, { useState, useCallback } from 'react';

const ITEM_TYPES = ['gear', 'consumable', 'pet_food', 'material'];
const RARITIES = ['common', 'rare', 'epic'];
const SLOTS = ['mainHand', 'offHand', 'body', 'head', 'ring'];
const STATS = ['str', 'dex', 'con', 'int', 'will', 'cha', 'hp'];

const EMPTY_ITEM = {
  id: '',
  name: '',
  cost: 0,
  description: '',
  type: 'gear',
  slot: 'mainHand',
  rarity: 'common',
  stats: {},
  effect: {},
};

const BlueprintValidator = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);

  const validate = () => {
    if (!input.trim()) { setResult({ valid: false, errors: ['Empty input'] }); return; }

    const errors = [];
    let parsed;
    try {
      parsed = JSON.parse(input);
    } catch (e) {
      setResult({ valid: false, errors: [`JSON parse error: ${e.message}`] });
      return;
    }

    const keys = Object.keys(parsed);
    if (keys.length === 0) { errors.push('No entries found'); }

    keys.forEach(key => {
      const entry = parsed[key];
      if (!entry.paleta) errors.push(`${key}: missing "paleta" object`);
      if (!entry.blueprint) errors.push(`${key}: missing "blueprint" array`);

      if (entry.paleta) {
        const paletaKeys = Object.keys(entry.paleta);
        if (!paletaKeys.includes(' ')) errors.push(`${key}: paleta missing space key (transparent)`);
        if (!paletaKeys.includes('A')) errors.push(`${key}: paleta missing "A" key (outline)`);
        if (paletaKeys.length > 13) errors.push(`${key}: paleta has ${paletaKeys.length} keys (max 12 + space)`);
        paletaKeys.forEach(k => {
          if (k === ' ') {
            if (entry.paleta[k] !== 'transparent') errors.push(`${key}: space key should be "transparent"`);
          } else if (!/^#[0-9a-fA-F]{6}$/.test(entry.paleta[k])) {
            errors.push(`${key}: paleta["${k}"] = "${entry.paleta[k]}" is not a valid hex color`);
          }
        });
      }

      if (entry.blueprint) {
        if (!Array.isArray(entry.blueprint)) {
          errors.push(`${key}: blueprint must be an array`);
        } else if (entry.blueprint.length !== 4096) {
          errors.push(`${key}: blueprint has ${entry.blueprint.length} elements (expected 4096 = 64x64)`);
        } else {
          const validKeys = entry.paleta ? Object.keys(entry.paleta) : [];
          const invalid = entry.blueprint.filter(c => !validKeys.includes(c));
          if (invalid.length > 0) {
            const unique = [...new Set(invalid)];
            errors.push(`${key}: blueprint has ${invalid.length} invalid keys: ${unique.slice(0, 5).join(', ')}${unique.length > 5 ? '...' : ''}`);
          }
        }
      }
    });

    setResult({ valid: errors.length === 0, errors, entries: keys.length });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Blueprint Validator</h3>
      <p className="text-[11px] text-neutral-500">
        Paste a blueprint JSON to validate format: 64x64 grid (4096 elements), valid palette keys, proper structure.
      </p>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={8}
        placeholder='{"sprite_name": {"paleta": {" ": "transparent", "A": "#000000", ...}, "blueprint": [4096 chars]}}'
        className="w-full bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/40 resize-y font-mono"
      />
      <button
        onClick={validate}
        disabled={!input.trim()}
        className="px-4 py-1.5 text-xs font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-40 transition-colors"
      >
        Validate
      </button>

      {result && (
        <div className={`rounded-lg p-3 text-xs ${result.valid ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
          <div className={`font-semibold mb-1 ${result.valid ? 'text-emerald-400' : 'text-red-400'}`}>
            {result.valid ? `Valid blueprint (${result.entries} ${result.entries === 1 ? 'entry' : 'entries'})` : 'Validation failed'}
          </div>
          {result.errors.length > 0 && (
            <ul className="space-y-0.5 text-red-300/80">
              {result.errors.map((e, i) => <li key={i}>&bull; {e}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

const ItemConstructor = () => {
  const [item, setItem] = useState(EMPTY_ITEM);
  const [output, setOutput] = useState('');

  const updateField = (field, value) => setItem(prev => ({ ...prev, [field]: value }));
  const updateStat = (stat, value) => {
    const v = parseInt(value) || 0;
    setItem(prev => {
      const stats = { ...prev.stats };
      if (v === 0) delete stats[stat];
      else stats[stat] = v;
      return { ...prev, stats };
    });
  };

  const generate = () => {
    const obj = {
      id: item.id || 'unnamed_item',
      name: item.name || 'Unnamed Item',
      cost: parseInt(item.cost) || 0,
      description: item.description || '',
      type: item.type,
    };
    if (item.rarity !== 'common') obj.rarity = item.rarity;
    if (item.type === 'gear') {
      obj.slot = item.slot;
      if (Object.keys(item.stats).length > 0) obj.stats = item.stats;
    }
    if (item.type === 'consumable' && Object.keys(item.effect).length > 0) {
      obj.effect = item.effect;
    }
    obj.sprite = { src: 'spriteSheet', x: 0, y: 0, width: 32, height: 32 };
    setOutput(JSON.stringify(obj, null, 2));
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Item Constructor</h3>
      <p className="text-[11px] text-neutral-500">
        Build an item definition ready to paste into <span className="font-mono text-neutral-400">items.js</span>
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">ID</label>
          <input
            value={item.id}
            onChange={e => updateField('id', e.target.value.replace(/[^a-z0-9_]/g, ''))}
            placeholder="sword_fire"
            className="w-full bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/40"
          />
        </div>
        <div>
          <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">Name</label>
          <input
            value={item.name}
            onChange={e => updateField('name', e.target.value)}
            placeholder="Flame Sword"
            className="w-full bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/40"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">Type</label>
          <select
            value={item.type}
            onChange={e => updateField('type', e.target.value)}
            className="w-full bg-black/20 border border-white/[0.06] rounded-lg px-2 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500/40"
          >
            {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {item.type === 'gear' && (
          <div>
            <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">Slot</label>
            <select
              value={item.slot}
              onChange={e => updateField('slot', e.target.value)}
              className="w-full bg-black/20 border border-white/[0.06] rounded-lg px-2 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500/40"
            >
              {SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">Rarity</label>
          <select
            value={item.rarity}
            onChange={e => updateField('rarity', e.target.value)}
            className="w-full bg-black/20 border border-white/[0.06] rounded-lg px-2 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500/40"
          >
            {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">Cost (gold)</label>
          <input
            type="number"
            value={item.cost}
            onChange={e => updateField('cost', e.target.value)}
            className="w-full bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500/40"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">Description</label>
        <input
          value={item.description}
          onChange={e => updateField('description', e.target.value)}
          placeholder="+3 STR | Fire damage"
          className="w-full bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/40"
        />
      </div>

      {item.type === 'gear' && (
        <div>
          <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5 block">Stats</label>
          <div className="grid grid-cols-7 gap-2">
            {STATS.map(s => (
              <div key={s}>
                <label className="text-[9px] text-neutral-600 uppercase text-center block mb-0.5">{s}</label>
                <input
                  type="number"
                  value={item.stats[s] || ''}
                  onChange={e => updateStat(s, e.target.value)}
                  placeholder="0"
                  className="w-full bg-black/20 border border-white/[0.06] rounded-lg px-2 py-1.5 text-xs text-neutral-200 text-center focus:outline-none focus:border-purple-500/40"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          onClick={generate}
          disabled={!item.id || !item.name}
          className="px-4 py-1.5 text-xs font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-40 transition-colors"
        >
          Generate JSON
        </button>
        <button
          onClick={() => { setItem(EMPTY_ITEM); setOutput(''); }}
          className="px-3 py-1.5 text-xs rounded-lg bg-white/[0.03] text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          Clear
        </button>
      </div>

      {output && (
        <div className="relative">
          <pre className="bg-black/30 border border-white/[0.06] rounded-lg p-3 text-xs text-emerald-300/80 font-mono overflow-x-auto whitespace-pre">
            {output}
          </pre>
          <button
            onClick={() => navigator.clipboard?.writeText(output)}
            className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded bg-white/[0.06] text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
};

const LootTableEditor = () => {
  const [rows, setRows] = useState([{ itemId: '', weight: 10 }]);
  const [output, setOutput] = useState('');

  const updateRow = (i, field, value) => {
    setRows(prev => prev.map((r, j) => j === i ? { ...r, [field]: value } : r));
  };
  const addRow = () => setRows(prev => [...prev, { itemId: '', weight: 10 }]);
  const removeRow = (i) => setRows(prev => prev.filter((_, j) => j !== i));

  const totalWeight = rows.reduce((s, r) => s + (parseInt(r.weight) || 0), 0);

  const generate = () => {
    const table = rows
      .filter(r => r.itemId)
      .map(r => ({
        itemId: r.itemId,
        weight: parseInt(r.weight) || 1,
        chance: totalWeight > 0 ? ((parseInt(r.weight) || 1) / totalWeight * 100).toFixed(1) + '%' : '—',
      }));
    setOutput(JSON.stringify(table, null, 2));
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Loot Table Editor</h3>
      <p className="text-[11px] text-neutral-500">Define weighted drop rates. Higher weight = higher chance.</p>

      <div className="space-y-1.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={r.itemId}
              onChange={e => updateRow(i, 'itemId', e.target.value)}
              placeholder="item_id"
              className="flex-1 bg-black/20 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/40 font-mono"
            />
            <input
              type="number"
              value={r.weight}
              onChange={e => updateRow(i, 'weight', e.target.value)}
              className="w-20 bg-black/20 border border-white/[0.06] rounded-lg px-2 py-1.5 text-xs text-neutral-200 text-center focus:outline-none focus:border-purple-500/40"
            />
            <span className="text-[10px] text-neutral-500 w-12 text-right">
              {totalWeight > 0 ? ((parseInt(r.weight) || 0) / totalWeight * 100).toFixed(1) + '%' : '—'}
            </span>
            <button
              onClick={() => removeRow(i)}
              disabled={rows.length <= 1}
              className="text-red-400/40 hover:text-red-400 disabled:opacity-20 transition-colors text-sm"
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={addRow}
          className="px-3 py-1.5 text-xs rounded-lg bg-white/[0.03] text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          + Add Row
        </button>
        <button
          onClick={generate}
          className="px-4 py-1.5 text-xs font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors"
        >
          Generate
        </button>
      </div>

      {output && (
        <div className="relative">
          <pre className="bg-black/30 border border-white/[0.06] rounded-lg p-3 text-xs text-emerald-300/80 font-mono overflow-x-auto whitespace-pre">
            {output}
          </pre>
          <button
            onClick={() => navigator.clipboard?.writeText(output)}
            className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded bg-white/[0.06] text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
};

const ObjectsSection = ({ adminFetch }) => {
  const [tab, setTab] = useState('constructor');

  return (
    <div className="max-w-4xl space-y-5">
      {/* Tab nav */}
      <div className="flex gap-1 text-xs">
        {[
          { id: 'constructor', label: 'Item Constructor' },
          { id: 'blueprint', label: 'Blueprint Validator' },
          { id: 'loot', label: 'Loot Tables' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              tab === t.id
                ? 'bg-purple-500/15 text-purple-400'
                : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.03]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-xl border border-white/[0.04] p-5" style={{ background: 'var(--admin-card)' }}>
        {tab === 'constructor' && <ItemConstructor />}
        {tab === 'blueprint' && <BlueprintValidator />}
        {tab === 'loot' && <LootTableEditor />}
      </div>
    </div>
  );
};

export default ObjectsSection;
