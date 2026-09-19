import React, { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './components/common/Toast'
import { ConfirmProvider } from './context/ConfirmContext'

const rootEl = document.getElementById('root')

// Dev shortcut — visit ?dev=mapeditor to mount the new map editor without auth.
// Only active in Vite dev server; production build strips import.meta.env.DEV.
const params = new URLSearchParams(window.location.search)
const devRoute = import.meta.env.DEV ? params.get('dev') : null

const DevMapEditorMount = () => {
  const [MapEditor, setMapEditor] = React.useState(null)
  React.useEffect(() => {
    import('./components/dashboard/admin/MapEditor.jsx').then(m => setMapEditor(() => m.default))
  }, [])
  if (!MapEditor) return React.createElement('div', { className: 'text-white p-8' }, 'Loading MapEditor…')
  // ?dev=mapeditor&existing=1 → simulate editing an existing library asset,
  // which shows the prominent "Volver" button + asset name in the header.
  const editingExisting = params.get('existing') === '1'
  return React.createElement(MapEditor, {
    currentUser: { id: 1, name: 'Dev', is_admin: true },
    initialDesign: editingExisting ? { id: 42, name: 'Diseño de prueba', payload: null } : null,
    onClose: () => { window.location.search = '' },
  })
}

const tree = (
  <StrictMode>
    <MotionConfig
      reducedMotion="user"
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
    >
      <ToastProvider>
        <ConfirmProvider>
          {devRoute === 'mapeditor' ? <DevMapEditorMount /> : <App />}
        </ConfirmProvider>
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
