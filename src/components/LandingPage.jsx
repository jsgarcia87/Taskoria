import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import {
    Sword, Shield, Scroll, Users, CheckCircle2, ChevronRight, Loader2, Crown, Hammer,
    Sparkles, Map, Timer, Heart, Target, Trophy, Flame, Star, Zap, BookOpen, TreePine, Castle, Eraser, Square,
    ChevronDown, ArrowLeft, Calendar, Clock, ChevronLeft
} from 'lucide-react';
import BLOG_POSTS from '../data/blogPosts';
import ModernPixelAvatar from './common/ModernPixelAvatar';
import ModernPixelPet from './common/ModernPixelPet';
import LoreScroll from './common/LoreScroll';

const CastleScene = lazy(() => import('./landing/CastleScene'));

const LoadingScreen = ({ onReady }) => {
    const [progress, setProgress] = useState(0);
    const [fading, setFading] = useState(false);

    useEffect(() => {
        let raf;
        let start = null;
        const duration = 1800;
        const tick = (ts) => {
            if (!start) start = ts;
            const elapsed = ts - start;
            const p = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setProgress(Math.round(eased * 100));
            if (p < 1) {
                raf = requestAnimationFrame(tick);
            } else {
                setFading(true);
                setTimeout(() => onReady(), 500);
            }
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [onReady]);

    return (
        <div className={`fixed inset-0 z-[200] bg-rpg-bg flex flex-col items-center justify-center transition-opacity duration-500 ${fading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <img src="./icono_taskoria_white.png" alt="" className="w-16 h-16 mb-8 drop-shadow-[0_0_20px_rgba(253,223,140,0.5)]" />
            <div className="w-48 h-2 bg-rpg-panelDark rounded-full overflow-hidden border border-rpg-panelLight">
                <div
                    className="h-full bg-rpg-gold rounded-full transition-[width] duration-100 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-gray-500 font-heading">
                Entering the kingdom...
            </p>
        </div>
    );
};

const FAQAccordionItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-rpg-panelLight/30 last:border-b-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-4 py-5 px-1 text-left group cursor-pointer"
            >
                <span className="font-heading font-bold text-sm md:text-base text-white group-hover:text-rpg-gold transition-colors">{question}</span>
                <ChevronDown size={18} className={`text-rpg-gold flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-60 opacity-100 pb-5' : 'max-h-0 opacity-0'}`}>
                <p className="text-sm text-gray-400 leading-relaxed px-1">{answer}</p>
            </div>
        </div>
    );
};

const FAQParchmentItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-[rgba(90,55,20,0.15)] last:border-b-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-4 py-4 px-1 text-left group cursor-pointer"
            >
                <span className="font-heading font-bold text-sm md:text-base text-[#3a2818] group-hover:text-[#b8802e] transition-colors">{question}</span>
                <ChevronDown size={16} className={`text-[#b8802e] flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-60 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
                <p className="text-sm text-[#5a4a38] leading-relaxed px-1">{answer}</p>
            </div>
        </div>
    );
};

const GUARDIANS = [
    { name: 'Ledgar',     title: 'The Chronicler',  color: '#6699ff', lore: 'I record every deed, lest they fade into the void.',            tech: 'Habits, Tasks & Diary' },
    { name: 'Chronos',    title: 'The Timekeeper',  color: '#ff5544', lore: 'Time is a monster. Slay it, or let it consume you.',            tech: 'Pomodoro Focus Combat' },
    { name: 'Cartograph', title: 'The Explorer',    color: '#44cc88', lore: 'The lands stretch far. Where will your party wander today?',    tech: 'Open world to explore' },
    { name: 'Notifus',    title: 'The Herald',      color: '#8866dd', lore: 'Bonds of fellowship forge the strongest armor.',                tech: 'Party & Guilds' },
    { name: 'Patchsmith', title: 'The Forgemaster', color: '#ffaa33', lore: 'Give me the blueprints, and we shall build this world together.', tech: 'Collaborative Pixel Studio' },
    { name: 'Matriarch',  title: 'The Protector',   color: '#ff6699', lore: 'Every lineage has its heroes. Let them all rise.',              tech: 'Multi-profile for families' },
];

const FAQ_DATA = [
    {
        q: 'What is Taskoria?',
        a: 'Taskoria is a task manager that turns your daily to-dos into RPG quests. Complete tasks to earn XP, level up your hero, unlock companions, and explore a pixel-art open world — all while staying productive.',
    },
    {
        q: 'Is Taskoria free?',
        a: 'Yes! During the closed beta, Taskoria is completely free. Founding citizens get early access to all 5 maps, exclusive badges, and will keep any special perks when we launch.',
    },
    {
        q: 'How does the gamification work?',
        a: 'Every task you create becomes a quest. Completing quests earns XP and gold. You level up your character, unlock new classes, adopt pets, and build your town — real productivity drives real in-game progress.',
    },
    {
        q: 'Can I use it as a serious task manager?',
        a: 'Absolutely. Taskoria is a utility-first app: task lists, deadlines, priorities, and habits are all front and center. The RPG layer is designed to motivate, never to get in the way.',
    },
    {
        q: 'What platforms does it support?',
        a: 'Taskoria works in any modern browser on desktop and mobile. It\'s a Progressive Web App (PWA), so you can install it on your phone\'s home screen for a native-like experience.',
    },
    {
        q: 'When does the beta launch?',
        a: 'We\'re onboarding founding citizens right now. Join the waitlist above to secure your spot — early access invitations go out in waves.',
    },
];

const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const CATEGORY_COLORS = {
    Announcements: 'bg-rpg-gold/20 text-rpg-gold border-rpg-gold/30',
    Productivity: 'bg-blue-400/20 text-blue-400 border-blue-400/30',
    Features: 'bg-emerald-400/20 text-emerald-400 border-emerald-400/30',
};

const BlogCard = ({ post, onClick }) => (
    <button
        onClick={() => onClick(post.slug)}
        className="group text-left w-full cursor-pointer"
    >
        <div className="relative bg-rpg-panel/50 border border-rpg-panelLight/30 rounded-sm p-6 transition-all duration-300 hover:border-rpg-gold/30 hover:bg-rpg-panel/70">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-rpg-gold/20 to-transparent" />
            <div className="flex items-center gap-2 mb-4">
                <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm border ${CATEGORY_COLORS[post.category] || 'bg-white/10 text-white border-white/20'}`}>
                    {post.category}
                </span>
                <span className="text-gray-600 text-[8px]">◆</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{formatDate(post.date)}</span>
            </div>
            <h3 className="font-heading font-bold text-white text-lg mb-3 group-hover:text-rpg-gold transition-colors leading-snug">
                {post.title}
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed line-clamp-3 mb-5">
                <span className="chronicle-initial">{post.excerpt.charAt(0)}</span>
                {post.excerpt.slice(1)}
            </p>
            <span className="inline-flex items-center gap-1.5 text-[10px] text-rpg-gold/40 uppercase tracking-widest font-bold group-hover:text-rpg-gold transition-colors">
                Continue reading <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-rpg-panelLight/15 to-transparent" />
        </div>
    </button>
);

const BlogListView = ({ onSelectPost, onBack }) => (
    <div className="min-h-screen bg-rpg-bg pt-24 pb-16">
        <div className="container mx-auto px-6">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-400 hover:text-rpg-gold transition-colors mb-8 text-sm font-bold uppercase tracking-widest cursor-pointer"
            >
                <ChevronLeft size={16} /> Back to Home
            </button>
            <div className="text-center mb-14">
                <div className="chronicle-divider mb-6">❧</div>
                <h1 className="text-3xl md:text-4xl font-landing font-bold text-white mb-3">The Chronicle</h1>
                <p className="text-gray-500 max-w-md mx-auto text-sm">Dispatches from the Archive Council. Every entry, a chapter in Taskoria's unfolding story.</p>
                <div className="chronicle-divider mt-6">◆ ◆ ◆</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {BLOG_POSTS.map(post => (
                    <BlogCard key={post.slug} post={post} onClick={onSelectPost} />
                ))}
            </div>
        </div>
    </div>
);

const BlogPostView = ({ slug, onBack, onBackToList }) => {
    const post = BLOG_POSTS.find(p => p.slug === slug);
    if (!post) return null;

    useEffect(() => { window.scrollTo(0, 0); }, [slug]);

    return (
        <div className="min-h-screen bg-rpg-bg pt-24 pb-16">
            <div className="container mx-auto px-6">
                <button
                    onClick={onBackToList}
                    className="flex items-center gap-2 text-gray-400 hover:text-rpg-gold transition-colors mb-8 text-sm font-bold uppercase tracking-widest cursor-pointer"
                >
                    <ChevronLeft size={16} /> All Chronicles
                </button>

                <article className="max-w-2xl mx-auto">
                    <div className="text-center mb-10">
                        <div className="chronicle-divider mb-6">❧</div>
                        <span className={`text-[9px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-sm border ${CATEGORY_COLORS[post.category] || 'bg-white/10 text-white border-white/20'}`}>
                            {post.category}
                        </span>
                    </div>

                    <h1 className="text-2xl md:text-4xl font-landing font-bold text-white mb-4 leading-tight text-center">{post.title}</h1>

                    <div className="flex items-center justify-center gap-4 text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-6">
                        <span className="flex items-center gap-1.5"><Calendar size={12} /> {formatDate(post.date)}</span>
                        <span className="text-gray-600 text-[8px]">◆</span>
                        <span className="flex items-center gap-1.5"><Clock size={12} /> {post.readTime}</span>
                    </div>

                    <div className="chronicle-divider mb-10">◆ ◆ ◆</div>

                    <div className="space-y-5">
                        {post.content.map((block, i) => {
                            if (block.type === 'heading') {
                                return <h2 key={i} className="chronicle-heading text-xl md:text-2xl font-heading font-bold text-rpg-gold mt-10 mb-3">{block.text}</h2>;
                            }
                            const isFirstAfterHeading = i === 0 || (i > 0 && post.content[i - 1].type === 'heading');
                            return (
                                <p key={i} className="text-gray-300 leading-relaxed text-[15px]">
                                    {isFirstAfterHeading && <span className="chronicle-initial">{block.text.charAt(0)}</span>}
                                    {isFirstAfterHeading ? block.text.slice(1) : block.text}
                                </p>
                            );
                        })}
                    </div>

                    <div className="chronicle-divider mt-14 mb-8">❧</div>

                    <div className="bg-rpg-panel/50 border border-rpg-panelLight/30 rounded-sm p-6 text-center">
                        <p className="text-gray-500 mb-3 text-sm">Your chapter in Taskoria awaits.</p>
                        <button
                            onClick={onBack}
                            className="inline-flex items-center gap-2 bg-rpg-gold text-rpg-panel border-b-[3px] border-yellow-600 active:border-b-0 active:translate-y-[3px] rounded-lg px-6 py-3 uppercase tracking-widest text-sm font-heading font-bold transition-all hover:bg-yellow-400 cursor-pointer"
                        >
                            Join the Beta <ChevronRight size={16} />
                        </button>
                    </div>
                </article>
            </div>
        </div>
    );
};

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

// Diegetic quest scroll — the product surface, but inside the world.
// Tasks auto-complete every 3s, driving XP animation on the pixel avatar.
const QUEST_TASKS = [
    { label: 'Slay 5 unread emails', reward: 30 },
    { label: 'Read 20 pages',         reward: 15 },
    { label: 'Close sprint tickets',  reward: 50 },
    { label: 'Study English',         reward: 25 },
    { label: 'Meditate 10 min',       reward: 10 },
];

const QuestScroll = () => {
    // Start with 3/5 done — first render already looks alive.
    const [completedCount, setCompletedCount] = useState(3);
    const [justChecked, setJustChecked] = useState(null);
    const [xp, setXp] = useState(45);
    const [xpParticles, setXpParticles] = useState([]);
    const [level, setLevel] = useState(7);

    useEffect(() => {
        const id = setInterval(() => {
            setCompletedCount(prev => {
                // If we're done — reset to start after a pause
                if (prev >= QUEST_TASKS.length) {
                    return 3;
                }
                const task = QUEST_TASKS[prev];
                setJustChecked(prev);
                setTimeout(() => setJustChecked(null), 600);

                // XP + particle
                const pid = Date.now();
                setXpParticles(p => [...p, { id: pid, reward: task.reward }]);
                setTimeout(() => setXpParticles(p => p.filter(x => x.id !== pid)), 1600);
                setXp(x => {
                    const next = x + task.reward;
                    if (next >= 100) {
                        setLevel(l => l + 1);
                        return next - 100;
                    }
                    return next;
                });

                return prev + 1;
            });
        }, 3000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="relative flex flex-col md:flex-row items-center gap-10 md:gap-14 max-w-4xl mx-auto">
            {/* Hero pixel avatar with XP bar */}
            <div className="relative flex flex-col items-center flex-shrink-0">
                <div className="relative flex items-end gap-3">
                    <div className="relative">
                        <ModernPixelAvatar type="wizard" scale={2.8} />
                        {xpParticles.map(p => (
                            <div key={p.id} className="xp-particle">+{p.reward} XP</div>
                        ))}
                    </div>
                    <ModernPixelPet type="wolf" scale={1.6} />
                </div>
                <div className="mt-6 text-center w-56">
                    <div className="text-[10px] uppercase tracking-[0.25em] font-heading font-bold text-gray-500 mb-1">Hero</div>
                    <div className="font-landing text-lg text-white mb-3">Arcanys the Wise · Lvl {level}</div>
                    <div className="relative h-2.5 bg-black/50 border border-white/10 rounded-sm overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-rpg-gold shadow-[0_0_8px_rgba(253,215,109,0.6)] transition-[width] duration-500 ease-out" style={{ width: `${xp}%` }} />
                    </div>
                    <div className="mt-1.5 text-[9px] font-mono text-gray-500 tracking-wider">{xp} / 100 XP</div>
                </div>
            </div>

            {/* Quest scroll */}
            <div className="quest-scroll flex-1 min-w-0 w-full">
                <div className="quest-scroll-title">Today's Chronicle</div>
                <ul>
                    {QUEST_TASKS.map((t, i) => {
                        const isDone = i < completedCount;
                        const isJust = i === justChecked;
                        return (
                            <li key={i} className={`${isDone ? 'completed' : ''} ${isJust ? 'just-checked' : ''}`}>
                                <span className="qs-check">{isDone && '✓'}</span>
                                <span className="qs-label">{t.label}</span>
                                <span className="qs-reward">+{t.reward} XP</span>
                            </li>
                        );
                    })}
                </ul>
                <div className="quest-scroll-footer">
                    <span>Daily streak</span>
                    <span style={{ color: '#b8802e' }}>12 days</span>
                </div>
            </div>
        </div>
    );
};

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
        <div className="relative z-10 flex flex-col sm:flex-row gap-6 bg-[#1a1322] border-4 border-rpg-panelLight p-6 rounded-xl shadow-2xl shadow-black/50">
            {/* Palette */}
            <div className="flex sm:flex-col gap-3 justify-center">
                {tools.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTool(t.id)}
                        className={`w-12 h-12 rounded-xl border-4 flex items-center justify-center transition-all ${activeTool === t.id ? 'border-rpg-gold bg-rpg-panelDark scale-110 shadow-lg shadow-rpg-gold/15' : 'border-rpg-panelLight bg-rpg-panel hover:bg-rpg-panelLight/50'}`}
                    >
                        <t.icon size={24} className={t.color} />
                    </button>
                ))}
            </div>
            
            {/* Grid */}
            <div 
                className="grid grid-cols-6 gap-1 bg-rpg-panelDark p-2 border-4 border-rpg-panelLight rounded-xl shadow-inner mx-auto sm:mx-0"
                onPointerLeave={() => setIsDrawing(false)}
                onPointerUp={() => setIsDrawing(false)}
            >
                {grid.map((cell, i) => (
                    <div 
                        key={i}
                        onPointerDown={() => { setIsDrawing(true); handlePaint(i); }}
                        onPointerEnter={() => { if (isDrawing) handlePaint(i); }}
                        className={`w-10 h-10 sm:w-12 sm:h-12 border-2 border-rpg-panelLight/30 rounded flex items-center justify-center cursor-pointer transition-colors select-none ${cell === 'path' ? 'bg-[#5c4033] border-[#3e2b22]' : 'bg-[#2a2233] hover:bg-[#473d54]'}`}
                    >
                        {cell === 'tree' && <TreePine size={24} className="text-green-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" />}
                        {cell === 'house' && <Castle size={24} className="text-rpg-gold drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" />}
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

// Chapter progress indicator — vertical dots on the right (desktop),
// thin bar at the bottom (mobile). Detects active chapter via IntersectionObserver.
const ChapterProgress = ({ chapters }) => {
    const [activeIdx, setActiveIdx] = useState(0);

    useEffect(() => {
        const observers = [];
        chapters.forEach((ch, i) => {
            const el = ch.ref.current;
            if (!el) return;
            const obs = new IntersectionObserver(
                ([entry]) => { if (entry.isIntersecting) setActiveIdx(i); },
                { threshold: 0.5 }
            );
            obs.observe(el);
            observers.push(obs);
        });
        return () => observers.forEach(o => o.disconnect());
    }, [chapters]);

    const jumpTo = (i) => {
        chapters[i].ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <>
            {/* Desktop: vertical dots on right */}
            <nav
                aria-label="Chapter navigation"
                className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-4 items-end"
            >
                {chapters.map((ch, i) => (
                    <button
                        key={ch.id}
                        onClick={() => jumpTo(i)}
                        className="group flex items-center gap-3 cursor-pointer"
                        aria-label={`Go to ${ch.title}`}
                    >
                        <span className={`text-[10px] uppercase tracking-[0.2em] font-heading font-bold transition-all ${activeIdx === i ? 'text-rpg-gold opacity-100 translate-x-0' : 'text-gray-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`}>
                            {ch.title}
                        </span>
                        <span className={`block rounded-full transition-all duration-300 ${activeIdx === i ? 'w-3 h-3 bg-rpg-gold shadow-[0_0_10px_rgba(253,223,140,0.6)]' : 'w-2 h-2 bg-white/30 group-hover:bg-white/60'}`} />
                    </button>
                ))}
            </nav>

            {/* Mobile: thin progress bar at bottom */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-0.5 bg-black/40 pointer-events-none">
                <div
                    className="h-full bg-rpg-gold transition-all duration-500 ease-out shadow-[0_0_8px_rgba(253,223,140,0.8)]"
                    style={{ width: `${((activeIdx + 1) / chapters.length) * 100}%` }}
                />
            </div>
        </>
    );
};

// Renders a real game prop inside the landing mini map, positioned by % coords.
// The sprite anchors at its bottom (feet on the ground), like in the real world.
const LandingPage = ({ onGoToLogin, onGoToTerms, onGoToLegal }) => {
    const [pageReady, setPageReady] = useState(false);
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [blogView, setBlogView] = useState(null);
    const [councilIdx, setCouncilIdx] = useState(0);
    const navRef = useRef(null);
    const waitlistRef = useRef(null);
    const heroRef = useRef(null);
    const ch01Ref = useRef(null);
    const ch02Ref = useRef(null);
    const ch03Ref = useRef(null);
    const ch04Ref = useRef(null);

    const chapters = [
        { id: 'hero', title: 'Hero', ref: heroRef },
        { id: 'quest', title: 'Quest Log', ref: ch01Ref },
        { id: 'archive', title: 'Archive', ref: ch02Ref },
        { id: 'council', title: 'Council', ref: ch03Ref },
        { id: 'studio', title: 'Studio', ref: ch04Ref },
        { id: 'call', title: 'The Call', ref: waitlistRef },
    ];

    // Track scroll position within the Council chapter to determine which
    // guardian the camera is currently facing (sync with 3D orbital).
    useEffect(() => {
        const onScroll = () => {
            const el = ch03Ref.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const scrollable = el.offsetHeight - window.innerHeight;
            if (scrollable <= 0) return;
            const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
            const idx = Math.min(5, Math.floor(progress * 6 + 0.001));
            setCouncilIdx(idx);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const y = window.scrollY;
                if (navRef.current) {
                    const s = y > 50;
                    const nav = navRef.current;
                    nav.style.borderColor = s ? 'rgba(255,255,255,0.1)' : 'transparent';
                    nav.style.backgroundColor = s ? 'rgba(28,22,34,0.8)' : 'transparent';
                    nav.style.backdropFilter = s ? 'blur(24px)' : 'none';
                    nav.style.webkitBackdropFilter = s ? 'blur(24px)' : 'none';
                    nav.style.boxShadow = s ? '0 10px 15px -3px rgba(0,0,0,0.1)' : 'none';
                }
                ticking = false;
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
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
                // Broadcast to the 3D world — a torch is lit in your name
                window.dispatchEvent(new CustomEvent('taskoria:signed'));
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

    return (
        <div className="min-h-screen bg-rpg-bg text-white font-sans selection:bg-rpg-gold selection:text-black" style={{ overflowX: 'clip' }}>
            {!pageReady && <LoadingScreen onReady={() => setPageReady(true)} />}

            {!blogView && (
                <>
                {/* 3D Castle background */}
                <Suspense fallback={null}>
                    <CastleScene />
                </Suspense>
                {/* Dark overlay on castle */}
                <div className="fixed inset-0 z-[1] pointer-events-none bg-black/40" />
                </>
            )}

            {/* Navbar */}
            <nav ref={navRef} className={`fixed top-0 w-full z-50 flex items-center justify-between px-3 py-3 md:px-12 md:py-5 border-b transition-all duration-300 ${blogView ? 'border-white/10 bg-[rgba(28,22,34,0.95)] backdrop-blur-xl' : 'border-transparent bg-transparent'}`}>
                <button
                    type="button"
                    className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
                    onClick={() => { setBlogView(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    aria-label="Scroll to top"
                >
                    <img src="./logo_taskoria.svg" alt="Taskoria Logo - Gamified RPG Habit Tracker" className="h-6 md:h-8 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)] group-hover:scale-105 transition-transform" />
                </button>
                <div className="flex items-center gap-2 md:gap-2">
                    <button
                        onClick={() => { setBlogView('list'); window.scrollTo(0, 0); }}
                        className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-rpg-gold px-2 md:px-4 py-2 transition-colors cursor-pointer"
                    >Blog</button>
                    <button
                        onClick={scrollToWaitlist}
                        className="hidden md:block text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-rpg-gold px-4 py-2 transition-colors cursor-pointer"
                    >Join Beta</button>
                    <button
                        onClick={() => onGoToLogin?.()}
                        className="bg-rpg-panel border-2 md:border-[3px] border-rpg-panelLight hover:border-rpg-gold text-white text-[10px] md:text-sm font-bold uppercase tracking-wider md:tracking-widest px-3 md:px-6 py-1.5 md:py-2 rounded-lg md:rounded-xl transition-all group font-heading shadow-lg shadow-black/30 active:translate-y-0.5 active:shadow-md"
                    >
                        <span className="flex items-center gap-1.5 md:gap-2">
                            Sign In
                            <ChevronRight size={12} className="md:hidden group-hover:translate-x-1 transition-transform" />
                            <ChevronRight size={14} className="hidden md:block group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                </div>
            </nav>

            {blogView ? (
                <div className="relative z-10 bg-rpg-bg">
                    <div className="h-20" />
                    {blogView === 'list' ? (
                        <BlogListView
                            onSelectPost={(slug) => { setBlogView(slug); window.scrollTo(0, 0); }}
                            onBack={() => { setBlogView(null); window.scrollTo(0, 0); }}
                        />
                    ) : (
                        <BlogPostView
                            slug={blogView}
                            onBack={() => { setBlogView(null); window.scrollTo(0, 0); }}
                            onBackToList={() => { setBlogView('list'); window.scrollTo(0, 0); }}
                        />
                    )}
                    {/* Footer */}
                    <footer className="border-t border-white/10 bg-rpg-panelDark/80 backdrop-blur-sm py-8 mt-12">
                        <div className="container mx-auto px-6 text-center text-sm text-gray-500 font-heading">
                            <p className="mb-4 text-gray-400 tracking-wider uppercase text-xs">Taskoria © {new Date().getFullYear()}</p>
                            <div className="flex justify-center gap-6">
                                <button onClick={() => { setBlogView('list'); window.scrollTo(0, 0); }} className="hover:text-rpg-gold transition-colors block cursor-pointer text-xs uppercase tracking-widest">Blog</button>
                                <button onClick={onGoToTerms} className="hover:text-rpg-gold transition-colors block cursor-pointer text-xs uppercase tracking-widest">Terms of Service</button>
                                <button onClick={onGoToLegal} className="hover:text-rpg-gold transition-colors block cursor-pointer text-xs uppercase tracking-widest">Legal Notice</button>
                            </div>
                        </div>
                    </footer>
                </div>
            ) : (
            <>
            {/* Chapter progress indicator (desktop dots, mobile bar) */}
            <ChapterProgress chapters={chapters} />

            {/* HERO — sticky fullscreen with castle 3D behind */}
            <main ref={heroRef} className="relative z-10 h-[100dvh] flex flex-col items-center justify-center text-center px-6">
                <div className="max-w-4xl mx-auto flex flex-col items-center py-16 md:py-24">
                    <div className="mb-10 flex items-center justify-center">
                        <img src="./icono_taskoria_white.png" alt="Taskoria Crest" className="w-24 h-24 md:w-32 md:h-32 drop-shadow-[0_0_30px_rgba(253,223,140,0.7)]" />
                    </div>
                    <h1 className="sr-only">Taskoria: Gamified Productivity App and RPG Habit Tracker</h1>
                    <h2 className="text-4xl md:text-5xl lg:text-7xl font-landing font-extrabold tracking-widest uppercase mb-8 animate-[slideUpFade_1s_ease-out_forwards] opacity-0 text-white drop-shadow-[0_0_15px_rgba(253,223,140,0.5)] leading-tight">
                        Turn your tasks<br/>into an RPG adventure.
                    </h2>
                    <p className="text-lg md:text-2xl text-rpg-gold font-heading max-w-2xl mx-auto mb-8 animate-[slideUpFade_1s_ease-out_0.3s_forwards] opacity-0 leading-relaxed drop-shadow-[0_0_10px_rgba(253,223,140,0.3)]">
                        A task manager where every completed quest<br className="hidden md:block"/> levels up your hero.
                    </p>
                    <div className="animate-[slideUpFade_1s_ease-out_0.6s_forwards] opacity-0 flex flex-col items-center">
                        <button onClick={scrollToWaitlist} className="bg-rpg-gold text-rpg-panel border-b-[6px] border-yellow-600 active:border-b-0 active:translate-y-[6px] rounded-xl px-10 py-4 uppercase tracking-widest text-base md:text-lg font-heading font-extrabold transition-all flex items-center justify-center gap-3 group shadow-xl">
                            Join the Beta <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                        </button>
                    </div>
                </div>
                {/* Scroll hint — anchored to viewport bottom, full-width so the
                    keyframe transform can't fight the horizontal centering. */}
                <div className="absolute bottom-4 inset-x-0 flex flex-col items-center gap-1.5 animate-[slideUpFade_1s_ease-out_1.2s_forwards] opacity-0 pointer-events-none">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-gray-500 font-heading">Scroll to enter</span>
                    <ChevronDown size={14} className="text-gray-500 animate-[breathe_2.5s_ease-in-out_infinite]" />
                </div>
            </main>

            {/* ═══════════════════════════════════════════════════════
                NARRATIVE CHAPTERS — each is a full-viewport scene
                synced with the 3D camera waypoints in CastleScene.
                The 3D background is always visible (fixed z-0);
                chapters overlay it with semi-transparent gradients.
            ═══════════════════════════════════════════════════════ */}

            {/* CH 01 — THE QUEST LOG */}
            <section ref={ch01Ref} className="narrative-chapter relative z-10 min-h-screen flex items-center justify-center px-6 py-24">
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70 pointer-events-none" />
                <div className="relative z-10 max-w-5xl mx-auto w-full">
                    <Reveal>
                        <div className="chapter-label text-rpg-gold">The Quest Log</div>
                        <h2 className="chapter-headline">Every duty, a legend.</h2>
                        <p className="chapter-tagline max-w-xl">Log your tasks — the Archive turns each one into a quest worth completing.</p>
                        <p className="chapter-body max-w-xl">
                            Daily habits, goals, projects. Every checkbox is XP earned. Every streak, a story.
                        </p>
                    </Reveal>
                    <Reveal delay={300}>
                        <div className="mt-12">
                            <QuestScroll />
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* CH 02 — THE ARCHIVE */}
            <section ref={ch02Ref} className="narrative-chapter relative z-10 min-h-screen flex items-center justify-center px-6 py-24">
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#1a1028]/80 to-black/60 pointer-events-none" />
                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <Reveal>
                        <div className="chapter-label text-rpg-gold">The Archive</div>
                        <h2 className="chapter-headline">The Archive summons.</h2>
                        <p className="chapter-tagline mx-auto max-w-xl">Six guardians were appointed to protect every deed you record.</p>
                    </Reveal>
                    <Reveal delay={200}>
                        <p className="chapter-body mx-auto mt-4 max-w-xl">
                            Long ago, the Royal Archive began transforming every mundane duty into a grand Quest. No deed goes unrecorded. No effort is forgotten.
                        </p>
                    </Reveal>
                    <Reveal delay={350}>
                        <div className="grid md:grid-cols-3 gap-4 mt-12 text-left">
                            {[
                                { chapter: 'I', quote: 'Every checkbox is a chapter. Every day, a saga.' },
                                { chapter: 'II', quote: 'What is not written, is forgotten. What is forgotten, is lost.' },
                                { chapter: 'III', quote: 'The Council watches. Your deeds shape the kingdom.' },
                            ].map((s) => (
                                <div key={s.chapter} className="relative bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:border-rpg-gold/40 transition-colors">
                                    <div className="text-rpg-gold font-landing text-xl mb-2 opacity-70">Chapter {s.chapter}</div>
                                    <p className="text-gray-300 text-sm leading-relaxed italic font-heading">"{s.quote}"</p>
                                </div>
                            ))}
                        </div>
                    </Reveal>
                    <Reveal delay={500}>
                        <div className="mt-10 flex justify-center">
                            <LoreScroll />
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* CH 03 — THE COUNCIL — 3D orbital chamber */}
            {/* The chapter is 3x as tall as the others; camera makes a full
                360° orbit around the council altar while the HUD updates. */}
            <section ref={ch03Ref} className="narrative-chapter relative z-10" style={{ minHeight: '300vh' }}>
                <div className="sticky top-0 h-screen flex flex-col items-center justify-between py-16 md:py-24 px-6">
                    {/* Chapter header */}
                    <div className="text-center">
                        <div className="chapter-label text-rpg-gold justify-center">The Council</div>
                        <h2 className="chapter-headline">Six guardians.</h2>
                        <p className="chapter-tagline max-w-xl mx-auto">Six ways to conquer your day.</p>
                    </div>

                    {/* Current guardian HUD — updates with scroll */}
                    <div className="text-center max-w-md transition-all duration-500 ease-out" key={councilIdx}>
                        <div className="text-[10px] font-mono text-gray-500 tracking-[0.3em] mb-4">
                            {String(councilIdx + 1).padStart(2, '0')} / 06
                        </div>
                        <h3 className="font-landing font-bold text-3xl md:text-4xl mb-1" style={{ color: GUARDIANS[councilIdx].color, textShadow: `0 0 20px ${GUARDIANS[councilIdx].color}55` }}>
                            {GUARDIANS[councilIdx].name}
                        </h3>
                        <div className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold mb-5">
                            {GUARDIANS[councilIdx].title}
                        </div>
                        <p className="text-base italic text-gray-200 leading-relaxed font-heading mb-5 max-w-sm mx-auto">
                            "{GUARDIANS[councilIdx].lore}"
                        </p>
                        <div className="inline-block text-[11px] font-heading font-bold uppercase tracking-widest text-gray-400 border-t border-white/10 pt-3">
                            {GUARDIANS[councilIdx].tech}
                        </div>
                    </div>

                    {/* Scroll hint — subtle */}
                    <div className="text-[9px] uppercase tracking-[0.3em] text-gray-600 font-heading flex items-center gap-2">
                        <span className="w-6 h-px bg-gray-600" />
                        Scroll to walk the circle
                        <span className="w-6 h-px bg-gray-600" />
                    </div>
                </div>
            </section>

            {/* CH 04 — THE STUDIO */}
            <section ref={ch04Ref} className="narrative-chapter relative z-10 min-h-screen flex items-center justify-center px-6 py-24">
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#12101e]/70 to-black/60 pointer-events-none" />
                <div className="relative z-10 max-w-6xl mx-auto w-full">
                    <Reveal>
                        <div className="chapter-label text-rpg-gold">The Studio</div>
                        <h2 className="chapter-headline">Built by you.</h2>
                        <p className="chapter-tagline max-w-xl">The world of Taskoria — one pixel at a time.</p>
                    </Reveal>
                    <Reveal delay={200}>
                        <div className="grid lg:grid-cols-2 gap-10 items-center mt-12">
                            <div>
                                <p className="chapter-body max-w-lg">
                                    Open the Pixel Studio and design houses, castles, mounts, trees and decorations pixel by pixel. Upload a reference, trace with adjustable opacity, use the kingdom's palette. Hit publish — approved creations live on the map forever.
                                </p>
                                <div className="flex gap-8 mt-8">
                                    <div className="text-center">
                                        <div className="text-3xl font-pixel text-white">6</div>
                                        <div className="text-[9px] uppercase tracking-[0.2em] text-gray-500 mt-1">Categories</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-pixel text-rpg-gold">∞</div>
                                        <div className="text-[9px] uppercase tracking-[0.2em] text-gray-500 mt-1">Creations</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-pixel text-white">Live</div>
                                        <div className="text-[9px] uppercase tracking-[0.2em] text-gray-500 mt-1">On the map</div>
                                    </div>
                                </div>
                                <button onClick={() => onGoToLogin?.()} className="mt-8 inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-rpg-gold font-heading px-7 py-3 rounded-xl uppercase tracking-widest text-sm transition-all group font-bold">
                                    <Hammer size={16}/> Try the Pixel Studio <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                                </button>
                            </div>
                            <InteractiveBuilder />
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* CH 05 — THE CALL — final CTA */}
            <section ref={waitlistRef} className="narrative-chapter relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-24 gap-8">
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70 pointer-events-none" />
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center 40%, rgba(253,223,140,0.08) 0%, transparent 60%)' }} />
                <div className="relative z-10 max-w-3xl mx-auto text-center w-full">
                    <Reveal>
                        <div className="chapter-label text-rpg-gold justify-center">The Call</div>
                        <h2 className="chapter-headline">Your quest awaits.</h2>
                        <p className="chapter-tagline mx-auto max-w-xl">Log in and start playing in seconds — free during closed beta.</p>
                        <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 rounded-full bg-rpg-gold/10 border border-rpg-gold/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rpg-gold animate-pulse" />
                            <span className="text-[10px] uppercase tracking-[0.2em] font-heading font-bold text-rpg-gold">Closed beta · Limited spots</span>
                        </div>
                    </Reveal>

                    <Reveal delay={200}>
                        <form onSubmit={handleJoinWaitlist} className="sign-parchment">
                            <div className="sign-parchment-title">The Founder's Register</div>
                            <div className="sign-parchment-flourish">◆ ◆ ◆</div>
                            <p className="sign-parchment-body">
                                Sign your name in the register. Your hero credentials arrive by raven — log in and cross the threshold.
                            </p>

                            <div className="sign-input-wrap">
                                <span className="sign-input-label">Your name in ink</span>
                                <input
                                    type="email"
                                    required
                                    placeholder="you@kingdom.realm"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={status === 'loading' || status === 'success'}
                                    className="sign-input"
                                />
                            </div>

                            <label className="sign-terms">
                                <input
                                    type="checkbox"
                                    checked={privacyAccepted}
                                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                    disabled={status === 'success'}
                                />
                                <span>
                                    I abide by the{' '}
                                    <a href="#" onClick={(e) => { e.preventDefault(); onGoToLegal?.(); }}>Privacy Policy</a>
                                    {' '}and{' '}
                                    <a href="#" onClick={(e) => { e.preventDefault(); onGoToTerms?.(); }}>Terms of Service</a>.
                                </span>
                            </label>

                            <button
                                type="submit"
                                disabled={status === 'loading' || status === 'success' || !privacyAccepted}
                                className={`sign-button ${status === 'success' ? 'success' : ''}`}
                            >
                                {status === 'loading' ? (
                                    <><Loader2 size={18} className="animate-spin" /> Signing…</>
                                ) : status === 'success' ? (
                                    <><CheckCircle2 size={18} /> Signed & Sealed</>
                                ) : (
                                    <>Sign the register</>
                                )}
                            </button>

                            {message && (
                                <div className={`sign-response ${status === 'success' ? 'success' : 'error'}`}>
                                    {message}
                                </div>
                            )}

                            {status === 'success' && (
                                <button
                                    type="button"
                                    onClick={() => onGoToLogin?.()}
                                    className="sign-button success mt-3"
                                    style={{ background: 'linear-gradient(180deg, #b8802e 0%, #8a5f20 100%)' }}
                                >
                                    <Sword size={16} /> Cross the threshold
                                </button>
                            )}
                        </form>
                    </Reveal>
                </div>
            </section>

            {/* ═══ Post-narrative: Blog, FAQ, Footer (utility, not story) ═══ */}
            <div className="relative z-10 bg-rpg-bg">
            <section className="relative z-10 container mx-auto px-6 py-20">
                <Reveal className="text-center mb-14">
                    <div className="chronicle-divider mb-6">❧</div>
                    <h2 className="text-2xl md:text-3xl font-landing font-bold text-white mb-3">The Chronicle</h2>
                    <p className="text-gray-500 max-w-md mx-auto text-sm">Dispatches from the Archive Council.</p>
                    <div className="chronicle-divider mt-6">◆ ◆ ◆</div>
                </Reveal>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {BLOG_POSTS.slice(0, 3).map((post, i) => (
                        <Reveal key={post.slug} delay={i * 120}>
                            <BlogCard post={post} onClick={(slug) => { setBlogView(slug); window.scrollTo(0, 0); }} />
                        </Reveal>
                    ))}
                </div>
                {BLOG_POSTS.length > 3 && (
                    <Reveal>
                        <div className="text-center mt-10">
                            <button
                                onClick={() => { setBlogView('list'); window.scrollTo(0, 0); }}
                                className="inline-flex items-center gap-2 text-rpg-gold hover:text-white text-sm font-bold uppercase tracking-widest transition-colors cursor-pointer"
                            >
                                View all posts <ChevronRight size={16} />
                            </button>
                        </div>
                    </Reveal>
                )}
            </section>

            {/* FAQ */}
            <section className="relative z-10 container mx-auto px-6 py-20">
                <Reveal>
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl md:text-3xl font-landing font-bold text-white mb-2">Traveler's Guide</h2>
                            <p className="text-gray-500 text-sm">Common inquiries at the gate.</p>
                        </div>
                        <div className="faq-parchment">
                            {FAQ_DATA.map((faq, i) => (
                                <FAQParchmentItem key={i} question={faq.q} answer={faq.a} />
                            ))}
                        </div>
                    </div>
                </Reveal>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 bg-rpg-panelDark/80 backdrop-blur-sm py-8 mt-12">
                <div className="container mx-auto px-6 text-center text-sm text-gray-500 font-heading">
                    <p className="mb-4 text-gray-400 tracking-wider uppercase text-xs">Taskoria © {new Date().getFullYear()}</p>
                    <div className="flex justify-center gap-6">
                        <button onClick={() => { setBlogView('list'); window.scrollTo(0, 0); }} className="hover:text-rpg-gold transition-colors block cursor-pointer text-xs uppercase tracking-widest">Blog</button>
                        <button onClick={onGoToTerms} className="hover:text-rpg-gold transition-colors block cursor-pointer text-xs uppercase tracking-widest">Terms of Service</button>
                        <button onClick={onGoToLegal} className="hover:text-rpg-gold transition-colors block cursor-pointer text-xs uppercase tracking-widest">Legal Notice</button>
                    </div>
                </div>
            </footer>
            </div>{/* end post-hero background */}
            </>
            )}
        </div>
    );
};

export default LandingPage;
