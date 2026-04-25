import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';

const FloatingTextRenderer = ({ txt, remove }) => {
    const [style, setStyle] = useState({
        top: txt.y,
        left: txt.x,
        opacity: 0,
        transform: 'translateY(0) scale(0.8)'
    });

    useEffect(() => {
        // Trigger mount animation
        requestAnimationFrame(() => {
            setStyle({
                top: txt.y - 60, // Float upwards
                left: txt.x,
                opacity: 1,
                transform: 'translateY(0) scale(1.2)'
            });
        });

        const fadeOut = setTimeout(() => {
            setStyle(s => ({ ...s, opacity: 0, top: s.top - 20 }));
        }, 800);

        const unmount = setTimeout(() => {
            remove(txt.id);
        }, 1200);

        return () => { clearTimeout(fadeOut); clearTimeout(unmount); };
    }, [txt, remove]);

    return (
        <div
            className="fixed pointer-events-none z-[100] font-bold font-display text-shadow-glow flex items-center gap-1 transition-all duration-700 ease-out drop-shadow-lg"
            style={{
                ...style,
                color: txt.color,
                textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 10px ' + txt.color // Very thick shadow
            }}
        >
            {txt.text}
        </div>
    );
};

const FloatingTextLayer = () => {
    const { state, actions } = useGame();
    const { floatingTexts } = state;

    if (!floatingTexts || floatingTexts.length === 0) return null;

    return (
        <>
            {floatingTexts.map(txt => (
                <FloatingTextRenderer key={txt.id} txt={txt} remove={actions.removeFloatingText} />
            ))}
        </>
    );
};

export default FloatingTextLayer;
