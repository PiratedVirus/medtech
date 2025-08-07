"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface TypeAheadInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type: "complaints" | "medicines" | "frequency" | "medicineTime" | "duration" | "advice" | "tests";
  className?: string;
  onAddItem?: (item: Suggestion) => void;
  showAddButtons?: boolean;
  onFrequencyInput?: (input: string) => string;
}

interface Suggestion {
  id: string;
  text?: string;
  name?: string;
  value?: string;
  category?: string;
  severity?: string;
  usageCount?: number;
  frequency?: string[];
  medicineTime?: string[];
  duration?: string[];
}

export default function TypeAheadInput({
  value,
  onChange,
  placeholder,
  type,
  className,
  onAddItem,
  showAddButtons = false,
  onFrequencyInput,
}: TypeAheadInputProps) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Mock suggestions for demo - replace with actual API calls
  const mockSuggestions: Record<string, Suggestion[]> = {
    complaints: [
      { id: "1", text: "Blood sugar levels have improved slightly, but A1c remains above the target of <7%", category: "Diabetes", severity: "MODERATE" },
      { id: "2", text: "Experiencing frequent urination and increased thirst", category: "Diabetes", severity: "MODERATE" },
      { id: "3", text: "Fatigue and weakness in the morning", category: "General", severity: "GOOD" },
      { id: "4", text: "Mild chest pain during physical activity", category: "Cardiac", severity: "RISK" },
      { id: "5", text: "Persistent cough for the past week", category: "Respiratory", severity: "MODERATE" },
    ],
    medicines: [
      { id: "1", name: "Metformin 500mg", category: "Diabetes", frequency: ["1-0-0", "1-0-1", "1-1-1"], medicineTime: ["Pre-meal", "Post-meal"], duration: ["7d", "14d", "30d"] },
      { id: "2", name: "Glimepiride 1mg", category: "Diabetes", frequency: ["1-0-0", "0-1-0"], medicineTime: ["Pre-meal"], duration: ["30d"] },
      { id: "3", name: "Paracetamol 500mg", category: "Pain Relief", frequency: ["0-0-1", "1-1-1"], medicineTime: ["Post-meal", "Any time"], duration: ["3d", "5d"] },
      { id: "4", name: "Amoxicillin 500mg", category: "Antibiotic", frequency: ["1-1-1", "1-0-1"], medicineTime: ["Post-meal"], duration: ["7d", "10d"] },
      { id: "5", name: "Omeprazole 20mg", category: "Gastric", frequency: ["1-0-0"], medicineTime: ["Pre-meal"], duration: ["14d", "30d"] },
    ],
    frequency: [
      { id: "1", value: "Once daily", usageCount: 45 },
      { id: "2", value: "Twice daily", usageCount: 32 },
      { id: "3", value: "Three times daily", usageCount: 18 },
      { id: "4", value: "As needed", usageCount: 12 },
      { id: "5", value: "Every 6 hours", usageCount: 8 },
    ],
    medicineTime: [
      { id: "1", value: "Morning", usageCount: 52 },
      { id: "2", value: "Evening", usageCount: 48 },
      { id: "3", value: "Before meals", usageCount: 25 },
      { id: "4", value: "After meals", usageCount: 20 },
      { id: "5", value: "Bedtime", usageCount: 15 },
    ],
    duration: [
      { id: "1", value: "7 days", usageCount: 38 },
      { id: "2", value: "15 days", usageCount: 28 },
      { id: "3", value: "30 days", usageCount: 22 },
      { id: "4", value: "3 days", usageCount: 12 },
      { id: "5", value: "10 days", usageCount: 8 },
    ],
    advice: [
      { id: "1", value: "Take medicine regularly as prescribed", usageCount: 35 },
      { id: "2", value: "Follow a balanced diet", usageCount: 28 },
      { id: "3", value: "Exercise regularly", usageCount: 22 },
      { id: "4", value: "Monitor blood sugar levels", usageCount: 18 },
      { id: "5", value: "Avoid smoking and alcohol", usageCount: 15 },
    ],
    tests: [
      { id: "1", value: "Complete Blood Count (CBC)", usageCount: 42 },
      { id: "2", value: "Blood Sugar (Fasting)", usageCount: 38 },
      { id: "3", value: "HbA1c Test", usageCount: 25 },
      { id: "4", value: "Lipid Profile", usageCount: 20 },
      { id: "5", value: "Kidney Function Test", usageCount: 15 },
    ],
  };

  const fetchSuggestions = async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/doctor/prescription/typeahead?type=${type}&query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }
      
      const data = await response.json();
      
      // Transform the data to match our interface
      const transformedData = data.data?.map((item: any) => {
        if (type === "complaints") {
          return {
            id: item.id.toString(),
            text: item.text,
            category: item.category,
            severity: item.severity,
          };
        } else if (type === "medicines") {
          return {
            id: item.id.toString(),
            name: item.name,
            category: item.category,
            frequency: item.frequency || [],
            medicineTime: item.medicineTime || [],
            duration: item.duration || [],
          };
        } else {
          return {
            id: item.id.toString(),
            value: item.value,
            category: item.category,
            usageCount: item.usageCount,
          };
        }
      }) || [];
      
      setSuggestions(transformedData);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      // Fallback to mock data
      const mockData = mockSuggestions[type] || [];
      const filtered = mockData.filter(item => {
        const searchText = item.text || item.name || item.value || "";
        return searchText.toLowerCase().includes(query.toLowerCase());
      });
      setSuggestions(filtered.slice(0, 5));
    } finally {
      setIsLoading(false);
    }
  };

  const createNewItem = async (text: string) => {
    try {
      const response = await fetch("/api/doctor/prescription/typeahead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, value: text }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create item");
      }
      
      const data = await response.json();
      
      // Add to suggestions based on type
      let newItem;
      if (type === "complaints") {
        newItem = {
          id: data.data.id.toString(),
          text: text,
          category: "General",
          severity: "MODERATE",
        };
      } else if (type === "medicines") {
        newItem = {
          id: data.data.id.toString(),
          name: text,
          category: "General",
          frequency: [],
          medicineTime: [],
          duration: [],
        };
      } else {
        newItem = {
          id: data.data.id.toString(),
          value: text,
          category: "general",
          usageCount: 1,
        };
      }
      
      setSuggestions(prev => [newItem, ...prev.slice(0, 4)]);
      
      // Show success toast
      toast({
        title: "Success",
        description: `"${text}" added to ${type} catalogue successfully`,
      });
    } catch (error) {
      console.error("Error creating new item:", error);
      // Show error toast
      toast({
        title: "Error",
        description: `Failed to add "${text}" to ${type} catalogue`,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, type]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        const selected = suggestions[selectedIndex];
        const displayValue = selected.text || selected.name || selected.value || "";
        onChange(displayValue);
        setShowSuggestions(false);
        setSelectedIndex(-1);
      } else if (value.trim() && value.trim().length >= 2) {
        createNewItem(value.trim());
        setShowSuggestions(false);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Handle frequency input for medicines
    if (type === "frequency" && onFrequencyInput) {
      const processedValue = onFrequencyInput(newValue);
      onChange(processedValue);
    } else {
      onChange(newValue);
    }
    
    setShowSuggestions(newValue.trim().length >= 2);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (showAddButtons && onAddItem) {
      onAddItem(suggestion);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    } else {
      const displayValue = suggestion.text || suggestion.name || suggestion.value || "";
      onChange(displayValue);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleAddNew = () => {
    if (value.trim() && value.trim().length >= 2) {
      createNewItem(value.trim());
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(value.trim().length >= 2)}
          placeholder={placeholder}
          className={cn("pl-10 min-w-[400px]", className)}
        />
      </div>

      {showSuggestions && (
        <Card
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto shadow-lg border"
        >
          <div className="p-2">
            {isLoading ? (
              <div className="p-2 text-sm text-gray-500">Loading...</div>
            ) : (
              <>
                {suggestions.length > 0 ? (
                  suggestions.map((suggestion, index) => {
                    const displayValue = suggestion.text || suggestion.name || suggestion.value || "";
                    const isSelected = index === selectedIndex;
                    
                    return (
                      <div
                        key={suggestion.id}
                        className={cn(
                          "p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors",
                          isSelected && "bg-blue-50 border border-blue-200"
                        )}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{displayValue}</div>
                            {suggestion.category && (
                              <div className="text-xs text-gray-500">{suggestion.category}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {suggestion.usageCount && (
                              <div className="text-xs text-gray-400">
                                Used {suggestion.usageCount} times
                              </div>
                            )}
                            {showAddButtons && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onAddItem) {
                                    onAddItem(suggestion);
                                  }
                                }}
                              >
                                <Plus className="h-3 w-3 text-primary" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : value.trim() && value.trim().length >= 2 ? (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    No suggestions found
                  </div>
                ) : null}
                
                {value.trim() && value.trim().length >= 2 && !suggestions.some(suggestion => {
                  const suggestionText = suggestion.text || suggestion.name || suggestion.value || "";
                  return suggestionText.toLowerCase() === value.trim().toLowerCase();
                }) && (
                  <div
                    className="p-3 rounded-lg cursor-pointer bg-primary"
                    onClick={handleAddNew}
                  >
                    <div className="flex items-center justify-center text-white font-bold">
                      <Plus className="h-4 w-4 mr-2" />
                      Add "{value}" to {type} catalogue
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
} 