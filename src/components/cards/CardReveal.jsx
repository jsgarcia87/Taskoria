import React from 'react';
import { useGame } from '../../context/GameContext';
import CardViewer from './CardViewer';
import { resolveCard, unseenCard } from '../../utils/bossCards';

// Shows the boss card the hero just earned. It stays pending (saved with the hero) until it has been seen.
const CardReveal = () => {
    const { state, actions } = useGame();
    const card = unseenCard(state.character);
    if (!card) return null;
    return <CardViewer key={card.id} card={resolveCard(card)} reveal onClose={() => actions.markCardSeen(card.id)} />;
};

export default CardReveal;
