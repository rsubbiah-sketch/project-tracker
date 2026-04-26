import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User } from '../types';

interface UsersContextType {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  findUser: (id: string) => User;
}

const UNKNOWN_USER: User = { id: '', name: 'Unknown', role: '', av: '?' };

const UsersContext = createContext<UsersContextType>({
  users: [],
  setUsers: () => {},
  findUser: () => UNKNOWN_USER,
});

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);

  const findUser = useCallback(
    (id: string): User => {
      if (!id) return { id: '', name: 'Unassigned', role: '', av: '?' };
      return users.find(u => u.id === id) || { id, name: id, role: '', av: id.slice(0, 2).toUpperCase() };
    },
    [users],
  );

  return (
    <UsersContext.Provider value={{ users, setUsers, findUser }}>
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers(): User[] {
  return useContext(UsersContext).users;
}

export function useSetUsers(): React.Dispatch<React.SetStateAction<User[]>> {
  return useContext(UsersContext).setUsers;
}

export function useFindUser(): (id: string) => User {
  return useContext(UsersContext).findUser;
}
