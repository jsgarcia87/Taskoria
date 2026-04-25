import React, { useEffect } from 'react';
import PixelIcon from '../common/PixelIcon';

const DailyRewardModal = ({ isOpen, onClose, data }) => {
    useEffect(() => {
        if (isOpen) {
            // Optional: play a unique sound here if desired
        }
    }, [isOpen]);

    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div className="bg-[#1a102e] border-2 border-rpg-gold rounded-2xl p-6 max-w-sm w-full text-center relative overflow-hidden shadow-2xl shadow-yellow-500/20">
                {/* Visual Flair Background */}
                <div className="absolute inset-x-0 -top-20 h-40 bg-yellow-500/10 blur-3xl rounded-full mix-blend-screen pointer-events-none animate-pulse"></div>
                
                {/* Header */}
                <h2 className="text-3xl font-heading font-bold text-rpg-gold mb-2 tracking-widest uppercase drop-shadow-glow">
                    Daily Login!
                </h2>
                
                {/* Streak Banner */}
                <div className="bg-black/50 border border-white/10 rounded-xl py-2 px-4 mb-6 inline-flex items-center gap-2 relative z-10">
                    <PixelIcon name="star" size={16} className="text-yellow-400" />
                    <span className="text-white font-bold tracking-wider">
                        {data.streak} Day Streak
                    </span>
                    <PixelIcon name="star" size={16} className="text-yellow-400" />
                </div>

                {/* Reward Display */}
                <div className="mb-6 relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border border-yellow-500/30 rounded-full flex items-center justify-center mb-3 animate-bounce">
                        <PixelIcon name="coins" size={40} className="text-yellow-400 drop-shadow-glow" />
                    </div>
                    <p className="text-gray-400 font-bold mb-1 uppercase tracking-widest text-xs">Reward Received</p>
                    <p className="text-4xl font-heading font-black text-white text-shadow-glow">
                        +{data.gold} <span className="text-xl text-yellow-500">G</span>
                    </p>
                </div>

                {/* Action */}
                <button
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 text-black py-4 px-6 rounded-xl font-bold font-heading uppercase text-xl shadow-[0_0_15px_rgba(251,191,36,0.4)] hover:shadow-[0_0_25px_rgba(251,191,36,0.6)] hover:brightness-110 active:scale-95 transition-all relative z-10 tracking-wider"
                >
                    Claim Reward
                </button>
            </div>
        </div>
    );
};

export default DailyRewardModal;
