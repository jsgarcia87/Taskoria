import React, { useState, useEffect } from 'react';
import { Scroll, Cookie, X } from 'lucide-react';

const CookieBanner = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('taskoria_cookie_consent');
        if (!consent) {
            // Slight delay so it doesn't pop up instantly and aggressively
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('taskoria_cookie_consent', 'accepted');
        setIsVisible(false);
        // Here you would typically initialize Analytics if not already done via GTM
    };

    const handleReject = () => {
        localStorage.setItem('taskoria_cookie_consent', 'rejected');
        setIsVisible(false);
        // Here you would disable Analytics tracking
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[9999] bg-[#1a1322] border-[6px] border-rpg-panelLight p-5 rounded-xl shadow-[8px_8px_0_rgba(0,0,0,0.6)] flex flex-col gap-4 text-sm text-gray-300 animate-slide-up">
            
            <div className="flex items-start justify-between gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Scroll size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="text-white font-bold mb-1 flex items-center gap-2">
                        Pergaminos de Rastreo / Tracking Scrolls <Cookie size={14} className="text-rpg-gold" />
                    </h3>
                    <p className="text-xs leading-relaxed mb-2">
                        Usamos pergaminos mágicos (cookies) propios y de terceros para entender cómo exploras el reino y mejorar tu aventura.
                    </p>
                    <p className="text-xs leading-relaxed">
                        We use magical scrolls (cookies) from us and third parties to understand how you explore the realm and improve your adventure.
                    </p>
                </div>
                <button 
                    onClick={handleReject}
                    className="text-gray-500 hover:text-white transition-colors"
                    aria-label="Cerrar / Close"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="flex gap-2 font-bold text-[11px] uppercase tracking-widest mt-2">
                <button 
                    onClick={handleReject}
                    className="flex-1 px-4 py-2 bg-rpg-panel border-b-[4px] border-rpg-panelLight active:border-b-0 active:translate-y-[4px] hover:bg-white/5 transition-all rounded text-gray-300 leading-tight"
                >
                    Solo Esenciales<br/>Essential Only
                </button>
                <button 
                    onClick={handleAccept}
                    className="flex-1 px-4 py-2 bg-rpg-gold border-b-[4px] border-yellow-600 active:border-b-0 active:translate-y-[4px] hover:bg-yellow-400 transition-all rounded text-black leading-tight"
                >
                    Aceptar Todo<br/>Accept All
                </button>
            </div>
            
            <div className="text-[10px] text-gray-500 text-center mt-2">
                Puedes leer más en nuestro / Read more in our <a href="#" onClick={(e) => { e.preventDefault(); /* Need to navigate to legal */ }} className="underline hover:text-rpg-gold">Aviso Legal (Legal Notice)</a>.
            </div>
        </div>
    );
};

export default CookieBanner;
