import React, { useState, useEffect, useRef } from 'react';
import {
    Sword, Shield, Scroll, Users, CheckCircle2, ChevronRight, Loader2, Crown, Hammer,
    Sparkles, Map, Timer, Heart, Target, Trophy, Flame, Star, Zap, BookOpen
} from 'lucide-react';
import ModernPixelAvatar from './common/ModernPixelAvatar';
import ModernPixelPet from './common/ModernPixelPet';
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

            {/* Browser-window chrome */}
            <div className="relative bg-rpg-panelDark border-2 border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
                <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5 bg-black/40">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/70"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/70"></div>
                    <div className="ml-2 text-[9px] uppercase tracking-widest text-gray-500 font-mono">taskoria.app/camp</div>
                </div>

                <div className="grid grid-cols-12 gap-3 p-4 bg-gradient-to-b from-rpg-panelDark to-rpg-panelDark">
                    {/* Avatar showcase — wider, taller, with character info */}
                    <div className="col-span-12 sm:col-span-6 bg-black/40 border border-white/10 rounded-lg p-5 flex flex-col">
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
                    <div className="col-span-12 sm:col-span-6 bg-black/40 border border-white/10 rounded-lg p-5 flex flex-col">
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
                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] uppercase tracking-widest">
                            <span className="text-gray-500">Daily streak</span>
                            <span className="text-rpg-gold font-bold flex items-center gap-1"><Flame size={11}/> 12 days</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* Floating "+50 XP" pip */}
            <div className="absolute -top-3 right-6 bg-rpg-gold text-black font-heading text-xs px-3 py-1 rounded-full shadow-lg animate-bounce font-bold">+50 XP</div>
        </div>
    );
};

const StatBar = ({ label, value, color }) => (
    <div className="flex items-center gap-1.5">
        <span className="text-[8px] font-bold text-gray-400 uppercase w-5">{label}</span>
        <div className="flex-1 h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
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
        <div className="min-h-screen bg-rpg-panelDark text-white overflow-x-hidden font-sans selection:bg-rpg-gold selection:text-black">
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
                    <img src="./logo_taskoria.svg" alt="Taskoria Logo" className="h-8 md:h-10 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)] group-hover:scale-105 transition-transform" />
                </button>
                <div className="flex items-center gap-2">
                    <button
                        onClick={scrollToWaitlist}
                        className="hidden md:inline text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white px-4 py-2 transition-colors"
                    >Join Beta</button>
                    <button
                        onClick={() => onGoToLogin?.()}
                        className="bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs md:text-sm font-bold uppercase tracking-widest px-5 md:px-6 py-2.5 rounded-full transition-colors group font-heading"
                    >
                        <span className="flex items-center gap-2">
                            Sign In
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                </div>
            </nav>

            {/* HERO */}
            <main className="relative z-10 container mx-auto px-6 pt-32 pb-16 md:pt-40 md:pb-24">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left: copy + CTA */}
                    <div className="text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rpg-gold/10 border border-rpg-gold/30 text-rpg-gold text-xs font-bold font-heading tracking-widest uppercase mb-6 animate-[slideUpFade_0.8s_ease-out_forwards] opacity-0">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rpg-gold opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
                            </span>
                            Closed Beta · Limited slots
                        </div>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-landing font-extrabold tracking-tight mb-6 animate-[slideUpFade_0.8s_ease-out_0.1s_forwards] opacity-0 leading-[1.05]">
                            Turn your day into an{' '}
                            <span className="relative inline-block">
                                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-rpg-gold to-amber-600">RPG adventure</span>
                                <span className="absolute inset-0 bg-rpg-gold blur-3xl opacity-20 -z-10 rounded-full"></span>
                            </span>.
                        </h1>

                        <p className="text-lg md:text-xl text-gray-300 max-w-xl mx-auto lg:mx-0 mb-8 animate-[slideUpFade_0.8s_ease-out_0.2s_forwards] opacity-0 leading-relaxed">
                            Taskoria is a habits &amp; tasks app with a real pixel-art world: complete quests, level up, explore a town with your party, and <strong className="text-white">build the game world together</strong> with the whole community.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start animate-[slideUpFade_0.8s_ease-out_0.3s_forwards] opacity-0">
                            <button
                                onClick={scrollToWaitlist}
                                className="group relative overflow-hidden bg-rpg-gold text-rpg-panel hover:brightness-110 px-7 py-3.5 rounded-xl uppercase tracking-widest text-sm font-heading font-bold transition-all shadow-[0_8px_30px_rgba(251,191,36,0.3)] flex items-center justify-center gap-2"
                            >
                                <Sword size={16}/> Start the Adventure
                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                            </button>
                            <button
                                onClick={() => onGoToLogin?.()}
                                className="bg-white/5 hover:bg-white/10 border border-white/20 px-7 py-3.5 rounded-xl uppercase tracking-widest text-sm font-heading font-bold transition-all flex items-center justify-center gap-2"
                            >
                                I already have an account
                                <ChevronRight size={16} className="opacity-60"/>
                            </button>
                        </div>

                        <div className="mt-8 flex items-center gap-6 justify-center lg:justify-start text-[11px] uppercase tracking-widest text-gray-500 animate-[slideUpFade_0.8s_ease-out_0.4s_forwards] opacity-0">
                            <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-green-400"/> Free in beta</span>
                            <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-green-400"/> No ads</span>
                            <span className="flex items-center gap-1.5 hidden sm:inline-flex"><CheckCircle2 size={12} className="text-green-400"/> PWA · Mobile + web</span>
                        </div>
                    </div>

                    {/* Right: mockup */}
                    <div className="animate-[zoomInFade_1s_ease-out_0.4s_forwards] opacity-0">
                        <HeroMockup/>
                    </div>
                </div>
            </main>

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
                            { icon: Target, title: 'Create your quests', body: 'Log your tasks, daily habits and goals. Set difficulty and XP rewards. Everything you complete levels you up.' },
                            { icon: Sword, title: 'Level up your hero', body: 'Pick a class (Mage, Warrior, Rogue…), customize your pixel-art avatar, equip gear, adopt pets, defeat your sprint boss.' },
                            { icon: Map, title: 'Explore and build the world', body: 'Walk around town with your party, talk to NPCs, browse shops, and craft houses, mounts and decorations with the community that will live on the map.' },
                        ].map((step, i) => (
                            <Reveal key={step.title} delay={i * 150}>
                                <div className="relative flex flex-col items-center text-center group">
                                    {/* Quest waypoint marker */}
                                    <div className="relative z-10 w-[72px] h-[72px] bg-rpg-panel border-2 border-rpg-gold/50 rounded-2xl flex items-center justify-center text-rpg-gold mb-5 shadow-[0_0_20px_rgba(251,191,36,0.15)] group-hover:border-rpg-gold group-hover:shadow-[0_0_30px_rgba(251,191,36,0.25)] transition-all">
                                        <step.icon size={28}/>
                                    </div>
                                    <h3 className="text-xl font-heading text-white mb-2">{step.title}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed max-w-xs">{step.body}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Divider */}
            <div className="relative z-10 container mx-auto px-6"><div className="landing-divider max-w-4xl mx-auto"></div></div>

            {/* FEATURES */}
            <section className="relative z-10 container mx-auto px-6 py-20">
                <Reveal className="text-center mb-14">
                    <div className="inline-block text-[11px] uppercase tracking-widest font-bold text-rpg-gold mb-3">What's inside</div>
                    <h2 className="text-3xl md:text-5xl font-landing font-bold text-white max-w-3xl mx-auto leading-tight">
                        Everything you need to <span className="text-rpg-gold">not let your future self down</span>.
                    </h2>
                </Reveal>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-7xl mx-auto">
                    {[
                        { icon: Scroll, classes: 'bg-blue-500/20 text-blue-400 border-blue-500/40', halo: 'bg-blue-500/10', accent: '#60a5fa', title: 'Habits + Tasks + Diary', body: 'Three tools in one: daily habits, task list with due dates and priorities, and personal diary. All synced with your level.' },
                        { icon: Timer, classes: 'bg-red-500/20 text-red-400 border-red-500/40', halo: 'bg-red-500/10', accent: '#f87171', title: 'Pomodoro Focus Combat', body: 'Start a Pomodoro session and fight a procrastination monster. Lose focus and it strikes back. Hold the line and you defeat it.' },
                        { icon: Map, classes: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', halo: 'bg-emerald-500/10', accent: '#34d399', title: 'Open world to explore', body: 'Town Square, Mystic Forest, Shadow Crypts, Taskoria Keep. Wandering NPCs. Chat with shopkeepers, open doors, meet other heroes online.' },
                        { icon: Users, classes: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40', halo: 'bg-indigo-500/10', accent: '#818cf8', title: 'Party & Guilds', body: 'Create a party with friends or family. Watch their progress in real time. Guilds with rankings, shared challenges and built-in chat.' },
                        { icon: Hammer, classes: 'bg-amber-500/20 text-amber-400 border-amber-500/40', halo: 'bg-amber-500/10', accent: '#fbbf24', title: 'Collaborative Pixel Studio', body: 'Design houses, castles, mounts, trees, props… with a built-in pixel-art editor. If approved, your creation lives on the map for everyone.' },
                        { icon: Heart, classes: 'bg-pink-500/20 text-pink-400 border-pink-500/40', halo: 'bg-pink-500/10', accent: '#f472b6', title: 'Multi-profile for families', body: 'One login, multiple heroes. Built for families: each member with their own character, tasks and progress.' },
                    ].map((f, i) => (
                        <Reveal key={f.title} delay={i * 80}>
                            <div className="feature-accent-top bg-rpg-panel/70 border-2 border-white/5 p-6 hover:border-rpg-gold/40 transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden rounded-2xl h-full" style={{'--accent-color': f.accent}}>
                                <div className={`absolute top-0 right-0 w-32 h-32 ${f.halo} rounded-bl-full translate-x-12 -translate-y-12 transition-colors`}></div>
                                <div className={`w-12 h-12 ${f.classes} rounded-xl flex items-center justify-center mb-4 border relative z-10`}>
                                    <f.icon size={22}/>
                                </div>
                                <h3 className="text-lg font-heading mb-2 text-white relative z-10">{f.title}</h3>
                                <p className="text-sm text-gray-400 leading-relaxed relative z-10">{f.body}</p>
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
                        <div className="grid lg:grid-cols-2 gap-10 items-center bg-gradient-to-br from-rpg-panel via-rpg-panel to-rpg-panelDark border-2 border-rpg-gold/30 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-[0_0_80px_rgba(251,191,36,0.1)]">
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
                                    Open the <strong className="text-white">Pixel Studio</strong> inside the game and design houses, castles, mounts, trees and decorations pixel by pixel. Upload a reference image, trace with adjustable opacity, use Taskoria's palette. When you're done, hit publish and it goes to moderation.
                                </p>
                                <ul className="space-y-2 text-sm text-gray-300 mb-6">
                                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-400 flex-shrink-0"/> 6 categories: houses, castles, mounts, trees, decoration, props.</li>
                                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-400 flex-shrink-0"/> Editor with palette, free color, undo/redo, bucket, eyedropper.</li>
                                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-400 flex-shrink-0"/> Approved creations live on the map forever.</li>
                                </ul>
                                <button
                                    onClick={() => onGoToLogin?.()}
                                    className="inline-flex items-center gap-2 bg-rpg-gold text-rpg-panel font-heading hover:brightness-110 px-7 py-3.5 rounded-xl uppercase tracking-widest text-sm transition-all shadow-lg group font-bold"
                                >
                                    <Hammer size={16}/> Enter the Pixel Studio
                                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                                </button>
                            </div>

                            {/* Gallery: real characters, pets & world props from the game */}
                            <div className="relative z-10 grid grid-cols-3 gap-3">
                                <GalleryRealCard title="Wizard" cat="Hero Class">
                                    <ModernPixelAvatar type="wizard" scale={1.0}/>
                                </GalleryRealCard>
                                <GalleryRealCard title="Paladin" cat="Hero Class">
                                    <ModernPixelAvatar type="paladin" scale={1.0}/>
                                </GalleryRealCard>
                                <GalleryRealCard title="Rogue" cat="Hero Class">
                                    <ModernPixelAvatar type="rogue" scale={1.0}/>
                                </GalleryRealCard>
                                <GalleryRealCard title="Dragon" cat="Companion">
                                    <ModernPixelPet type="dragon" scale={1.4}/>
                                </GalleryRealCard>
                                <GalleryRealCard title="Lion" cat="Companion">
                                    <ModernPixelPet type="lion" scale={1.4}/>
                                </GalleryRealCard>
                                <GalleryRealCard title="Wolf" cat="Companion">
                                    <ModernPixelPet type="wolf" scale={1.4}/>
                                </GalleryRealCard>
                                <GalleryPropCard title="Oak Tree" cat="World Prop" name="oak_tree" scale={1.0}/>
                                <GalleryPropCard title="Stone Well" cat="World Prop" name="well" scale={1.2}/>
                                <GalleryPropCard title="Iron Lamp" cat="World Prop" name="lamp" scale={1.4}/>
                            </div>
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
                            <div className="absolute -inset-1 bg-gradient-to-r from-rpg-gold via-amber-500 to-yellow-600 rounded-2xl blur opacity-30"></div>
                            <form onSubmit={handleJoinWaitlist} className="relative bg-rpg-panel/80 backdrop-blur-xl border border-white/20 p-2 rounded-2xl flex flex-col sm:flex-row gap-2 shadow-[0_0_40px_rgba(251,191,36,0.15)]">
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
                                    className={`relative overflow-hidden bg-rpg-gold text-rpg-panel font-heading hover:bg-yellow-400 px-6 py-3 rounded-xl uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 group shadow-lg font-bold ${status === 'success' ? 'bg-green-500 text-white' : ''}`}
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
                                        className="mt-3 w-full bg-rpg-gold text-rpg-panel hover:brightness-110 px-6 py-3 rounded-xl uppercase tracking-widest text-sm font-heading font-bold transition-all shadow-lg flex items-center justify-center gap-2"
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
    <div className="bg-[#0f0a1f] border border-white/10 rounded-xl p-3 flex flex-col items-center hover:border-rpg-gold/40 transition-colors">
        <div className="w-full aspect-square bg-black/40 rounded p-2 flex items-center justify-center overflow-hidden">
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
        <div className="bg-[#0f0a1f] border border-white/10 rounded-xl p-3 flex flex-col items-center hover:border-rpg-gold/40 transition-colors">
            <div className="w-full aspect-square bg-gradient-to-b from-[#1a1530] to-rpg-panelDark rounded p-2 flex items-end justify-center overflow-hidden">
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
    <div className="flex flex-col items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-3">
        <Icon size={16} className="text-rpg-gold"/>
        <div className="text-3xl font-pixel text-white leading-none">{value}</div>
        <div className="text-[9px] uppercase tracking-widest text-gray-500">{label}</div>
    </div>
);

export default LandingPage;
