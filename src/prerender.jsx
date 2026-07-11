import { renderToString } from 'react-dom/server';

// Build-time entry point for vite-prerender-plugin.
// Renders a static, SEO-focused hero into #root at build time so crawlers
// get real content on first byte. Client-side, main.jsx hydrates over this.
//
// We render a HAND-WRITTEN static hero here (not LandingPage.jsx) on purpose:
// the LandingPage pulls in the whole worldProps / motion / avatar chain,
// which drags DOM/window references that crash under Node SSR. The hero
// mirrors the LandingPage's above-the-fold text so hydration is seamless
// once main.jsx boots.
export async function prerender() {
    const html = renderToString(
        <div className="min-h-screen bg-[#130f1e] text-white">
            <main className="max-w-5xl mx-auto px-6 py-24 sm:py-32">
                <p className="inline-block text-[11px] uppercase tracking-widest font-bold text-rpg-gold bg-white/5 border border-rpg-gold/30 px-4 py-1.5 rounded-full mb-6">
                    Closed Beta · Limited slots
                </p>
                <h1 className="font-heading text-5xl sm:text-7xl font-black leading-[1.05] mb-6">
                    Turn your day into an{' '}
                    <span className="text-rpg-gold italic">RPG adventure.</span>
                </h1>
                <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mb-8">
                    Taskoria is a habits &amp; tasks app with a real pixel-art world:
                    complete quests, level up, explore a town with your party, and{' '}
                    <strong className="text-white">build the game world together</strong>{' '}
                    with the whole community.
                </p>
                <p className="text-sm text-gray-500 uppercase tracking-widest">
                    taskoria.es · closed beta
                </p>
            </main>
        </div>
    );
    return {
        html,
        head: { lang: 'en' },
    };
}
