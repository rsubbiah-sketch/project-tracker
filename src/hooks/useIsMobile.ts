import { useState, useEffect } from 'react';

export function useIsMobile(bp = 768) {
  const [mob, setMob] = useState(typeof window !== "undefined" && window.innerWidth < bp);
  useEffect(() => {
    const h = () => setMob(window.innerWidth < bp);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, [bp]);
  return mob;
}
