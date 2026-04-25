import React, { useState, useEffect } from 'react';
import { Shield, Sword, User, Loader2 } from 'lucide-react';

const API_BASE = 'api'; // Relative path assuming dist is at root along with api folder

const Auth = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [allowRegistration, setAllowRegistration] = useState(true);

    useEffect(() => {
        const checkSettings = async () => {
            try {
                const res = await fetch(`${API_BASE}/settings.php`);
                const data = await res.json();
                if (data && data.success) {
                    setAllowRegistration(data.allow_registration);
                }
            } catch (err) {
                console.error("Failed to check settings", err);
            }
        };
        checkSettings();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isLogin ? '/login.php' : '/register.php';

        try {
            const bodyData = isLogin
                ? { username, password }
                : { username }; // username acts as the email for registration

            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            if (isLogin) {
                onLogin(data.user);
            } else {
                setError('Registration successful! Please check your email for your password.');
                setIsLogin(true);
                setPassword('');
            }
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to connect to realm");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Background handled by global CSS, but adding a specific overlay for Auth */}
            <div className="absolute inset-0 bg-rpg-bg">
                <div className="absolute top-0 left-0 w-full h-full bg-mesh-gradient opacity-60"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
            </div>

            <div className="glass-panel p-8 max-w-md w-full relative z-10 border-t border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-500">
                {/* Decorative Elements */}
                <div className="absolute -top-12 -left-12 text-white/5 animate-pulse duration-[5000ms]">
                    <Shield size={128} />
                </div>
                <div className="absolute -bottom-12 -right-12 text-white/5 animate-pulse duration-[7000ms]">
                    <Sword size={128} />
                </div>

                <div className="text-center mb-8 relative z-10">
                    <div className="flex justify-center mb-6">
                        <img src="./logo_taskoria.svg" alt="Taskoria Logo" className="h-16 md:h-20 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                    </div>
                    <p className="text-rpg-gold/80 text-sm uppercase tracking-[0.2em] font-bold">
                        {isLogin ? 'Enter the Realm' : 'Join the Guild'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div className="space-y-4">
                        <div className="relative group">
                            <input
                                type={isLogin ? "text" : "email"}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pl-12 text-white placeholder:text-gray-500 focus:border-rpg-gold focus:ring-1 focus:ring-rpg-gold/50 outline-none transition-all font-sans"
                                placeholder={isLogin ? "Hero Name / Email" : "Email Address"}
                                required
                            />
                            <User className="absolute left-4 top-4 text-gray-500 group-focus-within:text-rpg-gold transition-colors" size={20} />
                        </div>

                        {isLogin && (
                            <div className="relative group animate-in fade-in slide-in-from-top-2">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pl-12 text-white placeholder:text-gray-500 focus:border-rpg-gold focus:ring-1 focus:ring-rpg-gold/50 outline-none transition-all font-sans"
                                    placeholder="Secret Key"
                                    required={isLogin}
                                />
                                <Shield className="absolute left-4 top-4 text-gray-500 group-focus-within:text-rpg-gold transition-colors" size={20} />
                            </div>
                        )}

                        {!isLogin && (
                            <p className="text-xs text-center text-gray-400 font-mono mt-2 animate-in fade-in">
                                We will send a secure auto-generated password to your email.
                            </p>
                        )}
                    </div>

                    {error && (
                        <div className={`text-center text-xs p-3 rounded-lg border ${error.includes('successful') ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'} backdrop-blur-md`}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full glass-btn-primary py-4 text-sm font-bold uppercase tracking-widest shadow-lg hover:shadow-glow-gold flex items-center justify-center gap-2 group"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : (isLogin ? 'Enter World' : 'Create Character')}
                        {!loading && <span className="group-hover:translate-x-1 transition-transform">→</span>}
                    </button>
                </form>

                {allowRegistration && (
                    <div className="mt-8 text-center relative z-10">
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            className="text-gray-400 text-xs hover:text-white transition-colors uppercase tracking-wider font-bold"
                        >
                            {isLogin ? "Need a character? Register" : "Already have a hero? Login"}
                        </button>
                    </div>
                )}
            </div>

            <div className="absolute bottom-4 text-center text-[10px] text-white/20 uppercase tracking-widest">
                Taskoria v2.0
            </div>
        </div>
    );
};

export default Auth;
