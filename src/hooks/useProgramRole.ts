import { useState, useEffect } from 'react';
import { useCurrentUser } from './useCurrentUser';
import { fetchMyProgramRole } from '../services/api';

/**
 * Returns the current user's effective role on a specific program.
 * Admin bypasses per-program checks. Non-members default to commenter.
 */
export function useProgramRole(programId: string | null | undefined) {
  const user = useCurrentUser();
  const [programRole, setProgramRole] = useState<string>('commenter');
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!programId) {
      setLoading(false);
      return;
    }

    if (user.role === 'admin') {
      setProgramRole('admin');
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchMyProgramRole(programId)
      .then(data => {
        setProgramRole(data.role);
        setIsOwner(data.isOwner);
      })
      .catch(() => setProgramRole('commenter'))
      .finally(() => setLoading(false));
  }, [programId, user.id, user.role]);

  const isAdmin = programRole === 'admin';
  const isEditor = isAdmin || programRole === 'editor';
  const isCommenter = isEditor || programRole === 'commenter';

  return { programRole, isOwner, isAdmin, isEditor, isCommenter, isViewer: true, loading };
}
