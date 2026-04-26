import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './hooks/useAuth'
import { CurrentUserProvider } from './hooks/useCurrentUser'
import { UsersProvider } from './hooks/useUsers'
import { ThemeProvider } from './hooks/useTheme'
import '@fontsource-variable/geist'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <CurrentUserProvider>
          <UsersProvider>
            <App />
          </UsersProvider>
        </CurrentUserProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
