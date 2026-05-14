import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { getCommunity } from "../firebase/firestore.js";

const CommunityContext = createContext(null);

export function CommunityProvider({ children }) {
  const { user } = useAuth();
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let canceled = false;
    async function load() {
      if (!user?.communityId) {
        setCommunity(null);
        return;
      }
      setLoading(true);
      const c = await getCommunity(user.communityId);
      if (!canceled) {
        setCommunity(c);
        setLoading(false);
      }
    }
    load();
    return () => { canceled = true; };
  }, [user?.communityId]);

  return (
    <CommunityContext.Provider value={{ community, loading, setCommunity }}>
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error("useCommunity must be used inside <CommunityProvider>");
  return ctx;
}
