import React from 'react';
import ModernPixelPet from './ModernPixelPet';

const PixelPet = ({ type = 'wolf', scale = 1, level = 1, mood = 'happy' }) => {
    // Evolution logic: Grow in size at certain level milestones
    let evolutionScale = scale;
    if (level >= 20) {
        evolutionScale *= 1.4;
    } else if (level >= 10) {
        evolutionScale *= 1.2;
    }

    const isSad = mood === 'sad';
    
    // Map legacy types to new blueprints
    let petType = type;
    if (type === 'egg') petType = 'dragon_egg';

    return (
        <div 
            className={`transition-all duration-500 ease-out ${isSad ? 'grayscale opacity-70 scale-95' : 'opacity-100'}`}
            style={{ 
                transformOrigin: 'bottom center',
                display: 'inline-block'
            }}
        >
            <ModernPixelPet 
                type={petType} 
                scale={evolutionScale} 
                isHatching={type === 'egg'}
            />
        </div>
    );
};

export default PixelPet;
