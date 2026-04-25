import React from 'react';
import ModernPixelAvatar from './ModernPixelAvatar';

const PixelAvatar = ({ type = 'warrior', scale = 1, customColors = null, headOnly = false, equipment = {} }) => {
    return (
        <ModernPixelAvatar 
            type={type} 
            scale={scale} 
            headOnly={headOnly}
            customColors={customColors}
        />
    );
};

export default PixelAvatar;
