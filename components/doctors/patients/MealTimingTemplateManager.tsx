'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Save, X, Clock, UtensilsCrossed } from 'lucide-react';
import axios from 'axios';

interface MealTiming {
  id: string;
  name: string;
  order: number;
  icon: string;
  color: string;
}

interface MealTimingTemplate {
  id: number;
  name: string;
  mealTimings: MealTiming[];
  isDefault: boolean;
  createdAt: string;
}

interface MealTimingTemplateManagerProps {
  dieticianId: number;
  onTemplateSelect: (template: MealTimingTemplate) => void;
  selectedTemplate?: MealTimingTemplate | null;
}

const DEFAULT_MEAL_TIMINGS: MealTiming[] = [
  { id: 'breakfast', name: 'Breakfast', order: 1, icon: '🌅', color: 'bg-orange-100 text-orange-800' },
  { id: 'midMorning', name: 'Mid-morning Snack', order: 2, icon: '☕', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'lunch', name: 'Lunch', order: 3, icon: '🍽️', color: 'bg-green-100 text-green-800' },
  { id: 'eveningSnack', name: 'Evening Snack', order: 4, icon: '🍎', color: 'bg-blue-100 text-blue-800' },
  { id: 'dinner', name: 'Dinner', order: 5, icon: '🌙', color: 'bg-purple-100 text-purple-800' },
  { id: 'bedtime', name: 'Bedtime', order: 6, icon: '🛏️', color: 'bg-gray-100 text-gray-800' },
];

const MEAL_ICONS = ['🌅', '☕', '🍽️', '🍎', '🌙', '🛏️', '🥗', '🥤', '🍰', '🥜'];

export default function MealTimingTemplateManager({ 
  dieticianId, 
  onTemplateSelect, 
  selectedTemplate 
}: MealTimingTemplateManagerProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<MealTimingTemplate[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MealTimingTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [mealTimings, setMealTimings] = useState<MealTiming[]>(DEFAULT_MEAL_TIMINGS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [dieticianId]);

  const loadTemplates = async () => {
    try {
      const response = await axios.get(`/api/doctor/diet-meal-timings?dieticianId=${dieticianId}`);
      if (response.data.success) {
        setTemplates(response.data.templates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) {
      toast({ variant: 'destructive', title: 'Template name is required' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/doctor/diet-meal-timings', {
        dieticianId,
        name: templateName,
        mealTimings,
        isDefault: templates.length === 0 // First template becomes default
      });

      if (response.data.success) {
        toast({ variant: 'success', title: 'Template created successfully' });
        setIsCreateModalOpen(false);
        setTemplateName('');
        setMealTimings(DEFAULT_MEAL_TIMINGS);
        loadTemplates();
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to create template', description: error?.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !templateName.trim()) {
      toast({ variant: 'destructive', title: 'Template name is required' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/doctor/diet-meal-timings', {
        dieticianId,
        name: templateName,
        mealTimings,
        isDefault: editingTemplate.isDefault,
        templateId: editingTemplate.id
      });

      if (response.data.success) {
        toast({ variant: 'success', title: 'Template updated successfully' });
        setIsEditModalOpen(false);
        setEditingTemplate(null);
        setTemplateName('');
        setMealTimings(DEFAULT_MEAL_TIMINGS);
        loadTemplates();
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to update template', description: error?.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await axios.delete(`/api/doctor/diet-meal-timings?templateId=${templateId}`);
      if (response.data.success) {
        toast({ variant: 'success', title: 'Template deleted successfully' });
        loadTemplates();
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to delete template', description: error?.message });
    }
  };

  const handleEditTemplate = (template: MealTimingTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setMealTimings(template.mealTimings);
    setIsEditModalOpen(true);
  };

  const addMealTiming = () => {
    const newId = `custom_${Date.now()}`;
    const newTiming: MealTiming = {
      id: newId,
      name: 'New Meal',
      order: mealTimings.length + 1,
      icon: MEAL_ICONS[Math.floor(Math.random() * MEAL_ICONS.length)],
      color: 'bg-gray-100 text-gray-800'
    };
    setMealTimings([...mealTimings, newTiming]);
  };

  const removeMealTiming = (id: string) => {
    if (mealTimings.length <= 1) {
      toast({ variant: 'destructive', title: 'At least one meal timing is required' });
      return;
    }
    setMealTimings(mealTimings.filter(t => t.id !== id));
  };

  const updateMealTiming = (id: string, field: keyof MealTiming, value: string | number) => {
    setMealTimings(mealTimings.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const reorderMealTiming = (id: string, direction: 'up' | 'down') => {
    const index = mealTimings.findIndex(t => t.id === id);
    if (index === -1) return;

    const newTimings = [...mealTimings];
    if (direction === 'up' && index > 0) {
      [newTimings[index], newTimings[index - 1]] = [newTimings[index - 1], newTimings[index]];
    } else if (direction === 'down' && index < newTimings.length - 1) {
      [newTimings[index], newTimings[index + 1]] = [newTimings[index + 1], newTimings[index]];
    }

    // Update order numbers
    newTimings.forEach((timing, idx) => {
      timing.order = idx + 1;
    });

    setMealTimings(newTimings);
  };

  const resetToDefault = () => {
    setMealTimings(DEFAULT_MEAL_TIMINGS);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Meal Timing Templates</h3>
        <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Template List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card 
            key={template.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onTemplateSelect(template)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{template.name}</CardTitle>
                {template.isDefault && (
                  <Badge variant="secondary" className="text-xs">Default</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {template.mealTimings.slice(0, 3).map((timing) => (
                  <div key={timing.id} className="flex items-center gap-2 text-xs text-gray-600">
                    <span>{timing.icon}</span>
                    <span className="truncate">{timing.name}</span>
                  </div>
                ))}
                {template.mealTimings.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{template.mealTimings.length - 3} more
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditTemplate(template);
                  }}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTemplate(template.id);
                  }}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Template Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Meal Timing Template</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Template Name</label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Standard 6-Meal Plan"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Meal Timings</label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetToDefault}>
                  Reset to Default
                </Button>
                <Button variant="outline" size="sm" onClick={addMealTiming}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Timing
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {mealTimings.map((timing, index) => (
                <div key={timing.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => reorderMealTiming(timing.id, 'up')}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => reorderMealTiming(timing.id, 'down')}
                      disabled={index === mealTimings.length - 1}
                    >
                      ↓
                    </Button>
                  </div>
                  
                  <Input
                    value={timing.name}
                    onChange={(e) => updateMealTiming(timing.id, 'name', e.target.value)}
                    className="flex-1"
                    placeholder="Meal name"
                  />
                  
                  <select
                    value={timing.icon}
                    onChange={(e) => updateMealTiming(timing.id, 'icon', e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    {MEAL_ICONS.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMealTiming(timing.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate} disabled={loading}>
                {loading ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Template Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Meal Timing Template</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Template Name</label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Standard 6-Meal Plan"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Meal Timings</label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addMealTiming}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Timing
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {mealTimings.map((timing, index) => (
                <div key={timing.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => reorderMealTiming(timing.id, 'up')}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => reorderMealTiming(timing.id, 'down')}
                      disabled={index === mealTimings.length - 1}
                    >
                      ↓
                    </Button>
                  </div>
                  
                  <Input
                    value={timing.name}
                    onChange={(e) => updateMealTiming(timing.id, 'name', e.target.value)}
                    className="flex-1"
                    placeholder="Meal name"
                  />
                  
                  <select
                    value={timing.icon}
                    onChange={(e) => updateMealTiming(timing.id, 'icon', e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    {MEAL_ICONS.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMealTiming(timing.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTemplate} disabled={loading}>
                {loading ? 'Updating...' : 'Update Template'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
