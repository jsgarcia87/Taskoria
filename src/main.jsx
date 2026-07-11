import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './components/common/Toast'

const rootEl = document.getElementById('root')
const tree = (
  <StrictMode>
    <MotionConfig
      reducedMotion="user"
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
    >
      <ToastProvider>
        <App />
      </ToastProvider>
    </MotionConfig>
  </StrictMode>
)

// When vite-prerender-plugin has injected the landing into #root at build
// time, hydrate instead of blowing away the SEO markup. Fresh SPA renders
// (dev, non-prerendered routes) fall through to createRoot.
if (rootEl.hasChildNodes()) {
  hydrateRoot(rootEl, tree)
} else {
  createRoot(rootEl).render(tree)
}
