import React, { useState, useEffect, useRef } from 'react';
import { Sword, Shield, Scroll, Users, CheckCircle2, ChevronRight, Loader2, Play, Crown } from 'lucide-react';

const LandingPage = ({ onGoToLogin, onGoToTerms, onGoToLegal }) => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    // Parallax & Scroll Animations State
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [scrollPosition, setScrollPosition] = useState(0);
    const heroRef = useRef(null);
    const featuresRef = useRef(null);

    // Interaction Observers
    useEffect(() => {
        const handleMouseMove = (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 20; // max 20px shift
            const y = (e.clientY / window.innerHeight - 0.5) * 20;
            setMousePosition({ x, y });
        };

        const handleScroll = () => {
            setScrollPosition(window.scrollY);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Form Handler
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
                setMessage(data.message || 'You joined the party! The guild will review your request.');
                setEmail('');
            } else {
                setStatus('error');
                setMessage(data.error || 'There was an error joining the waitlist.');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Server connection error.');
        }
    };

    // Calculate parallax transforms safely
    const parallaxBg1 = { transform: `translate(${mousePosition.x * -1}px, ${mousePosition.y * -1}px)` };
    const parallaxBg2 = { transform: `translate(${mousePosition.x * 1.5}px, ${mousePosition.y * 1.5}px)` };
    const parallaxHero = { transform: `translateY(${scrollPosition * 0.2}px)` }; // slow down hero text on scroll down

    return (
        <div className="min-h-screen bg-[#0a0514] text-white overflow-x-hidden font-sans selection:bg-rpg-gold selection:text-black">
            {/* Dynamic Animated Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0a0514] to-[#0a0514] transition-transform duration-700 ease-out" style={parallaxBg1}></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

                {/* Glowing Orbs */}
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-900/40 blur-[120px] rounded-full transition-transform duration-700 ease-out" style={parallaxBg2}></div>
                <div className="absolute top-[30%] -right-[10%] w-[40%] h-[60%] bg-amber-900/20 blur-[150px] rounded-full transition-transform duration-1000 ease-out" style={parallaxBg1}></div>
                <div className="absolute top-[80%] left-[20%] w-[30%] h-[40%] bg-purple-900/30 blur-[150px] rounded-full transition-transform duration-500 ease-out" style={parallaxBg2}></div>
            </div>

            {/* Navbar */}
            <nav className={`fixed top-0 w-full z-50 flex items-center justify-between px-6 py-4 md:px-12 md:py-6 border-b transition-all duration-300 ${scrollPosition > 50 ? 'border-white/10 bg-[#0a0514]/80 backdrop-blur-xl shadow-lg' : 'border-transparent bg-transparent'}`}>
                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <img src="./logo_taskoria.svg" alt="Taskoria Logo" className="h-8 md:h-10 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)] group-hover:scale-105 transition-transform" />
                </div>
                <div>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            if (typeof onGoToLogin === 'function') onGoToLogin();
                        }}
                        className="relative overflow-hidden bg-white/5 hover:bg-white/10 border border-white/20 text-white text-sm font-bold uppercase tracking-widest px-6 py-2.5 rounded-full transition-all group font-heading"
                        style={{ cursor: 'pointer' }}
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Play Now
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-rpg-gold/0 via-rpg-gold/20 to-rpg-gold/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 container mx-auto px-6 pt-32 pb-32 md:pt-48 text-center flex flex-col items-center justify-center min-h-[90vh]" ref={heroRef} style={parallaxHero}>

                {/* Floating Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rpg-gold/10 border border-rpg-gold/30 text-rpg-gold text-xs font-bold font-heading tracking-widest uppercase mb-8 animate-[slideUpFade_1s_ease-out_forwards] opacity-0">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rpg-gold opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
                    </span>
                    Join The Closed Beta
                </div>

                {/* Main Headline */}
                <h1 className="text-6xl md:text-7xl lg:text-8xl font-heading tracking-tight mb-6 animate-[slideUpFade_1s_ease-out_0.2s_forwards] opacity-0 drop-shadow-2xl">
                    Gamify Your <br className="hidden md:block" />
                    <span className="relative inline-block mt-2 md:mt-0">
                        <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-rpg-gold to-amber-600">
                            Life
                        </span>
                        {/* Golden glow behind text */}
                        <span className="absolute inset-0 bg-rpg-gold blur-3xl opacity-20 -z-10 rounded-full"></span>
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 animate-[slideUpFade_1s_ease-out_0.4s_forwards] opacity-0">
                    Motivate yourself to achieve your goals. It's time to have fun when you finish your to-dos! Join the Taskoria beta.
                </p>

                {/* Waitlist Form */}
                <div className="w-full max-w-md mx-auto relative animate-[zoomInFade_1s_ease-out_0.6s_forwards] opacity-0">
                    {/* Glowing border effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-rpg-gold via-amber-500 to-yellow-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse"></div>

                    <form onSubmit={handleJoinWaitlist} className="relative bg-[#1a102e]/80 backdrop-blur-xl border border-white/20 p-2 rounded-2xl flex flex-col sm:flex-row gap-2 shadow-[0_0_40px_rgba(251,191,36,0.15)] hover:shadow-[0_0_60px_rgba(251,191,36,0.25)] transition-shadow">
                        <input
                            type="email"
                            required
                            placeholder="Enter your email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={status === 'loading' || status === 'success'}
                            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 px-4 py-3 focus:ring-0 text-center sm:text-left"
                        />
                        <button
                            type="submit"
                            disabled={status === 'loading' || status === 'success'}
                            className={`relative overflow-hidden bg-rpg-gold text-[#1a102e] font-heading hover:bg-yellow-400 px-6 py-3 rounded-xl uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 group shadow-lg ${status === 'success' ? 'bg-green-500 text-white' : ''}`}
                        >
                            {status === 'loading' ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : status === 'success' ? (
                                <CheckCircle2 size={18} />
                            ) : (
                                <>
                                    <span className="relative z-10 flex items-center gap-2">
                                        Join Waitlist
                                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </span>
                                    {/* Shine effect on button */}
                                    <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-white/0 via-white/40 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Status Messages */}
                    <div className={`mt-4 overflow-hidden transition-all duration-300 ${message ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className={`text-sm font-bold p-3 rounded-xl border backdrop-blur-sm ${status === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'bg-red-500/10 border-red-500/30 text-red-500'
                            }`}>
                            {message}
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-opacity duration-500 ${scrollPosition > 100 ? 'opacity-0' : 'opacity-100 animate-bounce'}`}>
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Discover</span>
                    <div className="w-5 h-8 border-2 border-gray-500 rounded-full flex justify-center p-1">
                        <div className="w-1 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </main>

            {/* Features Section - Habitica Style */}
            <section className="relative z-10 container mx-auto px-6 py-24 min-h-screen" ref={featuresRef}>
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-heading mb-4 text-transparent bg-clip-text bg-gradient-to-r from-rpg-gold to-amber-600">
                        Level Up Your Productivity
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Taskoria turns your life into an RPG adventure where every tick on your task list brings you closer to victory.
                    </p>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto w-full transition-all duration-1000 ${scrollPosition > window.innerHeight * 0.2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-24'}`}>

                    {/* Track Habits & Goals */}
                    <div className="bg-[#1a102e] border-2 border-slate-700 p-8 hover:border-rpg-gold/50 transition-all duration-300 group hover:-translate-y-2 relative overflow-hidden" style={{ imageRendering: 'pixelated' }}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full translate-x-16 -translate-y-16 group-hover:bg-blue-500/20 transition-colors"></div>
                        <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-none flex items-center justify-center mb-6 border-2 border-blue-500/50 group-hover:scale-110 transition-transform relative z-10 shadow-[4px_4px_0px_rgba(59,130,246,0.3)]">
                            <Scroll size={28} />
                        </div>
                        <h3 className="text-xl font-heading mb-4 text-white group-hover:text-blue-200 transition-colors relative z-10">Track Your Habits</h3>
                        <p className="text-gray-400 text-sm leading-relaxed relative z-10 font-sans">
                            Stay accountable by tracking and managing your Habits, Daily Goals, and To-Do list with our easy-to-use interface.
                        </p>
                    </div>

                    {/* Earn Rewards */}
                    <div className="bg-[#1a102e] border-2 border-slate-700 p-8 hover:border-amber-500/50 transition-all duration-300 delay-100 group hover:-translate-y-2 relative overflow-hidden" style={{ imageRendering: 'pixelated' }}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full translate-x-16 -translate-y-16 group-hover:bg-amber-500/20 transition-colors"></div>
                        <div className="w-14 h-14 bg-amber-500/20 text-rpg-gold rounded-none flex items-center justify-center mb-6 border-2 border-amber-500/50 group-hover:scale-110 transition-transform relative z-10 shadow-[4px_4px_0px_rgba(251,191,36,0.3)]">
                            <Crown size={28} />
                        </div>
                        <h3 className="text-xl font-heading mb-4 text-white group-hover:text-amber-200 transition-colors relative z-10">Earn Rewards</h3>
                        <p className="text-gray-400 text-sm leading-relaxed relative z-10 font-sans">
                            Complete tasks to level up your Avatar and unlock in-game features such as battle armor, mysterious pets, and magic skills.
                        </p>
                    </div>

                    {/* Battle Monsters */}
                    <div className="bg-[#1a102e] border-2 border-slate-700 p-8 hover:border-red-500/50 transition-all duration-300 delay-200 group hover:-translate-y-2 relative overflow-hidden" style={{ imageRendering: 'pixelated' }}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-bl-full translate-x-16 -translate-y-16 group-hover:bg-red-500/20 transition-colors"></div>
                        <div className="w-14 h-14 bg-red-500/20 text-red-500 rounded-none flex items-center justify-center mb-6 border-2 border-red-500/50 group-hover:scale-110 transition-transform relative z-10 shadow-[4px_4px_0px_rgba(239,68,68,0.3)]">
                            <Sword size={28} />
                        </div>
                        <h3 className="text-xl font-heading mb-4 text-white group-hover:text-red-300 transition-colors relative z-10">Battle Monsters</h3>
                        <p className="text-gray-400 text-sm leading-relaxed relative z-10 font-sans">
                            Fight against procrastination monsters in the Pomodoro Focus Area! If you lose focus, the monster strikes back.
                        </p>
                    </div>

                    {/* Play Anywhere */}
                    <div className="bg-[#1a102e] border-2 border-slate-700 p-8 hover:border-indigo-500/50 transition-all duration-300 delay-300 group hover:-translate-y-2 relative overflow-hidden" style={{ imageRendering: 'pixelated' }}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full translate-x-16 -translate-y-16 group-hover:bg-indigo-500/20 transition-colors"></div>
                        <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-none flex items-center justify-center mb-6 border-2 border-indigo-500/50 group-hover:scale-110 transition-transform relative z-10 shadow-[4px_4px_0px_rgba(99,102,241,0.3)]">
                            <Users size={28} />
                        </div>
                        <h3 className="text-xl font-heading mb-4 text-white group-hover:text-indigo-200 transition-colors relative z-10">Guild of Friends</h3>
                        <p className="text-gray-400 text-sm leading-relaxed relative z-10 font-sans">
                            Invite friends and family to your Guild. See their real-time progress and support each other towards success.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer with legal links */}
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

export default LandingPage;
