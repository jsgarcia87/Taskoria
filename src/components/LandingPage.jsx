import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import {
    Sword, Shield, Scroll, Users, CheckCircle2, ChevronRight, Loader2, Crown, Hammer,
    Sparkles, Map, Timer, Heart, Target, Trophy, Flame, Star, Zap, BookOpen, TreePine, Castle, Eraser, Square,
    ChevronDown, HelpCircle, ArrowLeft, Calendar, Clock, Newspaper, ChevronLeft
} from 'lucide-react';
import BLOG_POSTS from '../data/blogPosts';
import ModernPixelAvatar from './common/ModernPixelAvatar';
import ModernPixelPet from './common/ModernPixelPet';
import LoreScroll from './common/LoreScroll';
import ArchiveCouncilMessage from './common/ArchiveCouncilMessage';
import { WorldSprite, WORLD_PROPS } from './dashboard/world/worldProps';

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
        className="group text-left bg-rpg-panel border-4 border-rpg-panelLight rounded-xl overflow-hidden transition-all duration-300 hover:border-rpg-gold hover:-translate-y-1 hover:shadow-[8px_8px_0_rgba(253,223,140,0.15)] cursor-pointer w-full"
    >
        <div className={`h-32 bg-gradient-to-br ${post.coverGradient} relative overflow-hidden`}>
            <div className="absolute inset-0 landing-pixel-grid opacity-20" />
            <div className="absolute bottom-3 left-4">
                <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded border ${CATEGORY_COLORS[post.category] || 'bg-white/10 text-white border-white/20'}`}>
                    {post.category}
                </span>
            </div>
        </div>
        <div className="p-5">
            <h3 className="font-heading font-bold text-white text-base mb-2 group-hover:text-rpg-gold transition-colors leading-snug">
                {post.title}
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
            <div className="flex items-center gap-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(post.date)}</span>
                <span className="flex items-center gap-1"><Clock size={10} /> {post.readTime}</span>
            </div>
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
                <Newspaper size={36} className="mx-auto text-rpg-gold mb-4 opacity-80" />
                <h1 className="text-3xl md:text-4xl font-landing font-bold text-white mb-3">The Taskoria Chronicle</h1>
                <p className="text-gray-400 max-w-xl mx-auto">News, updates, and tales from the kingdom. Follow our journey as we build the world of Taskoria together.</p>
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
                    <ChevronLeft size={16} /> All Posts
                </button>

                <article className="max-w-2xl mx-auto">
                    <div className={`h-40 md:h-56 rounded-xl bg-gradient-to-br ${post.coverGradient} relative overflow-hidden mb-8 border-4 border-rpg-panelLight`}>
                        <div className="absolute inset-0 landing-pixel-grid opacity-20" />
                        <div className="absolute bottom-4 left-5">
                            <span className={`text-[9px] uppercase tracking-widest font-bold px-2.5 py-1 rounded border ${CATEGORY_COLORS[post.category] || 'bg-white/10 text-white border-white/20'}`}>
                                {post.category}
                            </span>
                        </div>
                    </div>

                    <h1 className="text-2xl md:text-4xl font-landing font-bold text-white mb-4 leading-tight">{post.title}</h1>

                    <div className="flex items-center gap-4 text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-10 pb-6 border-b border-rpg-panelLight/30">
                        <span className="flex items-center gap-1.5"><Calendar size={12} /> {formatDate(post.date)}</span>
                        <span className="flex items-center gap-1.5"><Clock size={12} /> {post.readTime}</span>
                    </div>

                    <div className="space-y-5">
                        {post.content.map((block, i) => {
                            if (block.type === 'heading') {
                                return <h2 key={i} className="text-xl md:text-2xl font-heading font-bold text-rpg-gold mt-8 mb-2">{block.text}</h2>;
                            }
                            return <p key={i} className="text-gray-300 leading-relaxed text-[15px]">{block.text}</p>;
                        })}
                    </div>

                    <div className="mt-14 pt-8 border-t border-rpg-panelLight/30">
                        <div className="bg-rpg-panel border-4 border-rpg-panelLight rounded-xl p-6 text-center">
                            <p className="text-gray-400 mb-3 text-sm">Want to experience Taskoria for yourself?</p>
                            <button
                                onClick={onBack}
                                className="inline-flex items-center gap-2 bg-rpg-gold text-rpg-panel border-b-[4px] border-yellow-600 active:border-b-0 active:translate-y-[4px] rounded-lg px-6 py-3 uppercase tracking-widest text-sm font-heading font-bold transition-all hover:bg-yellow-400 cursor-pointer"
                            >
                                Join the Beta <ChevronRight size={16} />
                            </button>
                        </div>
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
            <div className="absolute -top-3 right-6 bg-rpg-gold text-black font-heading text-xs px-3 py-1 rounded-sm border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,0.4)] animate-breathe font-bold">+50 XP</div>
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

// Renders a real game prop inside the landing mini map, positioned by % coords.
// The sprite anchors at its bottom (feet on the ground), like in the real world.
const LandingPage = ({ onGoToLogin, onGoToTerms, onGoToLegal }) => {
    const [pageReady, setPageReady] = useState(false);
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [blogView, setBlogView] = useState(null);
    const navRef = useRef(null);
    const heroRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const waitlistRef = useRef(null);

    useEffect(() => {
        const vh = window.innerHeight || 800;
        const heroScrollHeight = vh * 2;
        if (scrollContainerRef.current) {
            scrollContainerRef.current.style.height = `${heroScrollHeight}px`;
        }
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
                if (heroRef.current) {
                    const maxScroll = Math.max(1, heroScrollHeight - vh);
                    const ratio = Math.min(Math.max(y / maxScroll, 0), 1);
                    const fadeStart = 0.82;
                    const opacity = ratio < fadeStart ? 1 : Math.max(0, 1 - (ratio - fadeStart) / 0.16);
                    heroRef.current.style.opacity = opacity;
                    heroRef.current.style.transform = `scale(${1 - (1 - opacity) * 0.05})`;
                    heroRef.current.style.pointerEvents = opacity < 0.1 ? 'none' : 'auto';
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
                        className="hidden md:block text-xs font-bold uppercase tracking-widest text-rpg-gold hover:text-white px-4 py-2 transition-colors"
                    >Join Beta</button>
                    <button
                        onClick={() => onGoToLogin?.()}
                        className="bg-rpg-panel border-2 md:border-[3px] border-rpg-panelLight hover:border-rpg-gold text-white text-[10px] md:text-sm font-bold uppercase tracking-wider md:tracking-widest px-3 md:px-6 py-1.5 md:py-2 rounded-lg md:rounded-xl transition-colors group font-heading shadow-[3px_3px_0_rgba(0,0,0,0.5)] md:shadow-[4px_4px_0_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none"
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
            {/* HERO - scroll container provides distance for castle animation */}
            <div ref={scrollContainerRef}>
                <main
                    ref={heroRef}
                    className="sticky top-0 z-10 h-[100dvh] flex flex-col items-center justify-center text-center px-6"
                    style={{ willChange: 'opacity, transform' }}
                >
                    <div className="max-w-4xl mx-auto flex flex-col items-center py-16 md:py-24">

                        <div className="mb-10 flex items-center justify-center">
                            <img src="./icono_taskoria_white.png" alt="Taskoria Crest - Gamified Productivity App" className="w-24 h-24 md:w-32 md:h-32 drop-shadow-[0_0_30px_rgba(253,223,140,0.7)]" />
                        </div>

                        <h1 className="sr-only">Taskoria: Gamified Productivity App and RPG Habit Tracker</h1>

                        <h2 className="text-4xl md:text-5xl lg:text-7xl font-landing font-extrabold tracking-widest uppercase mb-8 animate-[slideUpFade_1s_ease-out_forwards] opacity-0 text-white drop-shadow-[0_0_15px_rgba(253,223,140,0.5)] leading-tight">
                            Turn your tasks<br/>into an RPG adventure.
                        </h2>

                        <p className="text-lg md:text-2xl text-rpg-gold font-heading max-w-2xl mx-auto mb-8 animate-[slideUpFade_1s_ease-out_0.3s_forwards] opacity-0 leading-relaxed drop-shadow-[0_0_10px_rgba(253,223,140,0.3)]">
                            A task manager where every completed quest<br className="hidden md:block"/> levels up your hero.
                        </p>

                        <div className="animate-[slideUpFade_1s_ease-out_0.6s_forwards] opacity-0 flex flex-col items-center">
                            <button
                                onClick={scrollToWaitlist}
                                className="bg-rpg-gold text-rpg-panel border-b-[6px] border-yellow-600 active:border-b-0 active:translate-y-[6px] rounded-xl px-10 py-4 uppercase tracking-widest text-base md:text-lg font-heading font-extrabold transition-all flex items-center justify-center gap-3 group shadow-xl"
                            >
                                Join the Beta
                                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                            </button>
                            <p className="mt-4 text-gray-500 text-xs tracking-wide animate-[slideUpFade_1s_ease-out_0.9s_forwards] opacity-0">
                                Free during closed beta — limited spots
                            </p>
                        </div>
                    </div>
                </main>
            </div>

            {/* Post-hero background (covers fixed castle scene) */}
            <div className="relative z-10 bg-rpg-bg">
                {/* Seamless top transition from castle black to rpg-bg */}
                <div className="h-64 bg-gradient-to-b from-black to-rpg-bg -mt-64 pointer-events-none relative z-20" />

            {/* PRODUCT SHOWCASE — immediately after hero */}
            <section className="relative z-10 container mx-auto px-6 py-20">
                <Reveal>
                    <div className="text-center mb-10">
                        <h2 className="text-2xl md:text-3xl font-landing font-bold text-white max-w-2xl mx-auto">
                            Your legend begins with your daily duties.
                        </h2>
                    </div>
                    <HeroMockup/>
                </Reveal>
            </section>

                {/* Divider */}
                <div className="container mx-auto px-6"><div className="landing-divider max-w-4xl mx-auto"></div></div>

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

                <div className="relative max-w-3xl mx-auto">
                    {[
                        { icon: Target, title: 'Create your quests', body: 'Log your tasks, daily habits and goals in our RPG task manager. Set difficulty and XP rewards. Everything you complete levels you up.' },
                        { icon: Sword, title: 'Level up your hero', body: 'Pick a class (Mage, Warrior, Rogue…), customize your pixel-art avatar, equip gear, adopt pets, and defeat your procrastination boss.' },
                        { icon: Map, title: 'Explore and build the world', body: 'Walk around the gamified town with your party, talk to NPCs, browse shops, and craft houses and mounts with a pixel art productivity community.' },
                    ].map((step, i) => (
                        <Reveal key={step.title} delay={i * 200}>
                            <div className="relative flex gap-6 items-start pb-14">
                                {i < 2 && <div className="absolute left-7 top-[60px] bottom-0 w-px bg-gradient-to-b from-rpg-gold/30 to-transparent" />}
                                <div className="flex-shrink-0 w-14 h-14 bg-rpg-panel border-4 border-rpg-panelLight rounded-xl flex items-center justify-center text-rpg-gold shadow-[4px_4px_0_rgba(0,0,0,0.5)] relative z-10">
                                    <step.icon size={24} />
                                </div>
                                <div className="pt-1">
                                    <h3 className="text-xl md:text-2xl font-heading text-white mb-2">{step.title}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">{step.body}</p>
                                </div>
                            </div>
                        </Reveal>
                    ))}

                </div>
            </section>

            {/* Divider */}
            <div className="relative z-10 container mx-auto px-6"><div className="landing-divider max-w-4xl mx-auto"></div></div>

            {/* CHAPTER III: THE COUNCIL */}
            <section className="relative z-10 py-20 bg-rpg-panelDark/40">
                <div className="absolute inset-0 bg-gradient-to-b from-rpg-bg via-transparent to-rpg-bg pointer-events-none" />
                <div className="container mx-auto px-6 relative z-10">
                <Reveal className="text-center mb-20">
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
                                <div className={`w-full max-w-[240px] aspect-[3/4] bg-rpg-panel border-[6px] border-rpg-panelLight border-t-[6px] ${g.border} rounded-2xl flex flex-col items-center justify-center p-6 relative z-10 transition-all duration-300 shadow-[10px_10px_0_rgba(0,0,0,0.4)] group-hover:-translate-y-3 group-hover:border-rpg-gold group-hover:shadow-[15px_15px_0_rgba(253,223,140,0.2)]`}>
                                    <div className={`absolute inset-0 rounded-xl ${g.bg} opacity-10 group-hover:opacity-30 transition-opacity duration-300`}></div>
                                    
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
                                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-2 border-white/20 hover:border-rpg-gold font-heading px-7 py-3 rounded-xl uppercase tracking-widest text-sm transition-all group font-bold mt-2"
                                >
                                    <Hammer size={16}/> Try the Pixel Studio
                                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                                </button>
                            </div>

                            {/* Interactive Town Builder */}
                            <InteractiveBuilder />
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* COUNCIL MESSAGE — personalized weather nudge before signup */}
            <section className="relative z-10 container mx-auto px-6 py-12">
                <Reveal>
                    <ArchiveCouncilMessage onJoinBeta={scrollToWaitlist} />
                </Reveal>
            </section>

            {/* FINAL CTA + WAITLIST */}
            <section ref={waitlistRef} className="relative z-10 container mx-auto px-6 py-24">
                <Reveal>
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-block text-[11px] uppercase tracking-widest font-bold text-rpg-gold mb-3">Closed Beta — Limited Spots</div>
                        <h2 className="text-4xl md:text-5xl font-landing font-bold mb-4 text-white leading-tight">
                            Ready to start your <span className="text-rpg-gold">first quest</span>?
                        </h2>
                        <p className="text-gray-400 mb-4 max-w-xl mx-auto">
                            Drop your email below. Your hero credentials arrive in seconds — log in and start playing immediately.
                        </p>
                        <p className="text-rpg-gold/80 text-sm font-heading font-bold mb-8">
                            Founding citizens get early access to all 5 maps and a special badge.
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
                                    disabled={status === 'loading' || status === 'success' || !privacyAccepted}
                                    className={`relative bg-rpg-gold text-rpg-panel border-b-[4px] border-yellow-600 active:border-b-0 active:translate-y-[4px] font-heading hover:bg-yellow-400 px-6 py-3 rounded-lg uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 group font-bold ${status === 'success' ? 'bg-green-500 border-green-700 text-white' : ''}`}
                                >
                                    {status === 'loading' ? <Loader2 size={18} className="animate-spin"/> :
                                     status === 'success' ? <CheckCircle2 size={18}/> :
                                     <>Join the Beta <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/></>}
                                </button>
                            </form>
                            <label className="flex items-start gap-3 mt-4 cursor-pointer group max-w-md mx-auto text-left">
                                <input
                                    type="checkbox"
                                    checked={privacyAccepted}
                                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                    disabled={status === 'success'}
                                    className="mt-0.5 w-4 h-4 rounded border-2 border-rpg-panelLight bg-rpg-panel accent-rpg-gold flex-shrink-0 cursor-pointer"
                                />
                                <span className="text-[11px] text-gray-500 leading-relaxed group-hover:text-gray-400 transition-colors">
                                    I accept the{' '}
                                    <button type="button" onClick={onGoToLegal} className="text-rpg-gold/80 hover:text-rpg-gold underline underline-offset-2">Privacy Policy</button>
                                    {' '}and{' '}
                                    <button type="button" onClick={onGoToTerms} className="text-rpg-gold/80 hover:text-rpg-gold underline underline-offset-2">Terms of Service</button>.
                                </span>
                            </label>
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

            {/* BLOG — Latest Posts */}
            <div className="relative z-10 container mx-auto px-6"><div className="landing-divider max-w-4xl mx-auto"></div></div>
            <section className="relative z-10 container mx-auto px-6 py-20">
                <Reveal className="text-center mb-14">
                    <Newspaper size={36} className="mx-auto text-rpg-gold mb-4 opacity-80" />
                    <h2 className="text-2xl md:text-3xl font-landing font-bold text-white mb-3">The Taskoria Chronicle</h2>
                    <p className="text-gray-400 max-w-lg mx-auto text-sm">News, updates, and tales from the kingdom.</p>
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
                        <div className="text-center mb-12">
                            <HelpCircle size={32} className="mx-auto text-rpg-gold mb-4 opacity-80" />
                            <h2 className="text-2xl md:text-3xl font-landing font-bold text-white">Frequently Asked Questions</h2>
                        </div>
                        <div className="bg-rpg-panel/50 border-2 border-rpg-panelLight rounded-xl px-6 md:px-8">
                            {FAQ_DATA.map((faq, i) => (
                                <FAQAccordionItem key={i} question={faq.q} answer={faq.a} />
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
