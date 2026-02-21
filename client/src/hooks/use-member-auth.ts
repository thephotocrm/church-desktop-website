import { createContext, useContext } from "react";

export interface MemberProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  photoUrl: string | null;
  title: string | null;
  role: string;
  status: string;
  hidePhone: boolean | null;
  hideEmail: boolean | null;
  createdAt: string;
}

export interface MemberAuthContextType {
  member: MemberProfile | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

export const MemberAuthContext = createContext<MemberAuthContextType>({
  member: null,
  accessToken: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshProfile: async () => {},
});

export function useMemberAuth() {
  return useContext(MemberAuthContext);
}
