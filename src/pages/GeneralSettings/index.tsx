/**
 * 通用配置管理页面
 */

import { useEffect, useState } from 'react';
import {
  Pencil,
  Filter,
  RefreshCw,
  Settings,
  Database,
  Link as LinkIcon,
  Mail,
  Shield,
  Code,
  Bot,
  Puzzle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GeneralSettingsDialog } from '@/components/general-settings-dialog';
import {
  getGeneralSettingsList,
  updateGeneralSettings,
} from '@/api/general-settings';
import type {
  GeneralSettings,
  Category,
} from '@/api/general-settings/types';
import { toast } from '@/lib/toast';

// 类别图标和颜色配置
const categoryConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
  system: { icon: Settings, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  mongodb: { icon: Database, color: 'text-green-600', bgColor: 'bg-green-50' },
  agent: { icon: Bot, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  plugin: { icon: Puzzle, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  external: { icon: LinkIcon, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  email: { icon: Mail, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  auth: { icon: Shield, color: 'text-red-600', bgColor: 'bg-red-50' },
  default: { icon: Code, color: 'text-gray-600', bgColor: 'bg-gray-50' },
};

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<GeneralSettings[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSettings, setEditingSettings] = useState<GeneralSettings | null>(null);

  // 加载配置列表
  const loadSettings = async () => {
    setLoading(true);
    try {
      const params = selectedCategory !== 'all' ? { category: selectedCategory } : undefined;
      const response = await getGeneralSettingsList(params);
      const list = response.list || [];
      setSettings(list);
      
      // 从配置列表中提取类别信息
      const categoryMap = new Map<string, { count: number; firstSettingsId: string }>();
      list.forEach((item) => {
        const existing = categoryMap.get(item.category);
        if (existing) {
          categoryMap.set(item.category, {
            count: existing.count + 1,
            firstSettingsId: existing.firstSettingsId, // 保持第一个 settingsId
          });
        } else {
          categoryMap.set(item.category, {
            count: 1,
            firstSettingsId: item.settingsId,
          });
        }
      });
      
      // 按照类别的第一个 settingsId 排序（字符串排序）
      const categoriesData: Category[] = Array.from(categoryMap.entries())
        .map(([category, info]) => ({
          category,
          count: info.count,
        }))
        .sort((a, b) => {
          const aId = categoryMap.get(a.category)!.firstSettingsId;
          const bId = categoryMap.get(b.category)!.firstSettingsId;
          return aId.localeCompare(bId);
        });
      
      setCategories(categoriesData);
    } catch (error) {
      // 静默处理错误
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [selectedCategory]);

  // 筛选配置
  const filteredSettings = settings.filter((item) => {
    const matchSearch =
      item.displayName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.category.toLowerCase().includes(searchText.toLowerCase());
    return matchSearch;
  });

  // 按类别分组
  const settingsByCategory = filteredSettings.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, GeneralSettings[]>);

  // 按照每个类别的第一个 settingsId 排序（字符串排序）
  const categoriesList = Object.keys(settingsByCategory).sort((a, b) => {
    const aFirstId = settingsByCategory[a][0]?.settingsId || '';
    const bFirstId = settingsByCategory[b][0]?.settingsId || '';
    return aFirstId.localeCompare(bFirstId);
  });

  const handleUpdate = async (data: any) => {
    const currentSettings = editingSettings;
    if (!currentSettings) {
      toast.error('No settings selected');
      return;
    }
    
    // 使用 settingsId（UUID 格式字符串）进行更新
    const settingsId = currentSettings.settingsId;
    if (!settingsId) {
      console.error('Settings ID is missing:', currentSettings);
      toast.error('Settings ID is missing. Please refresh the page.');
      return;
    }
    
    try {
      await updateGeneralSettings(settingsId, data);
      toast.success('update success');
      // 更新成功后清空 editingSettings 并关闭对话框
      setEditingSettings(null);
      setDialogOpen(false);
      loadSettings();
    } catch (error) {
      toast.error('update failed');
      throw error;
    }
  };

  // 打开编辑对话框
  const openEditDialog = (item: GeneralSettings) => {
    setEditingSettings(item);
    setDialogOpen(true);
  };

  // 获取类别配置
  const getCategoryConfig = (category: string) => {
    return categoryConfig[category] || categoryConfig.default;
  };

  // 渲染单个值
  const renderValue = (value: any) => {
    // 字符串类型
    if (typeof value === 'string') {
      return <span className="text-xs text-foreground break-all">{value}</span>;
    }
    
    // 数组类型
    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, idx) => (
            <Badge key={idx} variant="secondary" className="text-[10px]">
              {String(item)}
            </Badge>
          ))}
        </div>
      );
    }
    
    // 对象类型
    if (typeof value === 'object' && value !== null) {
      return (
        <div className="space-y-0.5">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="text-xs text-muted-foreground">
              <span className="font-medium">{k}:</span> {String(v)}
            </div>
          ))}
        </div>
      );
    }
    
    // 其他类型
    return <span className="text-xs text-foreground">{String(value)}</span>;
  };

  // 渲染配置内容（简洁的键值对列表）
  const renderConfigData = (data: Record<string, any>) => {
    if (!data || Object.keys(data).length === 0) {
      return <span className="text-muted-foreground text-sm">-</span>;
    }

    return (
      <div className="space-y-1 font-mono text-sm">
        {Object.entries(data).map(([key, value], index) => (
          <div key={key}>
            <span className="text-muted-foreground">{key}:</span>{' '}
            <span className="text-foreground font-medium">{renderValue(value)}</span>
            {index < Object.entries(data).length - 1 && <br />}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">General Settings Management</h2>
          <p className="text-muted-foreground">
            Manage the general settings of the system, including various system settings
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* 筛选栏 */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search configuration name, category..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-auto min-w-[120px] gap-1.5">
                <Filter className="h-4 w-4 shrink-0" />
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.category} value={cat.category}>
                    {cat.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={loadSettings}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* 按类别分组的配置 */}
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : categoriesList.length === 0 ? (
            <div className="text-center py-8">No configuration data</div>
          ) : (
            <div className="space-y-6">
              {categoriesList.map((category) => {
                const config = getCategoryConfig(category);
                const Icon = config.icon;
                
                return (
                  <div 
                    key={category} 
                    className="rounded-xl border border-border bg-card shadow-sm"
                  >
                    {/* 类别标题 */}
                    <div className="flex items-center justify-between px-5 py-3 border-b">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${config.color}`} />
                        <h3 className="text-foreground font-semibold">{category}</h3>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {settingsByCategory[category].length} items
                      </span>
                    </div>
                    
                    {/* 表格 */}
                    <table className="w-full text-sm">
                      <tbody>
                        {settingsByCategory[category].map((item, index) => (
                          <tr 
                            key={`${category}-${item.settingsId || index}`} 
                            className={`hover:bg-muted/50 transition-colors ${index !== 0 ? 'border-t' : ''}`}
                          >
                            <td className="w-1/5 px-5 py-3 font-medium text-foreground">
                              {item.displayName}
                            </td>
                            <td className="w-1/5 px-5 py-3">
                              <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground">
                                {item.name}
                              </code>
                            </td>
                            <td className="w-2/5 px-5 py-3">
                              {renderConfigData(item.data)}
                            </td>
                            <td className="w-1/5 px-5 py-3 text-muted-foreground">
                              {item.description || '-'}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(item)}
                                className="text-muted-foreground hover:text-primary"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      <GeneralSettingsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        settings={editingSettings}
        onSubmit={handleUpdate}
      />
    </div>
  );
}

