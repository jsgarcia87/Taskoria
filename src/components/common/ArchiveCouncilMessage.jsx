import React, { useState, useEffect } from 'react';
import { Scroll, ChevronRight, Loader2 } from 'lucide-react';

const PixelWeatherIcon = ({ type }) => {
    switch(type) {
        case 'clear':
        case 'hot':
        case 'heatwave':
        case 'sunrise':
            return (
                <svg viewBox="0 0 16 16" className="w-8 h-8" shapeRendering="crispEdges">
                    <rect x="6" y="2" width="4" height="1" fill="#fbbf24"/>
                    <rect x="6" y="13" width="4" height="1" fill="#fbbf24"/>
                    <rect x="2" y="6" width="1" height="4" fill="#fbbf24"/>
                    <rect x="13" y="6" width="1" height="4" fill="#fbbf24"/>
                    <rect x="3" y="4" width="2" height="1" fill="#fbbf24"/>
                    <rect x="4" y="3" width="1" height="1" fill="#fbbf24"/>
                    <rect x="11" y="4" width="2" height="1" fill="#fbbf24"/>
                    <rect x="11" y="3" width="1" height="1" fill="#fbbf24"/>
                    <rect x="3" y="11" width="2" height="1" fill="#fbbf24"/>
                    <rect x="4" y="12" width="1" height="1" fill="#fbbf24"/>
                    <rect x="11" y="11" width="2" height="1" fill="#fbbf24"/>
                    <rect x="11" y="12" width="1" height="1" fill="#fbbf24"/>
                    <rect x="5" y="5" width="6" height="6" fill="#f59e0b"/>
                </svg>
            );
        case 'night':
            return (
                <svg viewBox="0 0 16 16" className="w-8 h-8" shapeRendering="crispEdges">
                    <rect x="8" y="3" width="4" height="1" fill="#fcd34d"/>
                    <rect x="12" y="4" width="1" height="8" fill="#fcd34d"/>
                    <rect x="11" y="12" width="2" height="1" fill="#fcd34d"/>
                    <rect x="8" y="13" width="3" height="1" fill="#fcd34d"/>
                    <rect x="6" y="12" width="2" height="1" fill="#fcd34d"/>
                    <rect x="5" y="11" width="1" height="1" fill="#fcd34d"/>
                    <rect x="6" y="10" width="2" height="1" fill="#fcd34d"/>
                    <rect x="8" y="9" width="1" height="1" fill="#fcd34d"/>
                    <rect x="9" y="8" width="1" height="1" fill="#fcd34d"/>
                    <rect x="9" y="7" width="1" height="1" fill="#fcd34d"/>
                    <rect x="8" y="6" width="1" height="1" fill="#fcd34d"/>
                    <rect x="6" y="5" width="2" height="1" fill="#fcd34d"/>
                    <rect x="5" y="4" width="1" height="1" fill="#fcd34d"/>
                    <rect x="6" y="3" width="2" height="1" fill="#fcd34d"/>
                </svg>
            );
        case 'cloudy':
        case 'partly_cloudy':
        case 'fog':
        case 'windy':
            return (
                <svg viewBox="0 0 16 16" className="w-8 h-8" shapeRendering="crispEdges">
                    <rect x="5" y="5" width="4" height="1" fill="#cbd5e1"/>
                    <rect x="4" y="6" width="1" height="1" fill="#cbd5e1"/>
                    <rect x="9" y="6" width="2" height="1" fill="#cbd5e1"/>
                    <rect x="3" y="7" width="1" height="3" fill="#cbd5e1"/>
                    <rect x="11" y="7" width="1" height="1" fill="#cbd5e1"/>
                    <rect x="12" y="8" width="1" height="2" fill="#cbd5e1"/>
                    <rect x="11" y="10" width="1" height="1" fill="#cbd5e1"/>
                    <rect x="4" y="10" width="7" height="1" fill="#cbd5e1"/>
                    <rect x="4" y="7" width="7" height="3" fill="#f1f5f9"/>
                    <rect x="11" y="8" width="1" height="2" fill="#f1f5f9"/>
                </svg>
            );
        case 'rain':
        case 'storm':
            return (
                <svg viewBox="0 0 16 16" className="w-8 h-8" shapeRendering="crispEdges">
                    <rect x="5" y="4" width="4" height="1" fill="#64748b"/>
                    <rect x="4" y="5" width="1" height="1" fill="#64748b"/>
                    <rect x="9" y="5" width="2" height="1" fill="#64748b"/>
                    <rect x="3" y="6" width="1" height="3" fill="#64748b"/>
                    <rect x="11" y="6" width="1" height="1" fill="#64748b"/>
                    <rect x="12" y="7" width="1" height="2" fill="#64748b"/>
                    <rect x="11" y="9" width="1" height="1" fill="#64748b"/>
                    <rect x="4" y="9" width="7" height="1" fill="#64748b"/>
                    <rect x="4" y="6" width="7" height="3" fill="#94a3b8"/>
                    <rect x="11" y="7" width="1" height="2" fill="#94a3b8"/>
                    <rect x="5" y="11" width="1" height="2" fill="#3b82f6"/>
                    <rect x="8" y="12" width="1" height="2" fill="#3b82f6"/>
                    <rect x="11" y="11" width="1" height="2" fill="#3b82f6"/>
                </svg>
            );
        case 'snow':
            return (
                <svg viewBox="0 0 16 16" className="w-8 h-8" shapeRendering="crispEdges">
                    <rect x="7" y="2" width="2" height="12" fill="#e2e8f0"/>
                    <rect x="2" y="7" width="12" height="2" fill="#e2e8f0"/>
                    <rect x="4" y="4" width="2" height="2" fill="#e2e8f0"/>
                    <rect x="10" y="4" width="2" height="2" fill="#e2e8f0"/>
                    <rect x="4" y="10" width="2" height="2" fill="#e2e8f0"/>
                    <rect x="10" y="10" width="2" height="2" fill="#e2e8f0"/>
                </svg>
            );
        default:
            return (
                <svg viewBox="0 0 16 16" className="w-8 h-8" shapeRendering="crispEdges">
                    <rect x="7" y="4" width="2" height="6" fill="#fbbf24"/>
                    <rect x="7" y="11" width="2" height="2" fill="#fbbf24"/>
                </svg>
            );
    }
};

const MESSAGES = {
    clear: "The skies are clear, and the roads are open. The Council recommends taking advantage of the weather to complete an outdoor quest. Even a short walk grants experience.",
    hot: "The Council advises saving long expeditions for another time. Today is perfect for studying, organizing your home, or making progress on a creative quest.",
    heatwave: "The heat has become a challenge worthy of even the strongest adventurers. Today, wisdom is more valuable than strength. An indoor quest is still a quest completed.",
    partly_cloudy: "Clouds drift across the kingdom, but the roads remain welcoming. A perfect day to tackle the quest you've been postponing.",
    cloudy: "A blanket of clouds hangs over the realm. Not every day calls for heroic feats. Small victories are what truly build legends.",
    rain: "Rain falls gently across the kingdom. A fine opportunity to seek shelter, read a chapter, learn something new, or bring order to your inventory.",
    storm: "A storm sweeps across the realm, making travel unwise. The Council recommends focusing on quests that require patience, focus, and strategy.",
    snow: "Snow blankets the roads and forests alike. Today is an excellent day to sharpen your mind, master a new skill, or prepare for adventures yet to come.",
    fog: "A thick fog hides what lies ahead. You don't need to see the entire journey. Complete one small quest, and the next step will reveal itself.",
    windy: "Strong winds race across the kingdom. Even the bravest adventurers know when to pause. Use this time to complete quieter quests before venturing out again.",
    night: "The moon watches over the kingdom, and silence fills the roads. Complete one final quest before resting. Tomorrow, a new adventure begins.",
    sunrise: "A new dawn rises over the realm. Every great hero remembers their first quest of the day. Start with a small one, and let momentum guide the rest.",
    random: [
        "Every legendary adventure began with a single quest.",
        "The Council believes today is the perfect day to move one step closer to your goals.",
        "Heroes don't wait for motivation. They complete one quest, and motivation follows.",
        "The Archive never forgets a completed quest. Every victory strengthens your legend.",
        "The greatest rewards rarely belong to those who wait. Accept your next quest.",
        "A citizen's legend isn't written in a single heroic act, but in the quests they complete day after day."
    ]
};

const getWeatherType = (weatherCode, temperature, hour) => {
    // Night overrides general weather unless it's a storm or snow
    const isNight = hour >= 20 || hour <= 5;
    const isSunrise = hour > 5 && hour <= 7;

    if (weatherCode >= 95 || weatherCode === 80 || weatherCode === 81 || weatherCode === 82) return 'storm';
    if (weatherCode >= 71 && weatherCode <= 77) return 'snow';
    if (weatherCode === 45 || weatherCode === 48) return 'fog';
    if (weatherCode >= 51 && weatherCode <= 67) return 'rain';
    
    // Wind check is usually wind speed, but we'll fallback if weatherCode is specific. 
    // Open-Meteo doesn't have a specific "windy" weather code in WMO, we'd need windspeed.
    // For simplicity, we stick to temp and clouds.

    if (temperature >= 35) return 'heatwave';
    if (temperature >= 28) return 'hot';

    if (isNight) return 'night';
    if (isSunrise) return 'sunrise';

    if (weatherCode === 1 || weatherCode === 2) return 'partly_cloudy';
    if (weatherCode === 3) return 'cloudy';

    // 0 is clear sky
    if (weatherCode === 0) return 'clear';

    return 'random';
};

const ArchiveCouncilMessage = ({ onJoinBeta }) => {
    const [message, setMessage] = useState(null);
    const [weatherState, setWeatherState] = useState(null); // { temp, type }
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeatherAndLore = async () => {
            try {
                // 1. Get location via IP (No API Key needed)
                const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
                if (!geoRes.ok) throw new Error("Geo failed");
                const geoData = await geoRes.json();
                const { latitude, longitude } = geoData;

                // 2. Get Weather
                const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
                if (!weatherRes.ok) throw new Error("Weather failed");
                const weatherData = await weatherRes.json();
                
                const current = weatherData.current_weather;
                const hour = new Date().getHours();
                
                let type = getWeatherType(current.weathercode, current.temperature, hour);
                if (current.windspeed > 30) type = 'windy';

                let finalMessage = '';
                if (type === 'random') {
                    finalMessage = MESSAGES.random[Math.floor(Math.random() * MESSAGES.random.length)];
                } else {
                    finalMessage = MESSAGES[type] || MESSAGES.random[0];
                }

                setMessage(finalMessage);
                setWeatherState({
                    temp: Math.round(current.temperature),
                    type: type
                });
            } catch (error) {
                console.error("Archive Council failed to observe realm:", error);
                // Fallback to random
                setMessage(MESSAGES.random[Math.floor(Math.random() * MESSAGES.random.length)]);
                setWeatherState({ temp: '?', type: 'random' });
            } finally {
                setLoading(false);
            }
        };

        fetchWeatherAndLore();
    }, []);

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto w-full mb-12">
                <div className="bg-rpg-panel border-4 border-rpg-panelLight rounded-xl p-6 shadow-xl flex items-center justify-center min-h-[120px]">
                    <Loader2 size={24} className="text-rpg-gold animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto w-full mb-12 animate-[slideUpFade_1s_ease-out_forwards] opacity-0 group relative z-20">
            <div className="bg-rpg-panel border-[3px] border-rpg-panelLight hover:border-rpg-gold transition-colors duration-500 rounded-xl p-5 md:p-6 shadow-[8px_8px_0_rgba(0,0,0,0.4)] relative overflow-hidden flex flex-col md:flex-row gap-4 md:items-center">
                
                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-4 h-4 bg-rpg-panelLight/50 rounded-br-lg"></div>
                <div className="absolute top-0 right-0 w-4 h-4 bg-rpg-panelLight/50 rounded-bl-lg"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 bg-rpg-panelLight/50 rounded-tr-lg"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-rpg-panelLight/50 rounded-tl-lg"></div>

                <div className="flex-shrink-0 bg-rpg-panelDark p-3 rounded-xl border border-white/10 mx-auto md:mx-0 relative flex flex-col items-center">
                    {weatherState && weatherState.type !== 'random' ? (
                        <>
                            <PixelWeatherIcon type={weatherState.type} />
                            <div className="mt-1 text-[10px] font-bold text-gray-300 bg-black/40 px-2 py-0.5 rounded border border-white/10 font-mono tracking-widest">
                                {weatherState.temp}°C
                            </div>
                        </>
                    ) : (
                        <Scroll size={32} className="text-rpg-gold drop-shadow-[0_0_8px_rgba(253,223,140,0.5)]" />
                    )}
                </div>

                <div className="flex-1 text-center md:text-left font-heading">
                    <h3 className="text-sm uppercase tracking-widest text-rpg-gold/80 font-bold mb-1 flex items-center justify-center md:justify-start gap-2">
                        <span>📜</span> The Archive has observed your realm...
                    </h3>
                    <p className="text-gray-200 text-sm md:text-base leading-relaxed">
                        {message}
                    </p>
                    <div className="mt-3 text-xs md:text-sm font-bold text-gray-400">
                        It's a perfect time to join the beta.
                    </div>
                </div>

                <div className="flex-shrink-0 flex justify-center mt-2 md:mt-0">
                    <button 
                        onClick={onJoinBeta}
                        className="bg-white/10 hover:bg-rpg-gold hover:text-black text-white border border-white/20 hover:border-rpg-gold px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1 shadow-md active:translate-y-1"
                    >
                        Join Now <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ArchiveCouncilMessage;
