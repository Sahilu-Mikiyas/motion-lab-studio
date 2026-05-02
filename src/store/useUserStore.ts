import { create } from 'zustand';

export type User = {
  name: string;
  handle: string;
  level: number;
  xp: number;
  xpMax: number;
  earnings: number;
  avatar: string;
  role: 'creator' | 'admin';
};

type UserState = {
  user: User;
  setUser: (u: Partial<User>) => void;
};

export const useUserStore = create<UserState>((set) => ({
  user: {
    name: 'Aiden Vossberg',
    handle: '@aiden.motion',
    level: 7,
    xp: 2840,
    xpMax: 4000,
    earnings: 12480,
    avatar: 'AV',
    role: 'creator',
  },
  setUser: (u) => set((s) => ({ user: { ...s.user, ...u } })),
}));
