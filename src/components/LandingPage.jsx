import React, { useState, useEffect, useRef } from 'react';
import {
    Sword, Shield, Scroll, Users, CheckCircle2, ChevronRight, Loader2, Crown, Hammer,
    Sparkles, Map, Timer, Heart, Target, Trophy, Flame, Star, Zap, BookOpen, TreePine, Castle, Eraser, Square
} from 'lucide-react';
import ModernPixelAvatar from './common/ModernPixelAvatar';
import ModernPixelPet from './common/ModernPixelPet';
import LoreScroll from './common/LoreScroll';
import { WorldSprite, WORLD_PROPS } from './dashboard/world/worldProps';

// Reveal-on-scroll wrapper using IntersectionObserver (robust, no scroll math)
const Reveal = ({ children, className = '', delay = 0 }) => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setVisible(true);
                obs.disconnect();
            }
        }, { threshold: 0.15 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return (
        <div
            ref={ref}
            className={`${className} transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

// Mockup of the in-game UI — pure HTML/CSS, no external assets
const HeroMockup = () => {
    return (
        <div className="relative w-full max-w-[520px] mx-auto">
            {/* Floating glow halo */}
            <div className="absolute -inset-8 bg-gradient-to-tr from-rpg-gold/20 via-purple-500/10 to-indigo-500/20 blur-3xl rounded-full pointer-events-none"></div>

            {/* Browser-window / UI Panel chrome */}
            <div className="relative bg-rpg-bg border-[6px] border-rpg-panelLight rounded-xl shadow-[12px_12px_0_rgba(0,0,0,0.6)] overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-2 border-b-4 border-rpg-panelLight bg-rpg-panel">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/70"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/70"></div>
                    <div className="ml-2 text-[9px] uppercase tracking-widest text-gray-500 font-mono">taskoria.app/camp</div>
                </div>

                <div className="grid grid-cols-12 gap-3 p-4 bg-rpg-bg">
                    {/* Avatar showcase */}
                    <div className="col-span-12 sm:col-span-6 bg-rpg-panel border-4 border-rpg-panelLight rounded-lg p-5 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Hero</div>
                                <div className="text-base font-heading text-white">Arcanys the Wise</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[9px] font-bold uppercase tracking-widest text-rpg-gold">Lvl 7</div>
                                <div className="text-[9px] text-gray-400 uppercase">Mage · Order of Embers</div>
                            </div>
                        </div>
                        <div className="relative flex items-end justify-center gap-3 flex-1 min-h-[180px] rounded-md overflow-hidden"
                             style={{
                                 background: 'radial-gradient(ellipse at center 65%, rgba(139,92,246,0.18) 0%, rgba(10,5,20,0) 60%), linear-gradient(180deg, #1a1330 0%, #0f0a1f 100%)',
                             }}>
                            {/* Subtle ground line */}
                            <div className="absolute bottom-6 left-6 right-6 h-px bg-white/10" />
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-32 h-3 rounded-full bg-black/50 blur-md" />
                            <div className="relative z-10 pb-4">
                                <ModernPixelAvatar type="wizard" scale={2.2} />
                            </div>
                            <div className="relative z-10 pb-4">
                                <ModernPixelPet type="dragon" scale={1.4} />
                            </div>
                        </div>
                        <div className="w-full mt-4 space-y-1.5">
                            <StatBar label="HP" value={82} color="bg-rose-500" />
                            <StatBar label="MP" value={64} color="bg-blue-500" />
                            <StatBar label="XP" value={45} color="bg-rpg-gold" />
                        </div>
                    </div>

                    {/* Quest list */}
                    <div className="col-span-12 sm:col-span-6 bg-rpg-panel border-4 border-rpg-panelLight rounded-lg p-5 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Today</div>
                                <div className="text-base font-heading text-white">Quest log</div>
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">3 / 5</div>
                        </div>
                        <ul className="space-y-2 text-[12px] flex-1">
                            <QuestItem checked label="Run 5km outdoors" reward="+30 XP" />
                            <QuestItem checked label="Read 20 pages" reward="+15 XP" />
                            <QuestItem checked label="Close sprint tickets" reward="+50 XP" />
                            <QuestItem label="Study English" reward="+25 XP" />
                            <QuestItem label="Meditate 10 min" reward="+10 XP" />
                        </ul>
                        <div className="mt-3 pt-3 border-t-2 border-rpg-panelLight flex items-center justify-between text-[10px] uppercase tracking-widest">
                            <span className="text-gray-500">Daily streak</span>
                            <span className="text-rpg-gold font-bold flex items-center gap-1"><Flame size={11}/> 12 days</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* Floating "+50 XP" pip */}
            <div className="absolute -top-3 right-6 bg-rpg-gold text-black font-heading text-xs px-3 py-1 rounded-sm border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,0.4)] animate-bounce font-bold">+50 XP</div>
        </div>
    );
};

const StatBar = ({ label, value, color }) => (
    <div className="flex items-center gap-1.5">
        <span className="text-[8px] font-bold text-gray-400 uppercase w-5">{label}</span>
        <div className="flex-1 h-2 bg-rpg-panelDark rounded-full overflow-hidden border-2 border-rpg-panelLight">
            <div className={`h-full ${color} animate-stat-fill`} style={{ width: `${value}%` }}></div>
        </div>
    </div>
);

const QuestItem = ({ checked, label, reward }) => (
    <li className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
            <div className={`w-3 h-3 rounded-sm border ${checked ? 'bg-green-500/80 border-green-400' : 'bg-transparent border-gray-500'} flex items-center justify-center`}>
                {checked && <CheckCircle2 size={8} className="text-white"/>}
            </div>
            <span className={`truncate ${checked ? 'line-through text-gray-500' : 'text-gray-200'}`}>{label}</span>
        </div>
        <span className={`text-[9px] font-bold whitespace-nowrap ${checked ? 'text-gray-600' : 'text-rpg-gold'}`}>{reward}</span>
    </li>
);

const InteractiveBuilder = () => {
    const [grid, setGrid] = useState(Array(6 * 6).fill(null));
    const [activeTool, setActiveTool] = useState('tree');
    const [isDrawing, setIsDrawing] = useState(false);

    const tools = [
        { id: 'tree', icon: TreePine, color: 'text-green-400', bg: 'bg-green-400/20' },
        { id: 'house', icon: Castle, color: 'text-rpg-gold', bg: 'bg-rpg-gold/20' },
        { id: 'path', icon: Square, color: 'text-[#d2a679]', bg: 'bg-[#8b5a2b]/30' },
        { id: 'eraser', icon: Eraser, color: 'text-red-400', bg: 'bg-red-400/20' }
    ];

    const handlePaint = (index) => {
        setGrid(prev => {
            const newGrid = [...prev];
            newGrid[index] = activeTool === 'eraser' ? null : activeTool;
            return newGrid;
        });
    };

    return (
        <div className="relative z-10 flex flex-col sm:flex-row gap-6 bg-[#1a1322] border-4 border-rpg-panelLight p-6 rounded-xl shadow-[8px_8px_0_rgba(0,0,0,0.5)]">
            {/* Palette */}
            <div className="flex sm:flex-col gap-3 justify-center">
                {tools.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTool(t.id)}
                        className={`w-12 h-12 rounded-xl border-4 flex items-center justify-center transition-all ${activeTool === t.id ? 'border-rpg-gold bg-rpg-panelDark scale-110 shadow-[4px_4px_0_rgba(253,223,140,0.3)]' : 'border-rpg-panelLight bg-rpg-panel hover:bg-rpg-panelLight/50'}`}
                    >
                        <t.icon size={24} className={t.color} />
                    </button>
                ))}
            </div>
            
            {/* Grid */}
            <div 
                className="grid grid-cols-6 gap-1 bg-rpg-panelDark p-2 border-4 border-rpg-panelLight rounded-xl shadow-inner mx-auto sm:mx-0"
                onMouseLeave={() => setIsDrawing(false)}
                onMouseUp={() => setIsDrawing(false)}
            >
                {grid.map((cell, i) => (
                    <div 
                        key={i}
                        onMouseDown={() => { setIsDrawing(true); handlePaint(i); }}
                        onMouseEnter={() => { if (isDrawing) handlePaint(i); }}
                        className={`w-10 h-10 sm:w-12 sm:h-12 border-2 border-rpg-panelLight/30 rounded flex items-center justify-center cursor-pointer transition-colors select-none ${cell === 'path' ? 'bg-[#5c4033] border-[#3e2b22]' : 'bg-[#2a2233] hover:bg-[#473d54]'}`}
                    >
                        {cell === 'tree' && <TreePine size={24} className="text-green-400 animate-bounce drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" />}
                        {cell === 'house' && <Castle size={24} className="text-rpg-gold animate-bounce drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" />}
                    </div>
                ))}
            </div>
            
            {/* CTA */}
            <div className="absolute -top-12 -right-4 sm:-right-8 hidden md:block z-20">
                <div className="pixel-bubble p-4 text-center animate-float">
                    <div className="bubble-body font-bold text-[#2a2a2a] text-xs">
                        "Build your town here!"
                    </div>
                    <div className="absolute -bottom-3 left-6 text-[#2a2a2a] text-xl leading-none -rotate-90 drop-shadow-[2px_0_0_rgba(0,0,0,0.5)]">◀</div>
                </div>
            </div>
        </div>
    );
};

// Renders a real game prop inside the landing mini map, positioned by % coords.
// The sprite anchors at its bottom (feet on the ground), like in the real world.
const LandingPage = ({ onGoToLogin, onGoToTerms, onGoToLegal }) => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [scrollPosition, setScrollPosition] = useState(0);
    const waitlistRef = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 20;
            const y = (e.clientY / window.innerHeight - 0.5) * 20;
            setMousePosition({ x, y });
        };
        const handleScroll = () => setScrollPosition(window.scrollY);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleJoinWaitlist = async (e) => {
        e.preventDefault();
        if (!email) return;
        setStatus('loading');
        try {
            const res = await fetch('api/waitlist.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setStatus('success');
                setMessage(data.message || 'Check your inbox — your hero credentials just went out. See you in Taskoria!');
                setEmail('');
            } else {
                setStatus('error');
                setMessage(data.error || 'Couldn\'t add you to the waitlist. Try again later.');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Server connection error.');
        }
    };

    const scrollToWaitlist = () => {
        waitlistRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const parallaxBg1 = { transform: `translate(${mousePosition.x * -1}px, ${mousePosition.y * -1}px)` };
    const parallaxBg2 = { transform: `translate(${mousePosition.x * 1.5}px, ${mousePosition.y * 1.5}px)` };

    return (
        <div className="min-h-screen bg-rpg-bg text-white overflow-x-hidden font-sans selection:bg-rpg-gold selection:text-black">
            {/* Animated background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-rpg-panelDark to-rpg-panelDark transition-transform duration-700 ease-out" style={parallaxBg1}></div>
                <div className="absolute inset-0 landing-pixel-grid opacity-60"></div>
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-900/40 blur-[120px] rounded-full transition-transform duration-700 ease-out" style={parallaxBg2}></div>
                <div className="absolute top-[30%] -right-[10%] w-[40%] h-[60%] bg-amber-900/20 blur-[150px] rounded-full transition-transform duration-1000 ease-out" style={parallaxBg1}></div>
                <div className="absolute top-[80%] left-[20%] w-[30%] h-[40%] bg-purple-900/30 blur-[150px] rounded-full transition-transform duration-500 ease-out" style={parallaxBg2}></div>
            </div>

            {/* Navbar */}
            <nav className={`fixed top-0 w-full z-50 flex items-center justify-between px-6 py-4 md:px-12 md:py-5 border-b transition-all duration-300 ${scrollPosition > 50 ? 'border-white/10 bg-rpg-panelDark/80 backdrop-blur-xl shadow-lg' : 'border-transparent bg-transparent'}`}>
                <button
                    type="button"
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    aria-label="Scroll to top"
                >
                    <img src="./logo_taskoria.svg" alt="Taskoria Logo - Gamified RPG Habit Tracker" className="h-8 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)] group-hover:scale-105 transition-transform" />
                </button>
                <div className="flex items-center gap-2">
                    <button
                        onClick={scrollToWaitlist}
                        className="hidden md:inline text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white px-4 py-2 transition-colors"
                    >Join Beta</button>
                    <button
                        onClick={() => onGoToLogin?.()}
                        className="bg-rpg-panel border-[3px] border-rpg-panelLight hover:border-rpg-gold text-white text-xs md:text-sm font-bold uppercase tracking-widest px-5 md:px-6 py-2 rounded-xl transition-colors group font-heading shadow-[4px_4px_0_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none"
                    >
                        <span className="flex items-center gap-2">
                            Sign In
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                </div>
            </nav>

            {/* HERO - CHAPTER I: THE GATES */}
            <main className="relative z-10 container mx-auto px-6 pt-40 pb-32 flex flex-col items-center justify-center min-h-[85vh] text-center">
                <div className="max-w-4xl mx-auto flex flex-col items-center">
                    
                    <div className="mb-10 flex items-center justify-center animate-breathe">
                        <img src="./icono_taskoria_white.png" alt="Taskoria Crest - Gamified Productivity App" className="w-24 h-24 md:w-32 md:h-32 drop-shadow-[0_0_30px_rgba(253,223,140,0.7)]" />
                    </div>

                    <h1 className="sr-only">Taskoria: Gamified Productivity App and RPG Habit Tracker</h1>
                    
                    <h2 className="text-4xl md:text-5xl lg:text-7xl font-landing font-extrabold tracking-widest uppercase mb-8 animate-[slideUpFade_1s_ease-out_forwards] opacity-0 text-white drop-shadow-[0_0_15px_rgba(253,223,140,0.5)] leading-tight">
                        The Royal Archive<br/>is seeking new citizens.
                    </h2>

                    <p className="text-lg md:text-2xl text-rpg-gold font-heading max-w-2xl mx-auto mb-12 animate-[slideUpFade_1s_ease-out_0.3s_forwards] opacity-0 leading-relaxed drop-shadow-[0_0_10px_rgba(253,223,140,0.3)]">
                        Every unfinished duty weakens the Kingdom.<br className="hidden md:block"/> Every completed quest restores it.
                    </p>

                    <div className="animate-[slideUpFade_1s_ease-out_0.6s_forwards] opacity-0 flex flex-col items-center">
                        <button
                            onClick={scrollToWaitlist}
                            className="bg-rpg-gold text-rpg-panel border-b-[6px] border-yellow-600 active:border-b-0 active:translate-y-[6px] rounded-xl px-10 py-4 uppercase tracking-widest text-base md:text-lg font-heading font-extrabold transition-all flex items-center justify-center gap-3 group shadow-xl"
                        >
                            Enter the Kingdom
                            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                        </button>
                        
                        <button
                            onClick={() => onGoToLogin?.()}
                            className="mt-6 text-gray-500 hover:text-rpg-gold text-xs md:text-sm uppercase tracking-widest font-bold transition-colors font-heading"
                        >
                            I am already a citizen
                        </button>
                    </div>
                </div>
            </main>

            {/* Divider */}
            <div className="relative z-10 container mx-auto px-6"><div className="landing-divider max-w-4xl mx-auto"></div></div>

            {/* CHAPTER II: THE ORIGIN */}
            <section className="relative z-10 container mx-auto px-6 py-24 text-center">
                <Reveal>
                    <div className="max-w-3xl mx-auto bg-rpg-panel border-4 border-rpg-panelLight rounded-xl p-10 md:p-16 shadow-[12px_12px_0_rgba(0,0,0,0.5)] relative overflow-hidden">
                        {/* Decorative corners */}
                        <div className="absolute top-0 left-0 w-8 h-8 bg-rpg-panelLight"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 bg-rpg-panelLight"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 bg-rpg-panelLight"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 bg-rpg-panelLight"></div>

                        <div className="mb-10">
                            <BookOpen size={48} className="mx-auto text-rpg-gold opacity-80 drop-shadow-[0_0_15px_rgba(253,223,140,0.5)]" />
                        </div>
                        
                        <div className="space-y-10 font-heading text-lg md:text-xl text-gray-300 leading-relaxed">
                            <p className="animate-breathe">
                                <span className="block text-sm uppercase tracking-widest text-rpg-gold/70 mb-2 font-bold">Long ago...</span>
                                The Royal Archive began transforming<br className="hidden md:block"/> every mundane duty into a grand Quest.
                            </p>
                            <p>
                                Six guardians were appointed to protect it,<br className="hidden md:block"/> ensuring that no deed goes unrecorded and no effort is forgotten.
                            </p>
                            <p className="text-rpg-gold font-bold text-2xl md:text-3xl drop-shadow-[0_0_15px_rgba(253,223,140,0.4)] mt-12">
                                <span className="block text-sm uppercase tracking-widest text-rpg-gold/70 mb-2">Now...</span>
                                The Archive has summoned you.
                            </p>

                            <div className="mt-8 flex justify-center">
                                <LoreScroll />
                            </div>
                        </div>
                    </div>
                </Reveal>
            </section>

            {/* Divider */}
            <div className="relative z-10 container mx-auto px-6"><div className="landing-divider max-w-4xl mx-auto"></div></div>

            {/* HOW IT WORKS — Quest Path */}
            <section className="relative z-10 container mx-auto px-6 py-20">
                <Reveal className="text-center mb-14">
                    <div className="inline-block text-[11px] uppercase tracking-widest font-bold text-rpg-gold mb-3">Your quest begins</div>
                    <h2 className="text-3xl md:text-5xl font-landing font-bold text-white max-w-3xl mx-auto leading-tight">
                        Three steps to turn your to-do list into an <span className="text-rpg-gold">adventure</span>.
                    </h2>
                </Reveal>

                <div className="relative max-w-6xl mx-auto">
                    {/* Connecting quest path line — desktop only */}
                    <div className="hidden md:block absolute top-[52px] left-[16.67%] right-[16.67%] h-[2px] quest-path-line z-0"></div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { icon: Target, title: 'Create your quests', body: 'Log your tasks, daily habits and goals in our RPG task manager. Set difficulty and XP rewards. Everything you complete levels you up.' },
                            { icon: Sword, title: 'Level up your hero', body: 'Pick a class (Mage, Warrior, Rogue…), customize your pixel-art avatar, equip gear, adopt pets, and defeat your procrastination boss.' },
                            { icon: Map, title: 'Explore and build the world', body: 'Walk around the gamified town with your party, talk to NPCs, browse shops, and craft houses and mounts with a pixel art productivity community.' },
                        ].map((step, i) => (
                            <Reveal key={step.title} delay={i * 150}>
                                <div className="relative flex flex-col items-center text-center group">
                                    {/* Quest waypoint marker */}
                                    <div className="relative z-10 w-[80px] h-[80px] bg-rpg-panel border-4 border-rpg-panelLight rounded-xl flex items-center justify-center text-rpg-gold mb-5 shadow-[6px_6px_0_rgba(0,0,0,0.5)] group-hover:border-rpg-gold group-hover:-translate-y-2 transition-all">
                                        <step.icon size={32}/>
                                    </div>
                                    <h3 className="text-xl font-heading text-white mb-2">{step.title}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed max-w-xs">{step.body}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>

                    {/* Moved HeroMockup below How it works */}
                    <div className="mt-24">
                        <Reveal>
                            <div className="text-center mb-10">
                                <div className="inline-block text-[11px] uppercase tracking-widest font-bold text-rpg-gold mb-3">The Laws of the Archive</div>
                                <h3 className="text-2xl md:text-3xl font-landing font-bold text-white max-w-2xl mx-auto">
                                    Your legend begins with your daily duties.
                                </h3>
                            </div>
                            <HeroMockup/>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* Divider */}
            <div className="relative z-10 container mx-auto px-6"><div className="landing-divider max-w-4xl mx-auto"></div></div>

            {/* CHAPTER III: THE COUNCIL */}
            <section className="relative z-10 container mx-auto px-6 py-20">
                <Reveal className="text-center mb-20">
                    <div className="inline-block text-[11px] uppercase tracking-widest font-bold text-rpg-gold mb-3">Meet the Council</div>
                    <h2 className="text-3xl md:text-5xl font-landing font-bold text-white max-w-3xl mx-auto leading-tight">
                        Six guardians. Six ways to <span className="text-rpg-gold">conquer your day</span>.
                    </h2>
                </Reveal>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-8 max-w-5xl mx-auto">
                    {[
                        { name: "Ledgar", title: "El Registrador", icon: Scroll, color: "text-blue-400", bg: "bg-blue-400/20", border: "border-blue-400/40", lore: "I record every deed, lest they fade into the void.", tech: "Habits, Tasks & Diary" },
                        { name: "Chronos", title: "El Guardián del Tiempo", icon: Timer, color: "text-red-400", bg: "bg-red-400/20", border: "border-red-400/40", lore: "Time is a monster. Slay it, or let it consume you.", tech: "Pomodoro Focus Combat" },
                        { name: "Cartograph", title: "El Explorador", icon: Map, color: "text-emerald-400", bg: "bg-emerald-400/20", border: "border-emerald-400/40", lore: "The lands stretch far. Where will your party wander today?", tech: "Open world to explore" },
                        { name: "Notifus", title: "El Heraldo", icon: Users, color: "text-indigo-400", bg: "bg-indigo-400/20", border: "border-indigo-400/40", lore: "Bonds of fellowship forge the strongest armor.", tech: "Party & Guilds" },
                        { name: "Patchsmith", title: "El Forjador", icon: Hammer, color: "text-amber-400", bg: "bg-amber-400/20", border: "border-amber-400/40", lore: "Give me the blueprints, and we shall build this world together.", tech: "Collaborative Pixel Studio" },
                        { name: "Matriarch", title: "La Protectora", icon: Heart, color: "text-pink-400", bg: "bg-pink-400/20", border: "border-pink-400/40", lore: "Every lineage has its heroes. Let them all rise.", tech: "Multi-profile for families" },
                    ].map((g, i) => (
                        <Reveal key={g.name} delay={i * 100}>
                            <div className="relative flex flex-col items-center group cursor-default">
                                {/* Hover Dialogue (Pixel Bubble) */}
                                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-4 transition-all duration-300 z-50">
                                    <div className="pixel-bubble animate-float text-center shadow-2xl relative">
                                        <div className="bubble-body whitespace-normal text-xs text-[#2a2a2a] p-3 font-heading font-bold italic">
                                            "{g.lore}"
                                        </div>
                                        {/* Tail */}
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[#2a2a2a] text-xl leading-none -rotate-90 drop-shadow-[2px_0_0_rgba(0,0,0,0.5)]">◀</div>
                                    </div>
                                </div>

                                {/* The Magic Card */}
                                <div className="w-full max-w-[240px] aspect-[3/4] bg-rpg-panel border-[6px] border-rpg-panelLight rounded-2xl flex flex-col items-center justify-center p-6 relative z-10 transition-transform duration-300 shadow-[10px_10px_0_rgba(0,0,0,0.4)] group-hover:-translate-y-3 group-hover:border-rpg-gold group-hover:shadow-[15px_15px_0_rgba(253,223,140,0.2)]">
                                    <div className={`absolute inset-0 rounded-xl ${g.bg} opacity-20 group-hover:animate-pulse`}></div>
                                    
                                    <g.icon size={48} className={`${g.color} relative z-10 mb-6 drop-shadow-lg group-hover:text-rpg-gold transition-colors`} />
                                    
                                    <h3 className="text-2xl font-landing font-bold text-white mb-1 text-center relative z-10 group-hover:text-rpg-gold transition-colors">{g.name}</h3>
                                    <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-4 text-center relative z-10">{g.title}</div>

                                    {/* Tech translation */}
                                    <div className="mt-auto text-center w-full relative z-10">
                                        <span className="text-sm text-gray-400 font-bold font-sans border-t-2 border-rpg-panelLight pt-3 block w-full group-hover:text-white transition-colors">
                                            {g.tech}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* Divider */}
            <div className="relative z-10 container mx-auto px-6"><div className="landing-divider max-w-4xl mx-auto"></div></div>

            {/* PIXEL STUDIO — Collaborative */}
            <section className="relative z-10 container mx-auto px-6 py-20">
                <div className="max-w-6xl mx-auto">
                    <Reveal>
                        <div className="grid lg:grid-cols-2 gap-10 items-center bg-rpg-panel border-4 border-rpg-panelLight rounded-xl p-8 md:p-12 relative overflow-hidden shadow-[16px_16px_0_rgba(0,0,0,0.4)]">
                            <div className="absolute inset-0 landing-pixel-grid opacity-30 pointer-events-none"></div>
                            <div className="absolute -top-32 -right-32 w-96 h-96 bg-rpg-gold/10 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rpg-gold/10 border border-rpg-gold/30 text-rpg-gold text-[10px] font-bold uppercase tracking-widest mb-4">
                                    <Hammer size={10}/> Built with the community
                                </div>
                                <h2 className="text-3xl md:text-4xl font-landing font-bold mb-4 text-white leading-tight">
                                    The world of Taskoria <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-rpg-gold to-amber-600">is built by you</span>.
                                </h2>
                                <p className="text-gray-300 leading-relaxed mb-6">
                                    Open the <strong className="text-white">Pixel Studio</strong> inside the game and design houses, castles, mounts, trees and decorations pixel by pixel. This gamified productivity tool lets you craft your environment. Upload a reference image, trace with adjustable opacity, use Taskoria's palette. When you're done, hit publish and it goes to moderation.
                                </p>
                                <ul className="space-y-2 text-sm text-gray-300 mb-6">
                                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-400 flex-shrink-0"/> 6 categories: houses, castles, mounts, trees, decoration, props.</li>
                                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-400 flex-shrink-0"/> Editor with palette, free color, undo/redo, bucket, eyedropper.</li>
                                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-400 flex-shrink-0"/> Approved creations live on the map forever.</li>
                                </ul>
                                <button
                                    onClick={() => onGoToLogin?.()}
                                    className="inline-flex items-center gap-2 bg-rpg-gold text-rpg-panel border-b-[4px] border-yellow-600 active:border-b-0 active:translate-y-[4px] font-heading hover:bg-yellow-400 px-7 py-3 rounded-xl uppercase tracking-widest text-sm transition-all group font-bold mt-2"
                                >
                                    <Hammer size={16}/> Enter the Pixel Studio
                                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                                </button>
                            </div>

                            {/* Interactive Town Builder */}
                            <InteractiveBuilder />
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* Divider */}
            <div className="relative z-10 container mx-auto px-6"><div className="landing-divider max-w-4xl mx-auto"></div></div>

            {/* FINAL CTA + WAITLIST */}
            <section ref={waitlistRef} className="relative z-10 container mx-auto px-6 py-24">
                <Reveal>
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-block text-[11px] uppercase tracking-widest font-bold text-rpg-gold mb-3">Closed Beta</div>
                        <h2 className="text-4xl md:text-5xl font-landing font-bold mb-4 text-white leading-tight">
                            Ready to start your <span className="text-rpg-gold">first quest</span>?
                        </h2>
                        <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                            Drop your email below. Your hero credentials arrive by mail in seconds — no waiting, no callbacks. Then log in and start your first quest.
                        </p>

                        <div className="relative max-w-xl mx-auto">
                            <form onSubmit={handleJoinWaitlist} className="relative bg-rpg-panel border-4 border-rpg-panelLight p-2 rounded-xl flex flex-col sm:flex-row gap-2 shadow-[8px_8px_0_rgba(0,0,0,0.4)]">
                                <input
                                    type="email"
                                    required
                                    placeholder="Your email to join the beta"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={status === 'loading' || status === 'success'}
                                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 px-4 py-3 focus:ring-0 text-center sm:text-left"
                                />
                                <button
                                    type="submit"
                                    disabled={status === 'loading' || status === 'success'}
                                    className={`relative bg-rpg-gold text-rpg-panel border-b-[4px] border-yellow-600 active:border-b-0 active:translate-y-[4px] font-heading hover:bg-yellow-400 px-6 py-3 rounded-lg uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 group font-bold ${status === 'success' ? 'bg-green-500 border-green-700 text-white' : ''}`}
                                >
                                    {status === 'loading' ? <Loader2 size={18} className="animate-spin"/> :
                                     status === 'success' ? <CheckCircle2 size={18}/> :
                                     <>Sign me up <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/></>}
                                </button>
                            </form>
                            <div className={`mt-4 overflow-hidden transition-all duration-300 ${message ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className={`text-sm font-bold p-3 rounded-xl border backdrop-blur-sm ${status === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                                    {message}
                                </div>
                                {status === 'success' && (
                                    <button
                                        onClick={() => onGoToLogin?.()}
                                        className="mt-3 w-full bg-rpg-gold text-rpg-panel border-b-[4px] border-yellow-600 active:border-b-0 active:translate-y-[4px] hover:bg-yellow-400 px-6 py-3 rounded-lg uppercase tracking-widest text-sm font-heading font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        <Sword size={16}/> Sign in now
                                        <ChevronRight size={16}/>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-4 gap-3 max-w-2xl mx-auto text-center">
                            <SmallStat icon={Trophy} value="14" label="Playable classes"/>
                            <SmallStat icon={Heart} value="10" label="Companion pets"/>
                            <SmallStat icon={Map} value="5" label="Open-world maps"/>
                            <SmallStat icon={Hammer} value="∞" label="Community creations"/>
                        </div>
                    </div>
                </Reveal>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/10 bg-rpg-panelDark/80 backdrop-blur-sm py-8 mt-12">
                <div className="container mx-auto px-6 text-center text-sm text-gray-500 font-heading">
                    <p className="mb-4 text-gray-400 tracking-wider uppercase text-xs">Taskoria © {new Date().getFullYear()}</p>
                    <div className="flex justify-center gap-6">
                        <button onClick={onGoToTerms} className="hover:text-rpg-gold transition-colors block cursor-pointer text-xs uppercase tracking-widest">Terms of Service</button>
                        <button onClick={onGoToLegal} className="hover:text-rpg-gold transition-colors block cursor-pointer text-xs uppercase tracking-widest">Legal Notice</button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const GalleryRealCard = ({ title, cat, children }) => (
    <div className="bg-[#1a1322] border-4 border-rpg-panelLight rounded-xl p-3 flex flex-col items-center shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
        <div className="w-full aspect-square bg-rpg-panel rounded flex items-center justify-center overflow-hidden border-2 border-rpg-panelLight">
            {children}
        </div>
        <div className="mt-2 text-xs font-bold text-white truncate w-full text-center">{title}</div>
        <div className="text-[9px] uppercase tracking-widest text-rpg-gold">{cat}</div>
    </div>
);

const GalleryPropCard = ({ title, cat, name, scale = 1 }) => {
    const prop = WORLD_PROPS[name];
    if (!prop) return null;
    const dw = prop.w * scale;
    const dh = prop.h * scale;
    return (
        <div className="bg-[#1a1322] border-4 border-rpg-panelLight rounded-xl p-3 flex flex-col items-center shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
            <div className="w-full aspect-square bg-rpg-panel rounded flex items-end justify-center overflow-hidden border-2 border-rpg-panelLight">
                <div style={{ position: 'relative', width: dw, height: dh }}>
                    <WorldSprite name={name} x={dw / 2} y={dh} scale={scale} shadow={false} />
                </div>
            </div>
            <div className="mt-2 text-xs font-bold text-white truncate w-full text-center">{title}</div>
            <div className="text-[9px] uppercase tracking-widest text-rpg-gold">{cat}</div>
        </div>
    );
};

const SmallStat = ({ icon: Icon, value, label }) => (
    <div className="flex flex-col items-center gap-1 bg-rpg-panel border-4 border-rpg-panelLight rounded-xl p-3 shadow-[4px_4px_0_rgba(0,0,0,0.4)]">
        <Icon size={20} className="text-rpg-gold"/>
        <div className="text-3xl font-pixel text-white leading-none">{value}</div>
        <div className="text-[9px] uppercase tracking-widest text-gray-500">{label}</div>
    </div>
);

export default LandingPage;
