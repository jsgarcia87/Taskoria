import React, { useState } from 'react';
import { Scroll, X } from 'lucide-react';

const LoreScroll = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative inline-block z-40">
            {/* The Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="group flex items-center gap-2 bg-rpg-panel border-[3px] border-rpg-panelLight hover:border-rpg-gold px-4 py-2 rounded-xl transition-all shadow-[4px_4px_0_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-none"
            >
                <Scroll size={20} className="text-rpg-gold group-hover:animate-pulse" />
                <span className="font-heading font-bold text-sm tracking-widest uppercase text-white group-hover:text-rpg-gold transition-colors">
                    Read the Lore
                </span>
            </button>

            {/* The Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Scroll Container */}
                    <div className="relative w-full max-w-lg animate-unroll">
                        {/* Top Wooden Roller */}
                        <div className="absolute -top-4 -left-4 -right-4 h-8 bg-[#5c4033] rounded-full border-4 border-[#3e2b22] shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-20 flex items-center justify-between px-1">
                            <div className="w-6 h-6 bg-[#8b5a2b] rounded-full border-2 border-[#3e2b22]"></div>
                            <div className="w-6 h-6 bg-[#8b5a2b] rounded-full border-2 border-[#3e2b22]"></div>
                        </div>

                        {/* Parchment Paper */}
                        <div className="relative bg-[#f4e4bc] border-x-4 border-[#cdae77] p-8 md:p-10 shadow-2xl overflow-hidden z-10" style={{
                            backgroundImage: 'radial-gradient(circle at center, #f4e4bc 0%, #e6cd98 100%)'
                        }}>
                            {/* Decorative corner elements */}
                            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#b8955a]/40"></div>
                            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#b8955a]/40"></div>
                            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#b8955a]/40"></div>
                            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#b8955a]/40"></div>
                            
                            {/* Close Button */}
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 text-[#8c6733] hover:text-[#5c4033] transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="text-center mb-6 mt-2">
                                <Scroll size={32} className="mx-auto text-[#8c6733] mb-2 opacity-80" />
                                <h3 className="font-landing text-3xl font-bold text-[#5c4033] uppercase tracking-widest border-b-2 border-[#8c6733]/30 pb-3 inline-block">
                                    The Royal Archive
                                </h3>
                            </div>

                            <div className="space-y-4 font-heading text-base md:text-lg text-[#4a3424] leading-relaxed text-justify">
                                <p>
                                    Long ago, the world was consumed by the <span className="font-bold text-red-800">Void of Procrastination</span>. Dreams faded, and legendary deeds remained undone. 
                                </p>
                                <p>
                                    To combat this creeping darkness, <strong className="text-[#8c6733]">The Royal Archive</strong> was founded—a magical guild dedicated to restoring order by turning every mundane duty into a grand quest.
                                </p>
                                <p>
                                    You are one of the chosen heroes. Your daily habits are your weapons, your focused work is your magic, and every task completed rebuilds the kingdom pixel by pixel.
                                </p>
                                <p className="text-center text-xl font-bold text-[#8c6733] mt-6 pt-4 border-t border-[#8c6733]/20 italic">
                                    "Will you answer the call?"
                                </p>
                            </div>
                        </div>

                        {/* Bottom Wooden Roller */}
                        <div className="absolute -bottom-4 -left-4 -right-4 h-8 bg-[#5c4033] rounded-full border-4 border-[#3e2b22] shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-20 flex items-center justify-between px-1">
                            <div className="w-6 h-6 bg-[#8b5a2b] rounded-full border-2 border-[#3e2b22]"></div>
                            <div className="w-6 h-6 bg-[#8b5a2b] rounded-full border-2 border-[#3e2b22]"></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoreScroll;
