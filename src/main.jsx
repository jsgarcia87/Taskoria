import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './components/common/Toast'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MotionConfig
      reducedMotion="user"
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
    >
      <ToastProvider>
        <App />
      </ToastProvider>
    </MotionConfig>
  </StrictMode>,
)
