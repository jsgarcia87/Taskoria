import React from 'react';
import { ChevronLeft } from 'lucide-react';

const LegalNotice = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-rpg-panelDark text-white font-sans selection:bg-rpg-gold selection:text-black">
            <nav className="fixed top-0 w-full z-50 flex items-center px-6 py-4 border-b border-white/10 bg-rpg-panelDark/80 backdrop-blur-xl">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer font-heading uppercase tracking-widest text-sm">
                    <ChevronLeft size={20} />
                    <span>Back</span>
                </button>
            </nav>
            <main className="container mx-auto px-6 pt-32 pb-24 max-w-4xl">
                <h1 className="text-4xl md:text-5xl font-heading mb-8 text-transparent bg-clip-text bg-gradient-to-r from-rpg-gold to-amber-600">Legal Notice</h1>
                <div className="space-y-6 text-gray-300 bg-rpg-panel/60 p-8 md:p-12 rounded-3xl border border-white/10">
                    <p><strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US')}</p>

                    <p>This Legal Notice governs the use of the website <strong>taskoria.app</strong> (also accessible at <strong>sangar.studio/rpg</strong>), in compliance with Spanish Law 34/2002, of July 11, on Information Society Services and Electronic Commerce (LSSI-CE).</p>

                    <h2 className="text-2xl font-heading text-white mt-8 mb-4">1. Site Owner</h2>
                    <p>This website is owned and operated by <strong>Jesús Sánchez García</strong>, an individual acting under the trade name <strong>Sangar Studio</strong>, based in Molina de Segura, Murcia, Spain.</p>
                    <p>Contact email: <a href="mailto:jesus.sanchez.g.87@gmail.com" className="text-rpg-gold hover:brightness-125 transition">jesus.sanchez.g.87@gmail.com</a></p>

                    <h2 className="text-2xl font-heading text-white mt-8 mb-4">2. Purpose of the Site</h2>
                    <p>Taskoria is a gamified productivity application. It lets users track habits, tasks and goals inside an RPG-style world, level up a hero, and explore a pixel-art town with other players. The service is currently in Closed Beta and is offered free of charge during this phase.</p>

                    <h2 className="text-2xl font-heading text-white mt-8 mb-4">3. Access and Use</h2>
                    <p>Access to the site is free. Access to certain features requires user registration and acceptance of the <strong>Terms of Service</strong>. Users agree to make responsible use of the platform, respecting the law, morality and public order.</p>

                    <h2 className="text-2xl font-heading text-white mt-8 mb-4">4. Intellectual and Industrial Property</h2>
                    <p>All content of this website — including but not limited to source code, pixel art, sprites, graphic design, texts, logos, trade names, and the underlying game concept — is the exclusive property of Jesús Sánchez García / Sangar Studio, or is used under the corresponding licenses.</p>
                    <p>Any reproduction, distribution, public communication or transformation of these materials, in whole or in part, without express written authorization from the owner is prohibited. User-generated pixel-art creations remain the intellectual property of their respective authors, who grant Sangar Studio a non-exclusive license to display them within the game world.</p>

                    <h2 className="text-2xl font-heading text-white mt-8 mb-4">5. Liability</h2>
                    <p>Sangar Studio makes reasonable efforts to keep the service available, secure and free of errors, but does not guarantee uninterrupted availability during the Closed Beta phase. Sangar Studio is not liable for any loss of progress data, service interruptions, or any consequences arising from the use of the application, to the extent permitted by applicable law.</p>

                    <h2 className="text-2xl font-heading text-white mt-8 mb-4">6. External Links</h2>
                    <p>This site may contain links to third-party websites. Sangar Studio does not control and is not responsible for the content, policies or practices of external sites accessed through these links.</p>

                    <h2 className="text-2xl font-heading text-white mt-8 mb-4">7. Personal Data</h2>
                    <p>Personal data collected through the registration form and in-app feedback tool (email address, chosen hero name, submitted messages) is stored on secure servers and used solely to operate the service, deliver login credentials, and address user feedback. Data is not shared with third parties, sold or used for advertising purposes.</p>
                    <p>Users may request access, rectification or deletion of their personal data at any time by writing to <a href="mailto:jesus.sanchez.g.87@gmail.com" className="text-rpg-gold hover:brightness-125 transition">jesus.sanchez.g.87@gmail.com</a>.</p>

                    <h2 className="text-2xl font-heading text-white mt-8 mb-4">8. Applicable Law and Jurisdiction</h2>
                    <p>This Legal Notice is governed by Spanish law. Any dispute arising from access to or use of this website will be submitted to the Courts and Tribunals of Murcia, Spain, unless the applicable law imposes a different jurisdiction.</p>

                    <h2 className="text-2xl font-heading text-white mt-8 mb-4">9. Modifications</h2>
                    <p>Sangar Studio reserves the right to modify this Legal Notice at any time in order to adapt it to legislative changes or to the evolution of the service. Users will be notified of significant changes within the platform.</p>
                </div>
            </main>
        </div>
    );
};

export default LegalNotice;
