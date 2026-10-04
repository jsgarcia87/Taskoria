import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../../context/GameContext';
import BossCard from './BossCard';
import CardViewer from './CardViewer';
import { weeklyAlbumSlots, resolveCard } from '../../utils/bossCards';

const GAP = 12;

// Hook: width of one grid column, measured so the cards scale with the layout.
const useColumnWidth = (ref) => {
    const [cell, setCell] = useState(150);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const measure = () => {
            const w = el.clientWidth;
            const cols = w >= 640 ? 4 : w >= 440 ? 3 : 2;
            setCell(Math.floor((w - GAP * (cols - 1)) / cols));
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, [ref]);
    return cell;
};

const CardCell = ({ card, locked, width, isNew, onOpen }) => (
    <button
        onClick={onOpen}
        className="relative text-left rounded-[10px] transition-transform duration-200 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rpg-gold"
        aria-label={locked ? `${card.name}, not yet claimed` : `Open ${card.name} card`}
    >
        <BossCard card={card} width={width} locked={locked} className={locked ? 'opacity-90' : ''} />
        {isNew && (
            <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-rpg-gold text-rpg-bg text-[10px] font-bold uppercase tracking-wider shadow-lg">New</span>
        )}
    </button>
);

const CardAlbum = ({ character }) => {
    const { actions } = useGame();
    const gridRef = useRef(null);
    const cell = useColumnWidth(gridRef);
    const [open, setOpen] = useState(null);

    const owned = character.bossCards || [];
    const slots = weeklyAlbumSlots().map(base => ({ base, stored: owned.find(c => c.id === base.id) }));
    const extras = owned.filter(c => c.kind !== 'weekly').map(resolveCard);
    const collectedWeekly = slots.filter(s => s.stored).length;

    const openCard = (card, locked) => {
        if (!locked && card.seen === false) actions.markCardSeen(card.id);
        setOpen({ card, locked });
    };

    return (
        <div className="px-5 py-5 animate-tab-in">
            <div className="flex items-baseline justify-between gap-3 mb-1">
                <h3 className="font-herald text-2xl text-white leading-none">Boss cards</h3>
                <span className="text-sm text-gray-300 tabular-nums">{collectedWeekly} / {slots.length}</span>
            </div>
            <p className="text-sm text-gray-400 mb-5 max-w-[52ch]">
                A card is earned the moment a boss falls to the quests and focus sessions you really completed. Tap one to hold it.
            </p>

            <div ref={gridRef} className="grid" style={{ gridTemplateColumns: `repeat(auto-fill, ${cell}px)`, gap: GAP }}>
                {slots.map(({ base, stored }) => {
                    const card = stored ? resolveCard(stored) : base;
                    return (
                        <CardCell
                            key={base.id}
                            card={card}
                            locked={!stored}
                            width={cell}
                            isNew={stored && stored.seen === false}
                            onOpen={() => openCard(card, !stored)}
                        />
                    );
                })}
            </div>

            {extras.length > 0 && (
                <>
                    <h4 className="mt-8 mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Epic and world bosses</h4>
                    <div className="grid" style={{ gridTemplateColumns: `repeat(auto-fill, ${cell}px)`, gap: GAP }}>
                        {extras.map(card => (
                            <CardCell key={card.id} card={card} locked={false} width={cell} isNew={card.seen === false} onOpen={() => openCard(card, false)} />
                        ))}
                    </div>
                </>
            )}

            {open && <CardViewer card={open.card} locked={open.locked} onClose={() => setOpen(null)} />}
        </div>
    );
};

export default CardAlbum;
