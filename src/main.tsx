import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './hooks/useAuth'
import { CurrentUserProvider } from './hooks/useCurrentUser'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <CurrentUserProvider>
        <App />
      </CurrentUserProvider>
    </AuthProvider>
  </React.StrictMode>,
)
