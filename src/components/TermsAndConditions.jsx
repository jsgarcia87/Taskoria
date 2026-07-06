import React from 'react';
import { ChevronLeft } from 'lucide-react';

const TermsAndConditions = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-rpg-panelDark text-white font-sans selection:bg-rpg-gold selection:text-black">
            <nav className="fixed top-0 w-full z-50 flex items-center px-6 py-4 border-b border-white/10 bg-rpg-panelDark/80 backdrop-blur-xl">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer font-heading uppercase tracking-widest text-sm">
                    <ChevronLeft size={20} />
                    <span>Back</span>
                </button>
            </nav>
            <main className="container mx-auto px-6 pt-32 pb-24 max-w-4xl">
                <h1 className="text-4xl md:text-5xl font-heading mb-8 text-transparent bg-clip-text bg-gradient-to-r from-rpg-gold to-amber-600">Terms of Service</h1>
                <div className="space-y-6 text-gray-300 bg-rpg-panel/60 p-8 md:p-12 rounded-3xl border border-white/10">
                    <p><strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US')}</p>

                    <h2 className="text-2xl font-heading text-white mt-8 mb-4">1. Acceptance of Terms</h2>
                    <p>By accessing or using Taskoria ("we", "the app", "the game"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not use our service.</p>

                    <h2 className="text-2xl font-heading text-white mt-8 mb-4">2. Description of Service</h2>
                    <p>Taskoria is a gamified productivity application. It allows you to track habits, daily tasks, and to-do lists within an RPG environment. The app is provided "as is" during its Closed Beta phase.</p>

                    <h2 className="text-2xl font-heading text-white mt-8 mb-4">3. User Accounts and Security</h2>
                    <p>To use some features, you must create an account. You are responsible for maintaining the confidentiality of your password and all activities under your account. We reserve the right to limit user registration at the administrator's discretion.</p>

                    <h2 className="text-2xl font-heading text-white mt-8 mb-4">4. User Conduct</h2>
                    <p>You agree not to use the app for any unlawful or malicious purposes, and not to interfere with the proper technical functioning of Taskoria's servers.</p>

                    <h2 className="text-2xl font-heading text-white mt-8 mb-4">5. Intellectual Property</h2>
                    <p>All art, graphics, design, and source code of Taskoria are the exclusive property of the developers or are used under relevant licenses. You may use the app for your personal use, but may not redistribute the software.</p>

                    <h2 className="text-2xl font-heading text-white mt-8 mb-4">6. Limitation of Liability</h2>
                    <p>As it is in Beta phase, Taskoria is not responsible for any loss of progress data or other eventualities resulting from the use of the application.</p>

                    <h2 className="text-2xl font-heading text-white mt-8 mb-4">7. Modifications</h2>
                    <p>We reserve the right to modify these terms at any time. You will be notified of any significant changes within the platform.</p>
                </div>
            </main>
        </div>
    );
};

export default TermsAndConditions;
