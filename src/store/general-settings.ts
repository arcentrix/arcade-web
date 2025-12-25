/**
 * 通用配置状态管理
 */

import { create } from 'zustand';
import type { GeneralSettings, SettingsId, UpdateGeneralSettingsRequest } from '@/api/general-settings/types';
import { updateGeneralSettings } from '@/api/general-settings';

interface GeneralSettingsState {
  settings: GeneralSettings[];
  selectedCategory: string;
  setSettings: (settings: GeneralSettings[]) => void;
  setSelectedCategory: (category: string) => void;
  updateSetting: (settingsId: SettingsId, data: UpdateGeneralSettingsRequest) => Promise<GeneralSettings>;
  removeSetting: (settingsId: SettingsId) => void;
  getSettingById: (settingsId: SettingsId) => GeneralSettings | undefined;
}

export const useGeneralSettingsStore = create<GeneralSettingsState>((set, get) => ({
  settings: [],
  selectedCategory: 'all',
  setSettings: (settings) => set({ settings }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  updateSetting: async (settingsId, data) => {
    // 调用 API 更新配置，使用 list 返回的 settingsId（UUID 格式字符串）
    const updatedSetting = await updateGeneralSettings(settingsId, data);
    // 更新本地状态，匹配 settingsId
    set((state) => ({
      settings: state.settings.map((s) => 
        s.settingsId === settingsId ? updatedSetting : s
      ),
    }));
    return updatedSetting;
  },
  removeSetting: (settingsId) =>
    set((state) => ({
      settings: state.settings.filter((s) => s.settingsId !== settingsId),
    })),
  getSettingById: (settingsId) => {
    return get().settings.find((s) => s.settingsId === settingsId);
  },
}));

