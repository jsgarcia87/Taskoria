import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import ModernPixelAvatar from './ModernPixelAvatar';
import EnemySprite from './EnemySprite';
import { spawnBestiaryEnemy } from '../../data/bestiary';

const AvatarBattle = ({ isActive, onEnemyDefeated, isBoss = false, zone = 'crypt' }) => {
    const { state } = useGame();
    const { character } = state;
    const heroLevel = character?.level || 1;

    const [enemy, setEnemy] = useState(() => spawnBestiaryEnemy(zone, heroLevel));

    const [isPlayerAttacking, setIsPlayerAttacking] = useState(false);
    const [enemiesDefeatedCount, setEnemiesDefeatedCount] = useState(0);
    const [floatingTexts, setFloatingTexts] = useState([]);
    const processingDeath = useRef(null);

    const addFloatingText = (text, color = 'text-white') => {
        const id = Date.now() + Math.random();
        setFloatingTexts(prev => [...prev, { id, text, color }]);
        setTimeout(() => {
            setFloatingTexts(prev => prev.filter(t => t.id !== id));
        }, 1000);
    };

    useEffect(() => {
        if (!isActive) return;

        const playerAttackInterval = setInterval(() => {
            setIsPlayerAttacking(true);

            const isCrit = Math.random() < 0.15;

            setTimeout(() => {
                setIsPlayerAttacking(false);
                setEnemy(prev => {
                    const baseDmg = 25 + Math.floor(Math.random() * 10);
                    const dmg = isCrit ? baseDmg * 2 : baseDmg;
                    const newHp = prev.hp - dmg;

                    if (isCrit) {
                        addFloatingText('CRITICAL!', 'text-amber-300 font-bold scale-150');
                    }
                    addFloatingText(`-${dmg}`, isCrit ? 'text-amber-300' : 'text-red-400');

                    return { ...prev, hp: newHp };
                });
            }, 400);
        }, 2000);

        return () => clearInterval(playerAttackInterval);
    }, [isActive]);

    useEffect(() => {
        if (enemy.hp <= 0 && enemy.maxHp > 0) {
            if (processingDeath.current === enemy.id) return;
            processingDeath.current = enemy.id;

            onEnemyDefeated && onEnemyDefeated();
            setEnemiesDefeatedCount(prev => prev + 1);

            setTimeout(() => {
                if (!isBoss) {
                    setEnemy(spawnBestiaryEnemy(zone, heroLevel));
                }
            }, 1000);
        }
    }, [enemy.hp, onEnemyDefeated, isBoss, zone, heroLevel]);

    const isElite = enemy.tier === 'elite';
    const enemyScale = isElite ? 2.5 : (isBoss ? 3 : 2);
    const hpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100);

    return (
        <div className="flex items-center justify-center gap-6 sm:gap-12 relative w-full max-w-md px-4">
            {/* Hero */}
            <div className={`relative transition-all duration-300 ${isPlayerAttacking ? 'translate-x-6' : ''}`}>
                <div className="relative">
                    <div style={{ filter: 'drop-shadow(0 0 12px rgba(180,80,20,0.3))' }}>
                        <ModernPixelAvatar
                            type={character?.avatarId || character?.class?.toLowerCase() || 'warrior'}
                            scale={2}
                            customColors={character?.avatarColors}
                        />
                    </div>
                    {/* Hero name */}
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">
                            {character?.name || 'Hero'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Enemy */}
            <div className={`relative transition-all duration-300 ${enemy.hp <= 0 ? 'opacity-0 scale-75' : 'opacity-100'}`}>
                <div className="relative">
                    {/* Enemy glow */}
                    <div
                        className="absolute inset-0 rounded-full blur-2xl pointer-events-none -z-10"
                        style={{
                            background: isElite
                                ? 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)'
                                : 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)',
                            transform: 'scale(1.5)',
                        }}
                    />
                    <div style={{ filter: `drop-shadow(0 0 ${isElite ? 16 : 10}px ${isElite ? 'rgba(168,85,247,0.4)' : 'rgba(239,68,68,0.25)'})` }}>
                        <EnemySprite
                            blueprintKey={enemy.blueprintKey}
                            scale={enemyScale}
                            flip={false}
                        />
                    </div>

                    {/* Enemy name tag */}
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${isElite ? 'text-purple-300' : 'text-red-300/80'}`}>
                            {isElite && '★ '}{enemy.name}
                        </span>
                    </div>

                    {/* HP bar */}
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-20">
                        <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${isElite ? 'bg-purple-500' : 'bg-red-500'}`}
                                style={{ width: `${hpPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Combat Text */}
            <div className="absolute inset-0 pointer-events-none z-50">
                {floatingTexts.map(ft => (
                    <div
                        key={ft.id}
                        className={`absolute left-1/2 top-1/3 font-display text-2xl animate-combat-text ${ft.color}`}
                    >
                        {ft.text}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AvatarBattle;
