import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, isFirebaseConfigured } from "../firebase/config.js";
import { getUserById, updateUser } from "../firebase/firestore.js";
import { getMockSession, signOut as svcSignOut } from "../firebase/auth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let unsubscribe = () => {};
    if (isFirebaseConfigured) {
      unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          const profile = await getUserById(fbUser.uid);
          setUser(profile);
        } else {
          setUser(null);
        }
        setLoading(false);
      });
    } else {
      const session = getMockSession();
      if (session?.uid) {
        getUserById(session.uid).then((u) => {
          setUser(u);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }
    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      setUser,
      async refresh() {
        if (!user?.id) return;
        const fresh = await getUserById(user.id);
        setUser(fresh);
      },
      async updateProfile(patch) {
        if (!user?.id) return;
        await updateUser(user.id, patch);
        setUser({ ...user, ...patch });
      },
      async signOut() {
        await svcSignOut();
        setUser(null);
      },
      async switchRole() {
        if (!user?.id) return;
        const nextRole = user.role === "admin" ? "user" : "admin";
        await updateUser(user.id, { role: nextRole });
        setUser({ ...user, role: nextRole });
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
