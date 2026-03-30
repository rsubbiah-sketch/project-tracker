import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './useAuth';
import type { User } from '../types';

const DEFAULT_EMAIL = 'rsubbiah@upscaleai.com';

function userFromEmail(email: string): User {
  const name = email.split('@')[0].toUpperCase();
  const av = name.slice(0, 2);
  return { id: email, name, role: 'admin', av };
}

const CurrentUserContext = createContext<User>(userFromEmail(DEFAULT_EMAIL));

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isAuthenticated } = useAuth();
  const email = localStorage.getItem('user_email') || DEFAULT_EMAIL;
  const [user, setUser] = useState<User>(userFromEmail(email));

  useEffect(() => {
    if (isAuthenticated && authUser) {
      // Use authenticated user from API
      const name = authUser.name || authUser.email.split('@')[0];
      const av = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      setUser({ id: authUser.id, name, role: authUser.role || 'commenter', av });
   // setUser({ id: authUser.id, name, role: 'admin' , av });
    
    }
  }, [isAuthenticated, authUser]);

  return (
    <CurrentUserContext.Provider value={user}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): User {
  return useContext(CurrentUserContext);
}
