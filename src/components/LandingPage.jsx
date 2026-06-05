import React, { useState, useEffect, useRef } from 'react';
import {
    Sword, Shield, Scroll, Users, CheckCircle2, ChevronRight, Loader2, Crown, Hammer,
    Sparkles, Map, Timer, Heart, Target, Trophy, Flame, Star, Zap, BookOpen
} from 'lucide-react';
import ModernPixelAvatar from './common/ModernPixelAvatar';
import ModernPixelPet from './common/ModernPixelPet';

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
            <div className="relative bg-[#0a0514] border-2 border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
                <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5 bg-black/40">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/70"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/70"></div>
                    <div className="ml-2 text-[9px] uppercase tracking-widest text-gray-500 font-mono">taskoria.app/camp</div>
                </div>

                <div className="grid grid-cols-12 gap-2 p-3 bg-gradient-to-b from-[#130f1e] to-[#0a0514]">
                    {/* Avatar + stats */}
                    <div className="col-span-5 bg-black/40 border border-white/10 rounded-lg p-3 flex flex-col items-center">
                        <div className="flex items-end gap-1 mb-2 h-20">
                            <ModernPixelAvatar type="wizard" scale={1.2} />
                            <ModernPixelPet type="dragon" scale={0.45} />
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-rpg-gold">Lvl 7 · Mage</div>
                        <div className="w-full mt-2 space-y-1">
                            <StatBar label="HP" value={82} color="bg-rose-500" />
                            <StatBar label="MP" value={64} color="bg-blue-500" />
                            <StatBar label="XP" value={45} color="bg-rpg-gold" />
                        </div>
                    </div>

                    {/* Quest list */}
                    <div className="col-span-7 bg-black/40 border border-white/10 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-rpg-gold">Quest log</div>
                            <div className="text-[9px] text-gray-500 font-mono">3 / 5</div>
                        </div>
                        <ul className="space-y-1.5 text-[11px]">
                            <QuestItem checked label="Run 5km outdoors" reward="+30 XP" />
                            <QuestItem checked label="Read 20 pages" reward="+15 XP" />
                            <QuestItem checked label="Close sprint tickets" reward="+50 XP" />
                            <QuestItem label="Study English" reward="+25 XP" />
                            <QuestItem label="Meditate 10 min" reward="+10 XP" />
                        </ul>
                    </div>

                    {/* Mini world map */}
                    <div className="col-span-12 bg-black/40 border border-white/10 rounded-lg p-2">
                        <div className="flex items-center justify-between mb-1.5 px-1">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-rpg-gold flex items-center gap-1"><Map size={10}/> Town Square</div>
                            <div className="text-[9px] text-gray-500 font-mono">3 heroes online</div>
                        </div>
                        <div className="relative aspect-[16/7] rounded overflow-hidden border border-white/5"
                             style={{
                                 backgroundImage: `
                                   radial-gradient(circle at 25% 60%, rgba(34,197,94,0.25), transparent 40%),
                                   radial-gradient(circle at 75% 40%, rgba(99,102,241,0.25), transparent 40%),
                                   linear-gradient(180deg, #1b3a2a 0%, #2a2540 100%)
                                 `,
                                 backgroundSize: 'cover',
                             }}>
                            {/* Path */}
                            <div className="absolute top-1/2 left-0 right-0 h-3 -translate-y-1/2 bg-amber-900/30"></div>
                            {/* Trees */}
                            <Tree x="10%" y="20%" />
                            <Tree x="22%" y="75%" />
                            <Tree x="80%" y="22%" />
                            <Tree x="92%" y="78%" />
                            {/* House */}
                            <House x="48%" y="20%" />
                            {/* Player dot */}
                            <div className="absolute w-2 h-2 bg-rpg-gold rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" style={{ top: '52%', left: '40%' }}></div>
                            <div className="absolute w-2 h-2 bg-emerald-400 rounded-full" style={{ top: '54%', left: '62%' }}></div>
                            <div className="absolute w-2 h-2 bg-blue-400 rounded-full" style={{ top: '48%', left: '76%' }}></div>
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
            <div className={`h-full ${color}`} style={{ width: `${value}%` }}></div>
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

const Tree = ({ x, y }) => (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y }}>
        <div className="w-4 h-4 bg-emerald-700 rounded-full"></div>
        <div className="w-1 h-1.5 bg-amber-900 mx-auto"></div>
    </div>
);

const House = ({ x, y }) => (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y }}>
        <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[8px] border-l-transparent border-r-transparent border-b-red-700 mx-auto"></div>
        <div className="w-5 h-3.5 bg-amber-800 border border-amber-950"></div>
    </div>
);

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
                setMessage(data.message || 'Welcome to the party! We\'ll let you know as soon as a slot opens up.');
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
        <div className="min-h-screen bg-[#0a0514] text-white overflow-x-hidden font-sans selection:bg-rpg-gold selection:text-black">
            {/* Animated background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0a0514] to-[#0a0514] transition-transform duration-700 ease-out" style={parallaxBg1}></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-900/40 blur-[120px] rounded-full transition-transform duration-700 ease-out" style={parallaxBg2}></div>
                <div className="absolute top-[30%] -right-[10%] w-[40%] h-[60%] bg-amber-900/20 blur-[150px] rounded-full transition-transform duration-1000 ease-out" style={parallaxBg1}></div>
                <div className="absolute top-[80%] left-[20%] w-[30%] h-[40%] bg-purple-900/30 blur-[150px] rounded-full transition-transform duration-500 ease-out" style={parallaxBg2}></div>
            </div>

            {/* Navbar */}
            <nav className={`fixed top-0 w-full z-50 flex items-center justify-between px-6 py-4 md:px-12 md:py-5 border-b transition-all duration-300 ${scrollPosition > 50 ? 'border-white/10 bg-[#0a0514]/80 backdrop-blur-xl shadow-lg' : 'border-transparent bg-transparent'}`}>
                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <img src="./logo_taskoria.svg" alt="Taskoria Logo" className="h-8 md:h-10 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)] group-hover:scale-105 transition-transform" />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={scrollToWaitlist}
                        className="hidden md:inline text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white px-4 py-2 transition-colors"
                    >Beta</button>
                    <button
                        onClick={() => onGoToLogin?.()}
                        className="relative overflow-hidden bg-rpg-gold text-[#1a102e] hover:brightness-110 text-xs md:text-sm font-bold uppercase tracking-widest px-5 md:px-6 py-2.5 rounded-full transition-all group font-heading shadow-lg"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Play Now
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-white/0 via-white/40 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
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

                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading tracking-tight mb-6 animate-[slideUpFade_0.8s_ease-out_0.1s_forwards] opacity-0 leading-[1.05]">
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
                                onClick={() => onGoToLogin?.()}
                                className="group relative overflow-hidden bg-rpg-gold text-[#1a102e] hover:brightness-110 px-7 py-3.5 rounded-xl uppercase tracking-widest text-sm font-heading font-bold transition-all shadow-[0_8px_30px_rgba(251,191,36,0.3)] flex items-center justify-center gap-2"
                            >
                                <Sword size={16}/> Start the Adventure
                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                            </button>
                            <button
                                onClick={scrollToWaitlist}
                                className="bg-white/5 hover:bg-white/10 border border-white/20 px-7 py-3.5 rounded-xl uppercase tracking-widest text-sm font-heading font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <Sparkles size={16}/> Join the Beta
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

            {/* HOW IT WORKS */}
            <section className="relative z-10 container mx-auto px-6 py-20">
                <Reveal className="text-center mb-14">
                    <div className="inline-block text-[11px] uppercase tracking-widest font-bold text-rpg-gold mb-3">How it works</div>
                    <h2 className="text-3xl md:text-5xl font-heading text-white max-w-3xl mx-auto leading-tight">
                        Three steps to turn your to-do list into an <span className="text-rpg-gold">adventure</span>.
                    </h2>
                </Reveal>

                <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {[
                        { n: '01', icon: Target, title: 'Create your quests', body: 'Log your tasks, daily habits and goals. Set difficulty and XP rewards. Everything you complete levels you up.' },
                        { n: '02', icon: Sword, title: 'Level up your hero', body: 'Pick a class (Mage, Warrior, Rogue…), customize your pixel-art avatar, equip gear, adopt pets, defeat your sprint boss.' },
                        { n: '03', icon: Map, title: 'Explore and build the world', body: 'Walk around town with your party, talk to NPCs, browse shops, and craft houses, mounts and decorations with the community that will live on the map.' },
                    ].map((step, i) => (
                        <Reveal key={step.n} delay={i * 120}>
                            <div className="relative bg-gradient-to-br from-[#1a102e]/80 to-[#0f0a1f]/80 border border-white/10 rounded-2xl p-6 h-full hover:border-rpg-gold/40 transition-all group">
                                <div className="absolute -top-3 -right-3 bg-rpg-gold text-black font-heading text-xs px-3 py-1 rounded-full shadow-lg font-bold">{step.n}</div>
                                <div className="w-12 h-12 bg-rpg-gold/15 border border-rpg-gold/30 rounded-xl flex items-center justify-center text-rpg-gold mb-4 group-hover:scale-110 transition-transform">
                                    <step.icon size={22}/>
                                </div>
                                <h3 className="text-xl font-heading text-white mb-2">{step.title}</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">{step.body}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* FEATURES */}
            <section className="relative z-10 container mx-auto px-6 py-20">
                <Reveal className="text-center mb-14">
                    <div className="inline-block text-[11px] uppercase tracking-widest font-bold text-rpg-gold mb-3">What's inside</div>
                    <h2 className="text-3xl md:text-5xl font-heading text-white max-w-3xl mx-auto leading-tight">
                        Everything you need to <span className="text-rpg-gold">not let your future self down</span>.
                    </h2>
                </Reveal>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-7xl mx-auto">
                    {[
                        { icon: Scroll, classes: 'bg-blue-500/20 text-blue-400 border-blue-500/40', halo: 'bg-blue-500/10', title: 'Habits + Tasks + Diary', body: 'Three tools in one: daily habits, task list with due dates and priorities, and personal diary. All synced with your level.' },
                        { icon: Timer, classes: 'bg-red-500/20 text-red-400 border-red-500/40', halo: 'bg-red-500/10', title: 'Pomodoro Focus Combat', body: 'Start a Pomodoro session and fight a procrastination monster. Lose focus and it strikes back. Hold the line and you defeat it.' },
                        { icon: Map, classes: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', halo: 'bg-emerald-500/10', title: 'Open world to explore', body: 'Town Square, Mystic Forest, Shadow Crypts, Taskoria Keep. Wandering NPCs. Chat with shopkeepers, open doors, meet other heroes online.' },
                        { icon: Users, classes: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40', halo: 'bg-indigo-500/10', title: 'Party & Guilds', body: 'Create a party with friends or family. Watch their progress in real time. Guilds with rankings, shared challenges and built-in chat.' },
                        { icon: Hammer, classes: 'bg-amber-500/20 text-amber-400 border-amber-500/40', halo: 'bg-amber-500/10', title: 'Collaborative Pixel Studio', body: 'Design houses, castles, mounts, trees, props… with a built-in pixel-art editor. If approved, your creation lives on the map for everyone.' },
                        { icon: Heart, classes: 'bg-pink-500/20 text-pink-400 border-pink-500/40', halo: 'bg-pink-500/10', title: 'Multi-profile for families', body: 'One login, multiple heroes. Built for families: each member with their own character, tasks and progress.' },
                    ].map((f, i) => (
                        <Reveal key={f.title} delay={i * 80}>
                            <div className="bg-[#1a102e]/70 border-2 border-white/5 p-6 hover:border-rpg-gold/40 transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden rounded-2xl h-full">
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

            {/* PIXEL STUDIO — Collaborative */}
            <section className="relative z-10 container mx-auto px-6 py-20">
                <div className="max-w-6xl mx-auto">
                    <Reveal>
                        <div className="grid lg:grid-cols-2 gap-10 items-center bg-gradient-to-br from-[#1a102e] via-[#1a102e] to-[#0a0514] border-2 border-rpg-gold/30 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-[0_0_80px_rgba(251,191,36,0.1)]">
                            <div className="absolute -top-32 -right-32 w-96 h-96 bg-rpg-gold/10 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rpg-gold/10 border border-rpg-gold/30 text-rpg-gold text-[10px] font-bold uppercase tracking-widest mb-4">
                                    <Hammer size={10}/> Built with the community
                                </div>
                                <h2 className="text-3xl md:text-4xl font-heading mb-4 text-white leading-tight">
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
                                    className="inline-flex items-center gap-2 bg-rpg-gold text-[#1a102e] font-heading hover:brightness-110 px-7 py-3.5 rounded-xl uppercase tracking-widest text-sm transition-all shadow-lg group font-bold"
                                >
                                    <Hammer size={16}/> Enter the Pixel Studio
                                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                                </button>
                            </div>

                            {/* Gallery: real characters & pets from the game */}
                            <div className="relative z-10 grid grid-cols-2 gap-3">
                                <GalleryRealCard title="Wizard" cat="Hero Class">
                                    <ModernPixelAvatar type="wizard" scale={1.1}/>
                                </GalleryRealCard>
                                <GalleryRealCard title="Paladin" cat="Hero Class">
                                    <ModernPixelAvatar type="paladin" scale={1.1}/>
                                </GalleryRealCard>
                                <GalleryRealCard title="Dragon" cat="Companion">
                                    <ModernPixelPet type="dragon" scale={0.9}/>
                                </GalleryRealCard>
                                <GalleryRealCard title="Phoenix" cat="Companion">
                                    <ModernPixelPet type="phoenix" scale={0.9}/>
                                </GalleryRealCard>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* FINAL CTA + WAITLIST */}
            <section ref={waitlistRef} className="relative z-10 container mx-auto px-6 py-24">
                <Reveal>
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-block text-[11px] uppercase tracking-widest font-bold text-rpg-gold mb-3">Closed Beta</div>
                        <h2 className="text-4xl md:text-5xl font-heading mb-4 text-white leading-tight">
                            Ready to start your <span className="text-rpg-gold">first quest</span>?
                        </h2>
                        <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                            We're in closed beta. Drop your email and we'll let you know as soon as a slot opens. Already have an invite? Jump straight in.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6 max-w-xl mx-auto">
                            <button
                                onClick={() => onGoToLogin?.()}
                                className="flex-1 bg-rpg-gold text-[#1a102e] hover:brightness-110 px-6 py-3.5 rounded-xl uppercase tracking-widest text-sm font-heading font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                <Sword size={16}/> I already have an account
                            </button>
                        </div>

                        <div className="relative max-w-xl mx-auto">
                            <div className="absolute -inset-1 bg-gradient-to-r from-rpg-gold via-amber-500 to-yellow-600 rounded-2xl blur opacity-30"></div>
                            <form onSubmit={handleJoinWaitlist} className="relative bg-[#1a102e]/80 backdrop-blur-xl border border-white/20 p-2 rounded-2xl flex flex-col sm:flex-row gap-2 shadow-[0_0_40px_rgba(251,191,36,0.15)]">
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
                                    className={`relative overflow-hidden bg-rpg-gold text-[#1a102e] font-heading hover:bg-yellow-400 px-6 py-3 rounded-xl uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 group shadow-lg font-bold ${status === 'success' ? 'bg-green-500 text-white' : ''}`}
                                >
                                    {status === 'loading' ? <Loader2 size={18} className="animate-spin"/> :
                                     status === 'success' ? <CheckCircle2 size={18}/> :
                                     <>Sign me up <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/></>}
                                </button>
                            </form>
                            <div className={`mt-4 overflow-hidden transition-all duration-300 ${message ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className={`text-sm font-bold p-3 rounded-xl border backdrop-blur-sm ${status === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                                    {message}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-3 gap-4 max-w-xl mx-auto text-center">
                            <SmallStat icon={Trophy} value="6" label="Playable classes"/>
                            <SmallStat icon={Map} value="4" label="Open maps"/>
                            <SmallStat icon={Hammer} value="∞" label="Community creations"/>
                        </div>
                    </div>
                </Reveal>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/10 bg-[#0a0514]/80 backdrop-blur-sm py-8 mt-12">
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

const SmallStat = ({ icon: Icon, value, label }) => (
    <div className="flex flex-col items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-3">
        <Icon size={16} className="text-rpg-gold"/>
        <div className="text-2xl font-heading font-bold text-white">{value}</div>
        <div className="text-[9px] uppercase tracking-widest text-gray-500">{label}</div>
    </div>
);

export default LandingPage;
