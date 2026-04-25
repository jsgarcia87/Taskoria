import React, { useState, useEffect, useRef } from 'react';

const MobileJoystick = ({ onMove, onStop }) => {
    const joyRef = useRef(null);
    const stickDOMRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    
    // Joystick circle configuration
    const maxRadius = 40; 

    const handleStart = (e) => {
        setIsDragging(true);
        updateJoyPos(e);
    };

    const handleMove = (e) => {
        if (!isDragging) return;
        updateJoyPos(e);
    };

    const handleEnd = () => {
        setIsDragging(false);
        if (stickDOMRef.current) {
            stickDOMRef.current.style.transform = `translate(0px, 0px)`;
        }
        if (onStop) onStop();
    };

    const updateJoyPos = (e) => {
        if (e.cancelable) e.preventDefault(); // Stop scrolling!
        if (!joyRef.current) return;
        const rect = joyRef.current.getBoundingClientRect();
        
        let clientX = e.clientX;
        let clientY = e.clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let deltaX = clientX - centerX;
        let deltaY = clientY - centerY;

        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > maxRadius) {
            deltaX = (deltaX / distance) * maxRadius;
            deltaY = (deltaY / distance) * maxRadius;
        }

        if (stickDOMRef.current) {
            stickDOMRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        }

        if (onMove) {
            onMove({ 
                x: deltaX / maxRadius, 
                y: deltaY / maxRadius 
            });
        }
    };

    // Add global Listeners to catch moves and releases outside the component
    useEffect(() => {
        const handleTouchMove = (e) => updateJoyPos(e);
        const handleMouseMove = (e) => updateJoyPos(e);

        if (isDragging) {
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('touchend', handleEnd);
            window.addEventListener('mouseup', handleEnd);
        } else {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchend', handleEnd);
            window.removeEventListener('mouseup', handleEnd);
        }
        return () => {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchend', handleEnd);
            window.removeEventListener('mouseup', handleEnd);
        };
    }, [isDragging]);

    return (
        <div 
            className="fixed bottom-24 left-10 md:hidden z-50 select-none"
            style={{ touchAction: 'none' }}
        >
            <div 
                ref={joyRef}
                className="w-24 h-24 bg-black/40 border-2 border-white/20 rounded-full flex items-center justify-center backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                onTouchStart={handleStart}
                onMouseDown={handleStart}
            >
                <div 
                    ref={stickDOMRef}
                    className="w-10 h-10 bg-white/40 border border-white/50 rounded-full shadow-lg transition-transform duration-75 will-change-transform"
                    style={{ 
                        transform: `translate(0px, 0px)`,
                        boxShadow: '0 0 10px rgba(255,255,255,0.3) inset'
                    }}
                />
            </div>
            {/* Simple instruction */}
            <div className="text-[10px] text-white/50 uppercase font-bold text-center mt-2 tracking-widest pointer-events-none">
                Move
            </div>
        </div>
    );
};

export default MobileJoystick;
