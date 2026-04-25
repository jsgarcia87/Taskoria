import React from 'react';

const Sprite = ({ src, x, y, width, height, scale = 1, className = '' }) => {
    const style = {
        backgroundImage: `url(${src})`,
        backgroundPosition: `-${x}px -${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        imageRendering: 'pixelated', // Essential for pixel art
        display: 'inline-block'
    };

    // Wrapper to handle scaling space correctly
    const wrapperStyle = {
        width: `${width * scale}px`,
        height: `${height * scale}px`,
        overflow: 'hidden',
        display: 'inline-block'
    };

    return (
        <div style={wrapperStyle} className={className}>
            <div style={style} />
        </div>
    );
};

export default Sprite;
