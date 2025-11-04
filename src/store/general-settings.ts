/**
 * 通用配置状态管理
 */

import { create } from 'zustand';
import type { GeneralSettings } from '@/api/general-settings/types';

interface GeneralSettingsState {
  settings: GeneralSettings[];
  selectedCategory: string;
  setSettings: (settings: GeneralSettings[]) => void;
  setSelectedCategory: (category: string) => void;
  updateSetting: (id: number, setting: GeneralSettings) => void;
  removeSetting: (id: number) => void;
}

export const useGeneralSettingsStore = create<GeneralSettingsState>((set) => ({
  settings: [],
  selectedCategory: 'all',
  setSettings: (settings) => set({ settings }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  updateSetting: (id, setting) =>
    set((state) => ({
      settings: state.settings.map((s) => (s.id === id ? setting : s)),
    })),
  removeSetting: (id) =>
    set((state) => ({
      settings: state.settings.filter((s) => s.id !== id),
    })),
}));

