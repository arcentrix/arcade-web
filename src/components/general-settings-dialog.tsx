/**
 * 通用配置对话框组件
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { GeneralSettings } from '@/api/general-settings/types';

interface JsonSchemaProperty {
  type: string;
  title?: string;
  description?: string;
  enum?: any[];
  default?: any;
  minimum?: number;
  maximum?: number;
  format?: string;
}

interface GeneralSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings?: GeneralSettings | null;
  onSubmit: (data: {
    category: string;
    name: string;
    displayName: string;
    data: Record<string, any>;
    schema?: Record<string, any>;
    description?: string;
  }) => Promise<void>;
}

export function GeneralSettingsDialog({
  open,
  onOpenChange,
  settings,
  onSubmit,
}: GeneralSettingsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings && open) {
      // 初始化表单数据
      setDisplayName(settings.displayName);
      setDescription(settings.description || '');
      
      // 根据 schema 初始化表单数据
      const initialData: Record<string, any> = {};
      if (settings.schema && settings.schema.properties) {
        const properties = settings.schema.properties as Record<string, JsonSchemaProperty>;
        Object.keys(properties).forEach((key) => {
          initialData[key] = settings.data[key] ?? properties[key].default ?? getDefaultValue(properties[key]);
        });
      } else {
        // 如果没有 schema，使用现有数据
        Object.assign(initialData, settings.data);
      }
      
      setFormData(initialData);
      setErrors({});
    }
  }, [settings, open]);

  // 获取默认值
  const getDefaultValue = (property: JsonSchemaProperty): any => {
    if (property.default !== undefined) {
      return property.default;
    }
    switch (property.type) {
      case 'string':
        return '';
      case 'integer':
      case 'number':
        return 0;
      case 'boolean':
        return false;
      case 'array':
        return [];
      case 'object':
        return {};
      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name cannot be empty';
    }

    // 根据 schema 验证字段
    if (settings?.schema && settings.schema.properties) {
      const properties = settings.schema.properties as Record<string, JsonSchemaProperty>;
      const required = settings.schema.required || [];
      
      Object.keys(properties).forEach((key) => {
        const property = properties[key];
        const value = formData[key];
        
        // 检查必填字段
        if (required.includes(key) && (value === undefined || value === null || value === '')) {
          newErrors[key] = `${property.title || key} is required`;
          return;
        }
        
        // 类型验证
        if (value !== undefined && value !== null && value !== '') {
          if (property.type === 'integer' && !Number.isInteger(Number(value))) {
            newErrors[key] = `${property.title || key} must be an integer`;
          } else if (property.type === 'number' && isNaN(Number(value))) {
            newErrors[key] = `${property.title || key} must be a number`;
          }
          
          // 枚举验证
          if (property.enum && !property.enum.includes(value)) {
            newErrors[key] = `${property.title || key} must be one of: ${property.enum.join(', ')}`;
          }
          
          // 范围验证
          if (property.type === 'number' || property.type === 'integer') {
            const numValue = Number(value);
            if (property.minimum !== undefined && numValue < property.minimum) {
              newErrors[key] = `${property.title || key} must be at least ${property.minimum}`;
            }
            if (property.maximum !== undefined && numValue > property.maximum) {
              newErrors[key] = `${property.title || key} must be at most ${property.maximum}`;
            }
          }
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // 转换数据类型
      let processedData: Record<string, any> = {};
      if (settings?.schema && settings.schema.properties) {
        const properties = settings.schema.properties as Record<string, JsonSchemaProperty>;
        Object.keys(properties).forEach((key) => {
          const property = properties[key];
          let value = formData[key];
          
          // 类型转换
          if (property.type === 'integer') {
            value = parseInt(value, 10);
          } else if (property.type === 'number') {
            value = parseFloat(value);
          } else if (property.type === 'boolean') {
            value = Boolean(value);
          }
          
          processedData[key] = value;
        });
      } else {
        // 如果没有 schema，保持原有的 key，只更新值
        if (settings) {
          Object.keys(settings.data).forEach((key) => {
            processedData[key] = formData[key];
          });
        }
      }

      await onSubmit({
        category: settings!.category,
        name: settings!.name,
        displayName: displayName,
        data: processedData,
        schema: settings!.schema,
        description: description || undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Submit failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 渲染表单字段
  const renderField = (key: string, property: JsonSchemaProperty) => {
    const value = formData[key] ?? getDefaultValue(property);
    const isRequired = settings?.schema?.required?.includes(key) || false;
    const error = errors[key];

    // 枚举类型使用 Select
    if (property.enum && property.enum.length > 0) {
      return (
        <div key={key} className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor={key} className="flex-1">
              <span className="font-mono text-xs text-muted-foreground">{key}:</span>{' '}
              {property.title || key}
              {isRequired && <span className="text-destructive">*</span>}
            </Label>
          </div>
          <Select
            value={String(value)}
            onValueChange={(val) => {
              setFormData({ ...formData, [key]: val });
              if (errors[key]) {
                setErrors({ ...errors, [key]: '' });
              }
            }}
          >
            <SelectTrigger id={key}>
              <SelectValue placeholder={`Select ${property.title || key}`} />
            </SelectTrigger>
            <SelectContent>
              {property.enum.map((option) => (
                <SelectItem key={String(option)} value={String(option)}>
                  {String(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {property.description && (
            <p className="text-xs text-muted-foreground">{property.description}</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      );
    }

    // 数字类型
    if (property.type === 'integer' || property.type === 'number') {
      return (
        <div key={key} className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor={key} className="flex-1">
              <span className="font-mono text-xs text-muted-foreground">{key}:</span>{' '}
              {property.title || key}
              {isRequired && <span className="text-destructive">*</span>}
            </Label>
          </div>
          <Input
            id={key}
            type="number"
            value={value}
            onChange={(e) => {
              const val = e.target.value === '' ? '' : (property.type === 'integer' ? parseInt(e.target.value, 10) : parseFloat(e.target.value));
              setFormData({ ...formData, [key]: val });
              if (errors[key]) {
                setErrors({ ...errors, [key]: '' });
              }
            }}
            min={property.minimum}
            max={property.maximum}
            placeholder={property.description}
          />
          {property.description && (
            <p className="text-xs text-muted-foreground">{property.description}</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      );
    }

    // 布尔类型
    if (property.type === 'boolean') {
      return (
        <div key={key} className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch
              id={key}
              checked={Boolean(value)}
              onCheckedChange={(checked) => {
                setFormData({ ...formData, [key]: checked });
                if (errors[key]) {
                  setErrors({ ...errors, [key]: '' });
                }
              }}
            />
            <Label htmlFor={key} className="cursor-pointer">
              <span className="font-mono text-xs text-muted-foreground">{key}:</span>{' '}
              {property.title || key}
              {isRequired && <span className="text-destructive">*</span>}
            </Label>
          </div>
          {property.description && (
            <p className="text-xs text-muted-foreground">{property.description}</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      );
    }

    // 字符串类型（默认）
    return (
      <div key={key} className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={key} className="flex-1">
            <span className="font-mono text-xs text-muted-foreground">{key}:</span>{' '}
            {property.title || key}
            {isRequired && <span className="text-destructive">*</span>}
          </Label>
        </div>
        <Input
          id={key}
          type={property.format === 'email' ? 'email' : 'text'}
          value={String(value)}
          onChange={(e) => {
            setFormData({ ...formData, [key]: e.target.value });
            if (errors[key]) {
              setErrors({ ...errors, [key]: '' });
            }
          }}
          placeholder={property.description}
        />
        {property.description && (
          <p className="text-xs text-muted-foreground">{property.description}</p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Configuration</DialogTitle>
          <DialogDescription>
            Edit system general configuration item
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* 基本信息 */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="text-sm font-semibold">Basic Information</h3>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={settings?.category || ''}
                  disabled={true}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Configuration Name</Label>
                <Input
                  id="name"
                  value={settings?.name || ''}
                  disabled={true}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">
                  Display Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (errors.displayName) {
                      setErrors({ ...errors, displayName: '' });
                    }
                  }}
                  placeholder="e.g.: JWT Secret, SMTP Config"
                />
                {errors.displayName && (
                  <p className="text-sm text-destructive">{errors.displayName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the configuration"
                />
              </div>
            </div>

            {/* 基于 Schema 的动态表单字段 */}
            {settings?.schema && settings.schema.properties ? (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Configuration Data</h3>
                <div className="grid gap-4">
                  {Object.entries(settings.schema.properties as Record<string, JsonSchemaProperty>).map(
                    ([key, property]) => (
                      <div key={key}>
                        {renderField(key, property)}
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Configuration Data</h3>
                <div className="grid gap-4">
                  {settings && Object.entries(settings.data).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`field-${key}`} className="flex-1">
                          <span className="font-mono text-xs text-muted-foreground">{key}:</span>
                        </Label>
                      </div>
                      <Input
                        id={`field-${key}`}
                        type="text"
                        value={typeof formData[key] === 'object' ? JSON.stringify(formData[key]) : String(formData[key] ?? value)}
                        onChange={(e) => {
                          setFormData({ ...formData, [key]: e.target.value });
                        }}
                        placeholder={`Value for ${key}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

