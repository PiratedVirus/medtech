"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Trash2, Edit2, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LabParametersEditorProps {
  value?: string; // JSON string or empty
  onChange: (jsonString: string) => void;
}

interface Section {
  id: string;
  name: string;
  parameters: string[];
}

export default function LabParametersEditor({ value, onChange }: LabParametersEditorProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [newSectionName, setNewSectionName] = useState("");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState("");
  const [addingParameterToSection, setAddingParameterToSection] = useState<string | null>(null);
  const [newParameterName, setNewParameterName] = useState("");

  // Parse initial value
  useEffect(() => {
    if (value) {
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        const sectionsArray: Section[] = Object.entries(parsed).map(([name, params], index) => ({
          id: `section-${index}-${Date.now()}`,
          name,
          parameters: Array.isArray(params) ? params : [],
        }));
        setSections(sectionsArray);
      } catch (e) {
        console.error("Failed to parse lab parameters:", e);
        setSections([]);
      }
    }
  }, [value]);

  // Convert sections to JSON and notify parent
  const updateParent = (updatedSections: Section[]) => {
    const jsonObj: Record<string, string[]> = {};
    updatedSections.forEach((section) => {
      if (section.name && section.parameters.length > 0) {
        jsonObj[section.name] = section.parameters;
      }
    });
    onChange(JSON.stringify(jsonObj));
  };

  // Add new section
  const addSection = () => {
    if (!newSectionName.trim()) return;
    const newSection: Section = {
      id: `section-${Date.now()}`,
      name: newSectionName.trim(),
      parameters: [],
    };
    const updated = [...sections, newSection];
    setSections(updated);
    updateParent(updated);
    setNewSectionName("");
  };

  // Delete section
  const deleteSection = (sectionId: string) => {
    const updated = sections.filter((s) => s.id !== sectionId);
    setSections(updated);
    updateParent(updated);
  };

  // Start editing section name
  const startEditSection = (section: Section) => {
    setEditingSectionId(section.id);
    setEditingSectionName(section.name);
  };

  // Save edited section name
  const saveEditSection = (sectionId: string) => {
    if (!editingSectionName.trim()) {
      setEditingSectionId(null);
      return;
    }
    const updated = sections.map((s) =>
      s.id === sectionId ? { ...s, name: editingSectionName.trim() } : s
    );
    setSections(updated);
    updateParent(updated);
    setEditingSectionId(null);
    setEditingSectionName("");
  };

  // Add parameter to section
  const addParameter = (sectionId: string) => {
    if (!newParameterName.trim()) return;
    const updated = sections.map((s) =>
      s.id === sectionId
        ? { ...s, parameters: [...s.parameters, newParameterName.trim()] }
        : s
    );
    setSections(updated);
    updateParent(updated);
    setNewParameterName("");
    setAddingParameterToSection(null);
  };

  // Delete parameter from section
  const deleteParameter = (sectionId: string, parameterIndex: number) => {
    const updated = sections.map((s) =>
      s.id === sectionId
        ? { ...s, parameters: s.parameters.filter((_, i) => i !== parameterIndex) }
        : s
    );
    setSections(updated);
    updateParent(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Add new section (e.g., 'CBC', 'Lipid Profile')"
          value={newSectionName}
          onChange={(e) => setNewSectionName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addSection();
            }
          }}
        />
        <Button type="button" size="sm" onClick={addSection}>
          <Plus className="h-4 w-4 mr-1" />
          Add Section
        </Button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sections.map((section) => (
          <Card key={section.id} className="border border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                {editingSectionId === section.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingSectionName}
                      onChange={(e) => setEditingSectionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveEditSection(section.id);
                        }
                        if (e.key === "Escape") {
                          setEditingSectionId(null);
                        }
                      }}
                      autoFocus
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => saveEditSection(section.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingSectionId(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <CardTitle className="text-base font-semibold text-primary">
                      {section.name}
                      <Badge variant="secondary" className="ml-2">
                        {section.parameters.length} parameters
                      </Badge>
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditSection(section)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSection(section.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Display parameters */}
              <div className="flex flex-wrap gap-2">
                {section.parameters.map((param, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="flex items-center gap-1 py-1 px-2"
                  >
                    <span>{param}</span>
                    <button
                      type="button"
                      onClick={() => deleteParameter(section.id, index)}
                      className="hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {/* Add parameter input */}
              {addingParameterToSection === section.id ? (
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    placeholder="Parameter name"
                    value={newParameterName}
                    onChange={(e) => setNewParameterName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addParameter(section.id);
                      }
                      if (e.key === "Escape") {
                        setAddingParameterToSection(null);
                        setNewParameterName("");
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => addParameter(section.id)}
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setAddingParameterToSection(null);
                      setNewParameterName("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setAddingParameterToSection(section.id)}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Parameter
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {sections.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No sections added yet. Add a section to get started.</p>
          <p className="text-sm mt-1">
            Example: Add "CBC" as a section, then add parameters like "Hemoglobin", "WBC Count", etc.
          </p>
        </div>
      )}
    </div>
  );
}
