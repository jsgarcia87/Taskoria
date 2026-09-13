import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Skull, Heart, Shield, Swords, Plus, Edit3, Trash2, Save, X, ChevronDown, ChevronUp, Search, Eye, EyeOff, Crown, Flame, Snowflake, Droplets, Bug, Star, Zap, MapPin, ArrowLeft } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useConfirm } from '../../context/ConfirmContext';

const TIER_COLORS = {
    minion: { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400', label: 'Minion' },
    elite:  { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', label: 'Elite' },
};

const DANGER_COLORS = {
    'HIGH DANGER': 'text-red-400 bg-red-500/10 border-red-500/30',
    'CATACLYSMIC': 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    'ABERRANT':    'text-purple-400 bg-purple-500/10 border-purple-500/30',
};

const StatPill = ({ label, value, color = 'text-white' }) => (
    <div className="flex flex-col items-center bg-black/30 rounded-lg px-2.5 py-1.5 border border-white/5 min-w-[52px]">
        <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">{label}</span>
        <span className={`text-sm font-bold font-mono ${color}`}>{value}</span>
    </div>
);

const TagList = ({ items = [], color = 'text-gray-400' }) => {
    if (!items || items.length === 0) return <span className="text-[10px] text-gray-600 italic">none</span>;
    return (
        <div className="flex flex-wrap gap-1">
            {items.map(t => (
                <span key={t} className={`text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/5 ${color}`}>{t}</span>
            ))}
        </div>
    );
};

const FormField = ({ label, children, className = '' }) => (
    <div className={className}>
        <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1.5">{label}</label>
        {children}
    </div>
);

const inputClass = "w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-rpg-gold/50 focus:outline-none transition-colors";
const selectClass = "w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-rpg-gold/50 focus:outline-none transition-colors appearance-none";

// ─────────────────────────────────────────────────
// ENEMY CARD
// ─────────────────────────────────────────────────
const EnemyCard = ({ enemy, zones, onEdit, onDelete }) => {
    const tc = TIER_COLORS[enemy.tier] || TIER_COLORS.minion;
    const zone = zones.find(z => z.id === enemy.zone_id);
    return (
        <div className={`${tc.bg} border ${tc.border} rounded-xl p-4 transition-all hover:shadow-lg group`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-white text-sm">{enemy.name}</h4>
                        <span className={`text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded border ${tc.bg} ${tc.border} ${tc.text}`}>{tc.label}</span>
                        {!enemy.active && <span className="text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400">Disabled</span>}
                    </div>
                    {zone && <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1"><MapPin size={9}/> {zone.name} (Lv.{zone.unlock_level}+)</p>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(enemy)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-rpg-gold"><Edit3 size={12}/></button>
                    <button onClick={() => onDelete(enemy)} className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400"><Trash2 size={12}/></button>
                </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
                <StatPill label="HP" value={enemy.hp} color="text-red-400" />
                <StatPill label="DMG/m" value={enemy.dmg_per_focus_min} color="text-orange-400" />
                <StatPill label="XP" value={enemy.xp} color="text-blue-400" />
                <StatPill label="Gold" value={enemy.gold} color="text-rpg-gold" />
            </div>
            <div className="flex gap-4 mb-2">
                <div><span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Resist </span><TagList items={enemy.resist} color="text-green-400" /></div>
                <div><span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Weak </span><TagList items={enemy.weak} color="text-red-400" /></div>
            </div>
            {enemy.lore && <p className="text-[11px] text-gray-400 italic leading-relaxed line-clamp-2">{enemy.lore}</p>}
        </div>
    );
};

// ─────────────────────────────────────────────────
// BOSS CARD
// ─────────────────────────────────────────────────
const BossCard = ({ boss, zones, onEdit, onDelete }) => {
    const dc = DANGER_COLORS[boss.danger_label] || 'text-red-400 bg-red-500/10 border-red-500/30';
    const zone = zones.find(z => z.id === boss.zone_id);
    const reward = boss.reward || {};
    return (
        <div className="bg-gradient-to-br from-red-500/5 to-orange-500/5 border border-red-500/20 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-red-500/5 group">
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Crown size={14} className="text-rpg-gold" />
                        <h4 className="font-bold text-white text-sm">{boss.name}</h4>
                        <span className={`text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded border ${dc}`}>{boss.danger_label}</span>
                        {boss.is_rare ? <span className="text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400">Rare ({(boss.spawn_chance * 100).toFixed(0)}%)</span> : null}
                    </div>
                    {boss.title && <p className="text-[10px] text-gray-500 italic mt-0.5">"{boss.title}"</p>}
                    {zone && <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={9}/> {zone.name}</p>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(boss)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-rpg-gold"><Edit3 size={12}/></button>
                    <button onClick={() => onDelete(boss)} className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400"><Trash2 size={12}/></button>
                </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
                <StatPill label="HP" value={boss.hp.toLocaleString()} color="text-red-400" />
                {reward.xp && <StatPill label="XP" value={reward.xp} color="text-blue-400" />}
                {reward.gold && <StatPill label="Gold" value={reward.gold} color="text-rpg-gold" />}
            </div>
            {boss.mechanic && <p className="text-[10px] text-amber-400/80 bg-amber-500/5 border border-amber-500/10 rounded-lg px-2.5 py-1.5 mb-2"><Zap size={10} className="inline mr-1" />{boss.mechanic}</p>}
            {boss.lore && <p className="text-[11px] text-gray-400 italic leading-relaxed line-clamp-2">{boss.lore}</p>}
        </div>
    );
};

// ─────────────────────────────────────────────────
// PET CARD
// ─────────────────────────────────────────────────
const PetCard = ({ pet, onEdit, onDelete }) => {
    return (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-emerald-500/5 group">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Heart size={14} className="text-emerald-400" />
                        <h4 className="font-bold text-white text-sm">{pet.name}</h4>
                        {pet.is_hatchable ? <span className="text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">Hatchable</span> : null}
                        {!pet.active && <span className="text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400">Disabled</span>}
                    </div>
                    {pet.description && <p className="text-[11px] text-gray-400 mt-1">{pet.description}</p>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(pet)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-rpg-gold"><Edit3 size={12}/></button>
                    <button onClick={() => onDelete(pet)} className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400"><Trash2 size={12}/></button>
                </div>
            </div>
            {/* Evolution chain */}
            <div className="flex items-center gap-2 mb-3 bg-black/20 rounded-lg p-2.5 border border-white/5">
                <div className="text-center">
                    <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Base</p>
                    <p className="text-xs font-bold text-white">{pet.base_label || pet.id}</p>
                    <p className="text-[9px] text-gray-500 font-mono">{pet.base_blueprint}</p>
                </div>
                {pet.can_evolve && pet.evolved_blueprint ? (
                    <>
                        <div className="flex flex-col items-center px-2">
                            <span className="text-[8px] text-gray-500">Lv.{pet.evolution_level}</span>
                            <span className="text-rpg-gold">→</span>
                        </div>
                        <div className="text-center">
                            <p className="text-[9px] uppercase tracking-widest text-rpg-gold font-bold">Evolved</p>
                            <p className="text-xs font-bold text-rpg-gold">{pet.evolved_label}</p>
                            <p className="text-[9px] text-gray-500 font-mono">{pet.evolved_blueprint}</p>
                        </div>
                    </>
                ) : (
                    <span className="text-[10px] text-gray-600 italic ml-2">No evolution</span>
                )}
            </div>
            {/* Perks */}
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1">Base Perks</p>
                    <p className="text-[10px] text-emerald-400 font-bold">{pet.perk_description || '—'}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                        {pet.perk_xp_mult > 0 && <span className="text-[9px] text-blue-400">+{(pet.perk_xp_mult*100).toFixed(0)}% XP</span>}
                        {pet.perk_gold_mult > 0 && <span className="text-[9px] text-rpg-gold">+{(pet.perk_gold_mult*100).toFixed(0)}% Gold</span>}
                        {pet.perk_dmg_mult > 0 && <span className="text-[9px] text-red-400">+{(pet.perk_dmg_mult*100).toFixed(0)}% DMG</span>}
                    </div>
                </div>
                {pet.can_evolve && pet.evolved_perk_description && (
                    <div className="bg-rpg-gold/5 rounded-lg p-2 border border-rpg-gold/10">
                        <p className="text-[9px] uppercase tracking-widest text-rpg-gold font-bold mb-1">Evolved Perks</p>
                        <p className="text-[10px] text-rpg-gold font-bold">{pet.evolved_perk_description}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {pet.evolved_perk_xp_mult > 0 && <span className="text-[9px] text-blue-400">+{(pet.evolved_perk_xp_mult*100).toFixed(0)}% XP</span>}
                            {pet.evolved_perk_gold_mult > 0 && <span className="text-[9px] text-rpg-gold">+{(pet.evolved_perk_gold_mult*100).toFixed(0)}% Gold</span>}
                            {pet.evolved_perk_dmg_mult > 0 && <span className="text-[9px] text-red-400">+{(pet.evolved_perk_dmg_mult*100).toFixed(0)}% DMG</span>}
                            {pet.evolved_perk_hard_dmg_mult > 0 && <span className="text-[9px] text-orange-400">+{(pet.evolved_perk_hard_dmg_mult*100).toFixed(0)}% Hard</span>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────
// EDITOR MODALS
// ─────────────────────────────────────────────────
const EnemyEditor = ({ enemy, zones, onSave, onClose }) => {
    const [form, setForm] = useState({
        id: '', name: '', zone_id: '', tier: 'minion', hp: 100, dmg_per_focus_min: 1, xp: 10, gold: 5,
        lore: '', resist: [], weak: [], sprite_ref: '', active: true, sort_order: 0,
        ...enemy,
    });
    const isNew = !enemy;
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const setTag = (field, value) => {
        const tags = value.split(',').map(s => s.trim()).filter(Boolean);
        set(field, tags);
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-[#1a1625] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Skull size={18} className="text-red-400" />{isNew ? 'New Enemy' : 'Edit Enemy'}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"><X size={16}/></button>
                </div>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="ID (unique key)">
                            <input className={inputClass} value={form.id} onChange={e => set('id', e.target.value.replace(/[^a-z0-9_]/g, ''))} disabled={!isNew} placeholder="e.g. shadow_spider" />
                        </FormField>
                        <FormField label="Name">
                            <input className={inputClass} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Shadow Spider" />
                        </FormField>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <FormField label="Zone">
                            <select className={selectClass} value={form.zone_id} onChange={e => set('zone_id', e.target.value)}>
                                <option value="">Select...</option>
                                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Tier">
                            <select className={selectClass} value={form.tier} onChange={e => set('tier', e.target.value)}>
                                <option value="minion">Minion</option>
                                <option value="elite">Elite</option>
                            </select>
                        </FormField>
                        <FormField label="Sprite Ref">
                            <input className={inputClass} value={form.sprite_ref} onChange={e => set('sprite_ref', e.target.value)} placeholder="enemy_xxx_64" />
                        </FormField>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        <FormField label="HP"><input type="number" className={inputClass} value={form.hp} onChange={e => set('hp', +e.target.value)} /></FormField>
                        <FormField label="DMG/min"><input type="number" step="0.1" className={inputClass} value={form.dmg_per_focus_min} onChange={e => set('dmg_per_focus_min', +e.target.value)} /></FormField>
                        <FormField label="XP"><input type="number" className={inputClass} value={form.xp} onChange={e => set('xp', +e.target.value)} /></FormField>
                        <FormField label="Gold"><input type="number" className={inputClass} value={form.gold} onChange={e => set('gold', +e.target.value)} /></FormField>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Resist (comma-separated)">
                            <input className={inputClass} value={(form.resist || []).join(', ')} onChange={e => setTag('resist', e.target.value)} placeholder="physical, fire" />
                        </FormField>
                        <FormField label="Weak (comma-separated)">
                            <input className={inputClass} value={(form.weak || []).join(', ')} onChange={e => setTag('weak', e.target.value)} placeholder="radiant, cold" />
                        </FormField>
                    </div>
                    <FormField label="Lore">
                        <textarea className={`${inputClass} h-20 resize-none`} value={form.lore} onChange={e => set('lore', e.target.value)} />
                    </FormField>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} className="accent-rpg-gold" /> Active
                        </label>
                        <FormField label="Sort" className="w-20">
                            <input type="number" className={inputClass} value={form.sort_order} onChange={e => set('sort_order', +e.target.value)} />
                        </FormField>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-white/10">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10">Cancel</button>
                    <button onClick={() => onSave(form)} className="px-4 py-2 rounded-lg text-sm font-bold text-black bg-rpg-gold hover:bg-rpg-gold/90 flex items-center gap-1.5"><Save size={14}/> Save</button>
                </div>
            </div>
        </div>
    );
};

const BossEditor = ({ boss, zones, onSave, onClose }) => {
    const [form, setForm] = useState({
        id: '', name: '', title: '', zone_id: '', hp: 1500, danger_label: 'HIGH DANGER',
        lore: '', mechanic: '', reward: { xp: 500, gold: 200, dropTable: [] },
        is_rare: false, spawn_chance: 1.0, sprite_ref: '', active: true, sort_order: 0,
        ...boss,
    });
    const isNew = !boss;
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const setReward = (k, v) => setForm(f => ({ ...f, reward: { ...f.reward, [k]: v } }));
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-[#1a1625] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Crown size={18} className="text-rpg-gold" />{isNew ? 'New Boss' : 'Edit Boss'}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"><X size={16}/></button>
                </div>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="ID"><input className={inputClass} value={form.id} onChange={e => set('id', e.target.value.replace(/[^a-z0-9_]/g, ''))} disabled={!isNew} /></FormField>
                        <FormField label="Name"><input className={inputClass} value={form.name} onChange={e => set('name', e.target.value)} /></FormField>
                    </div>
                    <FormField label="Title / Epithet"><input className={inputClass} value={form.title} onChange={e => set('title', e.target.value)} placeholder='"The Eternal Flame"' /></FormField>
                    <div className="grid grid-cols-3 gap-3">
                        <FormField label="Zone">
                            <select className={selectClass} value={form.zone_id || ''} onChange={e => set('zone_id', e.target.value || null)}>
                                <option value="">Any / Roaming</option>
                                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Danger Label">
                            <select className={selectClass} value={form.danger_label} onChange={e => set('danger_label', e.target.value)}>
                                <option value="HIGH DANGER">HIGH DANGER</option>
                                <option value="CATACLYSMIC">CATACLYSMIC</option>
                                <option value="ABERRANT">ABERRANT</option>
                            </select>
                        </FormField>
                        <FormField label="HP"><input type="number" className={inputClass} value={form.hp} onChange={e => set('hp', +e.target.value)} /></FormField>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <FormField label="Reward XP"><input type="number" className={inputClass} value={form.reward?.xp || 0} onChange={e => setReward('xp', +e.target.value)} /></FormField>
                        <FormField label="Reward Gold"><input type="number" className={inputClass} value={form.reward?.gold || 0} onChange={e => setReward('gold', +e.target.value)} /></FormField>
                        <FormField label="Drop Table">
                            <input className={inputClass} value={(form.reward?.dropTable || []).join(', ')} onChange={e => setReward('dropTable', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="mystic_egg, rare_gear" />
                        </FormField>
                    </div>
                    <FormField label="Mechanic"><textarea className={`${inputClass} h-16 resize-none`} value={form.mechanic} onChange={e => set('mechanic', e.target.value)} /></FormField>
                    <FormField label="Lore"><textarea className={`${inputClass} h-16 resize-none`} value={form.lore} onChange={e => set('lore', e.target.value)} /></FormField>
                    <div className="flex items-center gap-4 flex-wrap">
                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input type="checkbox" checked={form.is_rare} onChange={e => set('is_rare', e.target.checked)} className="accent-purple-400" /> Rare Boss
                        </label>
                        {form.is_rare && (
                            <FormField label="Spawn %" className="w-24">
                                <input type="number" step="0.01" min="0" max="1" className={inputClass} value={form.spawn_chance} onChange={e => set('spawn_chance', +e.target.value)} />
                            </FormField>
                        )}
                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} className="accent-rpg-gold" /> Active
                        </label>
                    </div>
                    <FormField label="Sprite Ref"><input className={inputClass} value={form.sprite_ref} onChange={e => set('sprite_ref', e.target.value)} /></FormField>
                </div>
                <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-white/10">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10">Cancel</button>
                    <button onClick={() => onSave(form)} className="px-4 py-2 rounded-lg text-sm font-bold text-black bg-rpg-gold hover:bg-rpg-gold/90 flex items-center gap-1.5"><Save size={14}/> Save</button>
                </div>
            </div>
        </div>
    );
};

const PetEditor = ({ pet, onSave, onClose }) => {
    const [form, setForm] = useState({
        id: '', name: '', description: '', base_blueprint: '', base_label: '',
        evolved_blueprint: '', evolved_label: '', evolution_level: 10, can_evolve: true, is_hatchable: true,
        perk_xp_mult: 0, perk_gold_mult: 0, perk_dmg_mult: 0, perk_hard_dmg_mult: 0,
        evolved_perk_xp_mult: 0, evolved_perk_gold_mult: 0, evolved_perk_dmg_mult: 0, evolved_perk_hard_dmg_mult: 0,
        perk_description: '', evolved_perk_description: '', active: true, sort_order: 0,
        ...pet,
    });
    const isNew = !pet;
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-[#1a1625] border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Heart size={18} className="text-emerald-400" />{isNew ? 'New Pet Species' : 'Edit Pet Species'}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"><X size={16}/></button>
                </div>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="ID"><input className={inputClass} value={form.id} onChange={e => set('id', e.target.value.replace(/[^a-z0-9_]/g, ''))} disabled={!isNew} /></FormField>
                        <FormField label="Name"><input className={inputClass} value={form.name} onChange={e => set('name', e.target.value)} /></FormField>
                    </div>
                    <FormField label="Description"><textarea className={`${inputClass} h-16 resize-none`} value={form.description} onChange={e => set('description', e.target.value)} /></FormField>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 border-b border-white/5 pb-1">Evolution Chain</p>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Base Blueprint Key"><input className={inputClass} value={form.base_blueprint} onChange={e => set('base_blueprint', e.target.value)} placeholder="wolf" /></FormField>
                        <FormField label="Base Label"><input className={inputClass} value={form.base_label} onChange={e => set('base_label', e.target.value)} placeholder="Wolf" /></FormField>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input type="checkbox" checked={form.can_evolve} onChange={e => set('can_evolve', e.target.checked)} className="accent-rpg-gold" /> Can Evolve
                        </label>
                        {form.can_evolve && (
                            <FormField label="At Level" className="w-20">
                                <input type="number" className={inputClass} value={form.evolution_level} onChange={e => set('evolution_level', +e.target.value)} />
                            </FormField>
                        )}
                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input type="checkbox" checked={form.is_hatchable} onChange={e => set('is_hatchable', e.target.checked)} className="accent-emerald-400" /> Hatchable
                        </label>
                    </div>
                    {form.can_evolve && (
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Evolved Blueprint Key"><input className={inputClass} value={form.evolved_blueprint || ''} onChange={e => set('evolved_blueprint', e.target.value)} placeholder="wolf_arctic" /></FormField>
                            <FormField label="Evolved Label"><input className={inputClass} value={form.evolved_label || ''} onChange={e => set('evolved_label', e.target.value)} placeholder="Arctic Alpha" /></FormField>
                        </div>
                    )}
                    <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 border-b border-white/5 pb-1">Base Perks</p>
                    <div className="grid grid-cols-4 gap-2">
                        <FormField label="XP %"><input type="number" step="0.01" className={inputClass} value={form.perk_xp_mult} onChange={e => set('perk_xp_mult', +e.target.value)} /></FormField>
                        <FormField label="Gold %"><input type="number" step="0.01" className={inputClass} value={form.perk_gold_mult} onChange={e => set('perk_gold_mult', +e.target.value)} /></FormField>
                        <FormField label="DMG %"><input type="number" step="0.01" className={inputClass} value={form.perk_dmg_mult} onChange={e => set('perk_dmg_mult', +e.target.value)} /></FormField>
                        <FormField label="Hard %"><input type="number" step="0.01" className={inputClass} value={form.perk_hard_dmg_mult} onChange={e => set('perk_hard_dmg_mult', +e.target.value)} /></FormField>
                    </div>
                    <FormField label="Perk Description"><input className={inputClass} value={form.perk_description} onChange={e => set('perk_description', e.target.value)} placeholder="+5% XP" /></FormField>
                    {form.can_evolve && (
                        <>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-rpg-gold border-b border-rpg-gold/20 pb-1">Evolved Perks</p>
                            <div className="grid grid-cols-4 gap-2">
                                <FormField label="XP %"><input type="number" step="0.01" className={inputClass} value={form.evolved_perk_xp_mult} onChange={e => set('evolved_perk_xp_mult', +e.target.value)} /></FormField>
                                <FormField label="Gold %"><input type="number" step="0.01" className={inputClass} value={form.evolved_perk_gold_mult} onChange={e => set('evolved_perk_gold_mult', +e.target.value)} /></FormField>
                                <FormField label="DMG %"><input type="number" step="0.01" className={inputClass} value={form.evolved_perk_dmg_mult} onChange={e => set('evolved_perk_dmg_mult', +e.target.value)} /></FormField>
                                <FormField label="Hard %"><input type="number" step="0.01" className={inputClass} value={form.evolved_perk_hard_dmg_mult} onChange={e => set('evolved_perk_hard_dmg_mult', +e.target.value)} /></FormField>
                            </div>
                            <FormField label="Evolved Perk Description"><input className={inputClass} value={form.evolved_perk_description || ''} onChange={e => set('evolved_perk_description', e.target.value)} /></FormField>
                        </>
                    )}
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                        <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} className="accent-rpg-gold" /> Active
                    </label>
                </div>
                <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-white/10">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10">Cancel</button>
                    <button onClick={() => onSave(form)} className="px-4 py-2 rounded-lg text-sm font-bold text-black bg-rpg-gold hover:bg-rpg-gold/90 flex items-center gap-1.5"><Save size={14}/> Save</button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────
// MAIN PANEL
// ─────────────────────────────────────────────────
const GameMasterPanel = ({ currentUser }) => {
    const toast = useToast();
    const confirm = useConfirm();
    const [tab, setTab] = useState('enemies');
    const [zones, setZones] = useState([]);
    const [enemies, setEnemies] = useState([]);
    const [bosses, setBosses] = useState([]);
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterZone, setFilterZone] = useState('ALL');

    // Editor states
    const [editEnemy, setEditEnemy] = useState(undefined); // undefined=closed, null=new, object=edit
    const [editBoss, setEditBoss] = useState(undefined);
    const [editPet, setEditPet] = useState(undefined);

    const api = useCallback(async (action, body = {}) => {
        const res = await fetch(`api/game_master.php?action=${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: currentUser.id, ...body }),
        });
        return res.json();
    }, [currentUser?.id]);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [zRes, eRes, bRes, pRes] = await Promise.all([
                api('list_zones'), api('list_enemies'), api('list_bosses'), api('list_pets'),
            ]);
            if (zRes.zones) setZones(zRes.zones);
            if (eRes.enemies) setEnemies(eRes.enemies);
            if (bRes.bosses) setBosses(bRes.bosses);
            if (pRes.pets) setPets(pRes.pets);
        } catch (e) { toast.error('Failed to load game data'); }
        finally { setLoading(false); }
    }, [api, toast]);

    useEffect(() => { loadAll(); }, [loadAll]);

    // Filtered lists
    const filteredEnemies = useMemo(() => {
        let list = enemies;
        if (filterZone !== 'ALL') list = list.filter(e => e.zone_id === filterZone);
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(e => e.name.toLowerCase().includes(q) || e.id.includes(q) || (e.lore || '').toLowerCase().includes(q));
        }
        return list;
    }, [enemies, filterZone, search]);

    const filteredBosses = useMemo(() => {
        if (!search) return bosses;
        const q = search.toLowerCase();
        return bosses.filter(b => b.name.toLowerCase().includes(q) || (b.title || '').toLowerCase().includes(q) || (b.lore || '').toLowerCase().includes(q));
    }, [bosses, search]);

    const filteredPets = useMemo(() => {
        if (!search) return pets;
        const q = search.toLowerCase();
        return pets.filter(p => p.name.toLowerCase().includes(q) || p.id.includes(q) || (p.description || '').toLowerCase().includes(q));
    }, [pets, search]);

    // CRUD handlers
    const saveEnemy = async (data) => {
        const res = await api('save_enemy', data);
        if (res.success) { toast.success(`Enemy "${data.name}" saved`); setEditEnemy(undefined); loadAll(); }
        else toast.error(res.error || 'Failed to save');
    };
    const deleteEnemy = async (e) => {
        if (!await confirm({ title: 'Delete Enemy?', message: `"${e.name}" will be removed from the bestiary.`, variant: 'danger', confirmText: 'Delete' })) return;
        const res = await api('delete_enemy', { id: e.id });
        if (res.success) { toast.success('Enemy deleted'); loadAll(); }
    };
    const saveBoss = async (data) => {
        const res = await api('save_boss', data);
        if (res.success) { toast.success(`Boss "${data.name}" saved`); setEditBoss(undefined); loadAll(); }
        else toast.error(res.error || 'Failed to save');
    };
    const deleteBoss = async (b) => {
        if (!await confirm({ title: 'Delete Boss?', message: `"${b.name}" will be removed.`, variant: 'danger', confirmText: 'Delete' })) return;
        const res = await api('delete_boss', { id: b.id });
        if (res.success) { toast.success('Boss deleted'); loadAll(); }
    };
    const savePet = async (data) => {
        const res = await api('save_pet', data);
        if (res.success) { toast.success(`Pet "${data.name}" saved`); setEditPet(undefined); loadAll(); }
        else toast.error(res.error || 'Failed to save');
    };
    const deletePet = async (p) => {
        if (!await confirm({ title: 'Delete Pet?', message: `"${p.name}" will be removed.`, variant: 'danger', confirmText: 'Delete' })) return;
        const res = await api('delete_pet', { id: p.id });
        if (res.success) { toast.success('Pet deleted'); loadAll(); }
    };

    const tabs = [
        { id: 'enemies', label: 'Enemies', icon: Skull, count: enemies.length, color: 'text-red-400' },
        { id: 'bosses',  label: 'Bosses',  icon: Crown, count: bosses.length, color: 'text-rpg-gold' },
        { id: 'pets',    label: 'Pets',     icon: Heart, count: pets.length, color: 'text-emerald-400' },
        { id: 'zones',   label: 'Zones',    icon: MapPin, count: zones.length, color: 'text-purple-400' },
    ];

    if (loading) {
        return <div className="flex items-center justify-center py-20 text-rpg-gold"><Skull className="animate-spin" size={24}/></div>;
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Swords size={20} className="text-rpg-gold" /> Game Master</h3>
                    <p className="text-[11px] text-gray-500">{enemies.length} enemies, {bosses.length} bosses, {pets.length} pet species, {zones.length} zones</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            className="bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 w-48 focus:border-rpg-gold/50 focus:outline-none"
                            value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {tabs.map(t => {
                    const Icon = t.icon;
                    const active = tab === t.id;
                    return (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                                active ? 'bg-rpg-gold/15 text-rpg-gold border border-rpg-gold/40' : 'text-gray-500 border border-transparent hover:text-white hover:bg-white/5'
                            }`}>
                            <Icon size={13} /> {t.label}
                            <span className={`ml-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${active ? 'bg-rpg-gold/20 text-rpg-gold' : 'bg-white/5 text-gray-500'}`}>{t.count}</span>
                        </button>
                    );
                })}
            </div>

            {/* ── ENEMIES TAB ── */}
            {tab === 'enemies' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                            {['ALL', ...zones.map(z => z.id)].map(zid => {
                                const z = zones.find(x => x.id === zid);
                                const count = zid === 'ALL' ? enemies.length : enemies.filter(e => e.zone_id === zid).length;
                                return (
                                    <button key={zid} onClick={() => setFilterZone(zid)}
                                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                                            filterZone === zid ? 'bg-rpg-gold/15 text-rpg-gold border border-rpg-gold/30' : 'text-gray-500 bg-white/5 border border-white/5 hover:text-white'
                                        }`}>
                                        {zid === 'ALL' ? 'All' : z?.name || zid} <span className="opacity-60">{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <button onClick={() => setEditEnemy(null)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20">
                            <Plus size={13}/> New Enemy
                        </button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {filteredEnemies.map(e => <EnemyCard key={e.id} enemy={e} zones={zones} onEdit={setEditEnemy} onDelete={deleteEnemy} />)}
                    </div>
                    {filteredEnemies.length === 0 && <p className="text-center text-gray-500 italic py-8">No enemies found</p>}
                </div>
            )}

            {/* ── BOSSES TAB ── */}
            {tab === 'bosses' && (
                <div className="space-y-3">
                    <div className="flex justify-end">
                        <button onClick={() => setEditBoss(null)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-rpg-gold/10 border border-rpg-gold/30 text-rpg-gold hover:bg-rpg-gold/20">
                            <Plus size={13}/> New Boss
                        </button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {filteredBosses.map(b => <BossCard key={b.id} boss={b} zones={zones} onEdit={setEditBoss} onDelete={deleteBoss} />)}
                    </div>
                    {filteredBosses.length === 0 && <p className="text-center text-gray-500 italic py-8">No bosses found</p>}
                </div>
            )}

            {/* ── PETS TAB ── */}
            {tab === 'pets' && (
                <div className="space-y-3">
                    <div className="flex justify-end">
                        <button onClick={() => setEditPet(null)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20">
                            <Plus size={13}/> New Pet Species
                        </button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {filteredPets.map(p => <PetCard key={p.id} pet={p} onEdit={setEditPet} onDelete={deletePet} />)}
                    </div>
                    {filteredPets.length === 0 && <p className="text-center text-gray-500 italic py-8">No pets found</p>}
                </div>
            )}

            {/* ── ZONES TAB ── */}
            {tab === 'zones' && (
                <div className="space-y-3">
                    <div className="flex justify-end">
                        <button onClick={async () => {
                            const id = prompt('Zone ID (snake_case):');
                            if (!id) return;
                            const name = prompt('Zone name:');
                            if (!name) return;
                            const level = prompt('Unlock level:', '1');
                            const res = await api('save_zone', { id, name, unlock_level: +(level || 1), palette: [], sort_order: zones.length });
                            if (res.success) { toast.success('Zone created'); loadAll(); }
                        }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20">
                            <Plus size={13}/> New Zone
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {zones.map(z => {
                            const enemyCount = enemies.filter(e => e.zone_id === z.id).length;
                            const bossCount = bosses.filter(b => b.zone_id === z.id).length;
                            return (
                                <div key={z.id} className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 group">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h4 className="font-bold text-white text-sm">{z.name}</h4>
                                            <p className="text-[10px] text-gray-500">ID: {z.id}</p>
                                        </div>
                                        <button onClick={async () => {
                                            if (!await confirm({ title: 'Delete Zone?', message: `"${z.name}" will be removed. Enemies in this zone will need reassignment.`, variant: 'danger', confirmText: 'Delete' })) return;
                                            const res = await api('delete_zone', { id: z.id });
                                            if (res.success) { toast.success('Zone deleted'); loadAll(); }
                                        }} className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 size={12}/>
                                        </button>
                                    </div>
                                    <div className="flex gap-2 mb-2">
                                        <StatPill label="Unlock" value={`Lv.${z.unlock_level}`} color="text-purple-400" />
                                        <StatPill label="Enemies" value={enemyCount} color="text-red-400" />
                                        <StatPill label="Bosses" value={bossCount} color="text-rpg-gold" />
                                    </div>
                                    {z.palette && z.palette.length > 0 && (
                                        <div className="flex gap-1">
                                            {z.palette.map((c, i) => (
                                                <div key={i} className="w-5 h-5 rounded border border-white/10" style={{ backgroundColor: c }} title={c} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Editors */}
            {editEnemy !== undefined && <EnemyEditor enemy={editEnemy} zones={zones} onSave={saveEnemy} onClose={() => setEditEnemy(undefined)} />}
            {editBoss !== undefined && <BossEditor boss={editBoss} zones={zones} onSave={saveBoss} onClose={() => setEditBoss(undefined)} />}
            {editPet !== undefined && <PetEditor pet={editPet} onSave={savePet} onClose={() => setEditPet(undefined)} />}
        </div>
    );
};

export default GameMasterPanel;
