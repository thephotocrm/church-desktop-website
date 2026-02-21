import { useState, useEffect, useCallback, type ReactNode } from "react";
import { MemberAuthContext, type MemberProfile } from "@/hooks/use-member-auth";

const TOKEN_KEY = "fpc_access_token";
const REFRESH_KEY = "fpc_refresh_token";

export function MemberAuthProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  );
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (token: string) => {
    try {
      const res = await fetch("/api/members/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMember(data);
      } else {
        // Token invalid — try refresh
        const refreshToken = localStorage.getItem(REFRESH_KEY);
        if (refreshToken) {
          const refreshRes = await fetch("/api/members/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });
          if (refreshRes.ok) {
            const tokens = await refreshRes.json();
            localStorage.setItem(TOKEN_KEY, tokens.accessToken);
            localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
            setAccessToken(tokens.accessToken);
            // Retry profile fetch with new token
            const retryRes = await fetch("/api/members/me", {
              headers: { Authorization: `Bearer ${tokens.accessToken}` },
            });
            if (retryRes.ok) {
              setMember(await retryRes.json());
              return;
            }
          }
        }
        // Both failed — clear everything
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        setAccessToken(null);
        setMember(null);
      }
    } catch {
      setMember(null);
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      fetchProfile(accessToken).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [accessToken, fetchProfile]);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/members/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Login failed");
    }
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    setAccessToken(data.accessToken);
    setMember(data.member);
  };

  const register = async (regData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => {
    const res = await fetch("/api/members/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regData),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Registration failed");
    }
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    setAccessToken(data.accessToken);
    setMember(data.member);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setAccessToken(null);
    setMember(null);
  };

  const refreshProfile = async () => {
    if (accessToken) {
      await fetchProfile(accessToken);
    }
  };

  const exchangeCode = async (code: string) => {
    const res = await fetch("/api/members/exchange-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Code exchange failed");
    }
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    setAccessToken(data.accessToken);
    setMember(data.member);
  };

  return (
    <MemberAuthContext.Provider
      value={{ member, accessToken, isLoading, login, register, logout, refreshProfile, exchangeCode }}
    >
      {children}
    </MemberAuthContext.Provider>
  );
}
