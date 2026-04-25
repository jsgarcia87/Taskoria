import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import PixelAvatar from './PixelAvatar';
import { Sword, Skull } from 'lucide-react';

// Helper to get random class type
const getRandomClass = () => {
    const classes = [
        'warrior', 'mage', 'rogue', 'paladin', 'cleric', 
        'ranger', 'barbarian', 'bard', 'druid', 'monk',
        'necromancer', 'antipaladin', 'sorcerer', 'scout'
    ];
    return classes[Math.floor(Math.random() * classes.length)];
};

// Helper to spawn a new enemy
const spawnEnemy = (isBoss = false) => {
    const type = isBoss ? 'dragon' : getRandomClass();
    return {
        id: Date.now(),
        type: type,
        hp: isBoss ? 500 : 100,
        maxHp: isBoss ? 500 : 100,
        name: isBoss ? 'LEGENDARY BOSS' : 'Shadow ' + type.toUpperCase()
    };
};

const AvatarBattle = ({ isActive, onEnemyDefeated, isBoss = false }) => {
    const { state } = useGame();
    const { character } = state;

    // Enemy State
    const [enemy, setEnemy] = useState(spawnEnemy(isBoss));

    const [isPlayerAttacking, setIsPlayerAttacking] = useState(false);
    const [isEnemyAttacking, setIsEnemyAttacking] = useState(false);
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

    // Battle Loop
    useEffect(() => {
        if (!isActive) return;

        // Player attacks every 1.5-2.5 seconds (Faster for more action)
        const playerAttackInterval = setInterval(() => {
            setIsPlayerAttacking(true);
            
            const isCrit = Math.random() < 0.15; // 15% Crit chance
            
            setTimeout(() => {
                setIsPlayerAttacking(false);
                // Deal damage
                setEnemy(prev => {
                    const baseDmg = 25 + Math.floor(Math.random() * 10);
                    const dmg = isCrit ? baseDmg * 2 : baseDmg;
                    const newHp = prev.hp - dmg;

                    if (isCrit) {
                        addFloatingText('CRITICAL!', 'text-rpg-gold font-bold scale-150');
                    }
                    addFloatingText(`-${dmg}`, isCrit ? 'text-rpg-gold' : 'text-rpg-red');

                    return { ...prev, hp: newHp };
                });
            }, 400); // Animation duration
        }, 2000);

        return () => clearInterval(playerAttackInterval);
    }, [isActive]);

    // Handle isBoss prop change
    useEffect(() => {
        if (isBoss) {
            setEnemy(spawnEnemy(true));
        }
    }, [isBoss]);

    // Check Enemy Death
    useEffect(() => {
        if (enemy.hp <= 0 && enemy.maxHp > 0) { // maxHp > 0 checks if it's a real enemy
            // Ensure we only trigger once per death
            if (processingDeath.current === enemy.id) return;
            processingDeath.current = enemy.id;

            // Enemy Defeated
            onEnemyDefeated && onEnemyDefeated();
            setEnemiesDefeatedCount(prev => prev + 1);

            // Respawn new enemy after a short delay
            setTimeout(() => {
                if (!isBoss) {
                    setEnemy(spawnEnemy(false));
                }
            }, 1000);
        }
    }, [enemy.hp, onEnemyDefeated, isBoss]);

    return (
        <div className="flex items-center justify-center gap-16 relative w-full max-w-2xl bg-transparent">
            {/* Player */}
            <div className={`relative transition-all duration-300 ${isPlayerAttacking ? 'translate-x-20' : ''}`}>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 text-[10px] text-white whitespace-nowrap border border-white/20 font-pixel tracking-wider">
                    {character?.name || 'Hero'}
                </div>
                {/* HP Bar */}
                <div className="w-20 h-2 bg-black border border-white/30 mt-2 absolute -bottom-5 left-1/2 -translate-x-1/2 overflow-hidden shadow-sm">
                    <div className="h-full bg-rpg-green w-full border-r border-white/30" />
                </div>

                <div className="filter drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
                    <PixelAvatar
                        type={character?.avatarId || character?.class?.toLowerCase() || 'warrior'}
                        scale={2}
                        customColors={character?.avatarColors}
                    />
                </div>
            </div>

            {/* VS or Sword Icon during clash */}
            <div className={`text-white opacity-20 ${isPlayerAttacking ? 'text-rpg-red scale-150 opacity-100 rotate-45' : ''} transition-all duration-300`}>
                <Sword size={48} />
            </div>

            {/* Enemy */}
            <div className={`relative transition-all duration-300 ${isEnemyAttacking ? '-translate-x-20' : ''} ${enemy.hp <= 0 ? 'opacity-0 scale-50 filter grayscale' : 'opacity-100'}`}>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-rpg-red/80 px-3 py-1 text-[10px] text-white whitespace-nowrap border border-red-500 font-pixel tracking-wider shadow-sm">
                    {enemy.name}
                </div>
                {/* Enemy HP */}
                <div className="w-20 h-2 bg-black border border-white/30 mt-2 absolute -bottom-5 left-1/2 -translate-x-1/2 overflow-hidden shadow-sm">
                    <div
                        className="h-full bg-rpg-red transition-all duration-300 border-r border-white/30"
                        style={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }}
                    />
                </div>

                <div 
                    className="transform scale-x-[-1] transition-all duration-300"
                    style={{ 
                        filter: `drop-shadow(-4px 4px 0 rgba(0,0,0,0.5)) ${isBoss ? 'hue-rotate(320deg) brightness(1.2)' : 'brightness(0.6) contrast(1.2) sepia(0.3) saturate(0.5) hue-rotate(200deg)'}` 
                    }}
                > {/* Flip enemy and apply shadow/entity look */}
                    <PixelAvatar
                        type={enemy.type}
                        scale={isBoss ? 3 : 2}
                    />
                </div>
            </div>

            {/* Floating Combat Text */}
            <div className="absolute inset-0 pointer-events-none z-50">
                {floatingTexts.map(ft => (
                    <div
                        key={ft.id}
                        className={`absolute left-1/2 top-1/2 font-display text-2xl animate-combat-text ${ft.color}`}
                    >
                        {ft.text}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AvatarBattle;
