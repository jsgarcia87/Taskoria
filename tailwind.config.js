/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#121212',
          800: '#1e1e1e',
        },
        // Cyber-Fantasy Palette (Figma Adapted)
        rpg: {
          bg: '#2D1B4E',      // Deep Purple/Void
          panel: '#1A102E',   // Darker panel base
          panelDark: '#0f0a1a', // Near-black panel variant (modals, nav, footers)
          panelLight: '#3D2866', // Lighter purple for highlights
          border: 'rgba(255, 255, 255, 0.1)', // Glass border
          text: '#F0F0F0',    // High contrast white/grey
          gold: '#FFD700',    // Primary Action/Gold
          goldDark: '#B8860B',
          red: '#FF4D4D',     // Danger/HP
          green: '#2DCC70',   // Success/XP
          blue: '#4D94FF',    // Magic/Info
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'], // Default to Inter
        heading: ['"Outfit"', 'sans-serif'], // Headings
        pixel: ['"VT323"', 'monospace'], // Keep for retro flavor
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glow': '0 0 15px rgba(139, 92, 246, 0.5)',
        'glow-gold': '0 0 15px rgba(255, 215, 0, 0.5)',
      },
      backgroundImage: {
        'mesh-gradient': 'radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        sleepZ: {
          '0%': { opacity: '0', transform: 'translate(0, 0) scale(0.5)' },
          '50%': { opacity: '1', transform: 'translate(4px, -8px) scale(1)' },
          '100%': { opacity: '0', transform: 'translate(8px, -16px) scale(1.5)' },
        }
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'sleep-z': 'sleepZ 2.5s infinite ease-in-out',
      }
    },
  },
  plugins: [],
}
