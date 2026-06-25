import { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "./api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setUser(await authAPI.me()); } catch {}
      setLoading(false);
    })();
  }, []);

  const signin = async (creds) => { const u = await authAPI.signin(creds); setUser(u); return u; };
  const signup = async (data) => { const u = await authAPI.signup(data); setUser(u); return u; };
  const signout = async () => { await authAPI.signout(); setUser(null); };
  const refresh = async () => { setUser(await authAPI.me()); };
  const update = async (updates) => { const u = await authAPI.updateProfile(updates); setUser(u); return u; };

  return (
    <AuthCtx.Provider value={{ user, loading, signin, signup, signout, refresh, update }}>
      {children}
    </AuthCtx.Provider>
  );
}
