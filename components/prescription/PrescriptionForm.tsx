"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Edit2, Clock, Calendar, User, FileText, Save, Download, Loader2, ArrowLeft, Mic, MicOff, Bot, Sparkles, Eye, TestTube, TestTube2 } from "lucide-react";
import TypeAheadInput from "./TypeAheadInput";
import ComplaintCard from "./ComplaintCard";
import MedicineCard from "./MedicineCard";
import UnifiedAnalysisModal from "@/components/common/UnifiedAnalysisModal";
import ImageGallery from "@/components/common/ImageGallery";
// VoiceRecorder import removed - using original UI with robust logic

interface PrescriptionFormProps {
  prescriptionData: any;
  setPrescriptionData: (data: any) => void;
  patientInfo: any;
  doctorInfo?: any;
  clinicInfo?: any;
  onLoadPrevious: () => void;
  onGeneratePrescription?: () => void;
  isGenerating?: boolean;
  onBack?: () => void;
  existingPrescriptionId?: string | null;
  isLoadingData?: boolean;
}

export default function PrescriptionForm({
  prescriptionData,
  setPrescriptionData,
  patientInfo,
  doctorInfo,
  clinicInfo,
  onLoadPrevious,
  onGeneratePrescription,
  isGenerating = false,
  onBack,
  existingPrescriptionId,
  isLoadingData = false,
}: PrescriptionFormProps) {
  const [newComplaint, setNewComplaint] = useState("");
  const [newMedicine, setNewMedicine] = useState("");
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [isSplitScreen, setIsSplitScreen] = useState(false);
  const patientCardRef = useRef<HTMLDivElement>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);
  const [isGeneratingPrescription, setIsGeneratingPrescription] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  // Section-specific templates state
  const [complaintTemplateName, setComplaintTemplateName] = useState("");
  const [isSavingComplaintTemplate, setIsSavingComplaintTemplate] = useState(false);
  const [showComplaintSaveDialog, setShowComplaintSaveDialog] = useState(false);
  const [showComplaintLoadDialog, setShowComplaintLoadDialog] = useState(false);
  const [complaintTemplates, setComplaintTemplates] = useState<any[]>([]);

  const [medicineTemplateName, setMedicineTemplateName] = useState("");
  const [isSavingMedicineTemplate, setIsSavingMedicineTemplate] = useState(false);
  const [showMedicineSaveDialog, setShowMedicineSaveDialog] = useState(false);
  const [showMedicineLoadDialog, setShowMedicineLoadDialog] = useState(false);
  const [medicineTemplates, setMedicineTemplates] = useState<any[]>([]);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isFillingForm, setIsFillingForm] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [isClearingVoice, setIsClearingVoice] = useState(false);
  const [currentVoiceField, setCurrentVoiceField] = useState<string | null>(null);
  const { toast } = useToast();
  // Ref to hold accumulated transcript across interim/final results
  const finalTranscriptRef = useRef<string>("");
  // Ref to mark if recording was cancelled (e.g., via Clear All)
  const recordingCancelledRef = useRef<boolean>(false);
  // Current images state
  const [currentImages, setCurrentImages] = useState<Array<{id?: number; url: string}>>([]);
  const [isUploadingCurrent, setIsUploadingCurrent] = useState(false);
  // Historical images from all appointments (for gallery)
  const [historicalImages, setHistoricalImages] = useState<Array<{id: number; imageUrl: string; type: 'BEFORE' | 'AFTER'; createdAt: string; appointmentId: number}>>([]);
  const [patientAppointmentsForGallery, setPatientAppointmentsForGallery] = useState<Array<{id: number; date: string; status: string}>>([]);
  const [loadingHistoricalImages, setLoadingHistoricalImages] = useState(false);
  
  // Investigation section state
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [patientAppointments, setPatientAppointments] = useState<any[]>([]);
  const [labBookings, setLabBookings] = useState<any[]>([]);
  const [standaloneReports, setStandaloneReports] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const severityOptions = [
    { value: "PERFECT", label: "Perfect", color: "bg-green-100 text-green-800" },
    { value: "GOOD", label: "Good", color: "bg-blue-100 text-blue-800" },
    { value: "MODERATE", label: "Moderate", color: "bg-yellow-100 text-yellow-800" },
    { value: "RISK", label: "Risk", color: "bg-orange-100 text-orange-800" },
    { value: "CRITICAL", label: "Critical", color: "bg-red-100 text-red-800" },
  ];

  const addComplaint = () => {
    if (newComplaint.trim()) {
      setPrescriptionData({
        ...prescriptionData,
        complaints: [
          ...prescriptionData.complaints,
          {
            id: Date.now().toString(),
            text: newComplaint,
            severity: "MODERATE",
            daysSince: 1,
            isFlagged: false,
          },
        ],
      });
      setNewComplaint("");
      toast({
        title: "Success",
        description: `Complaint "${newComplaint}" added successfully`,
      });
    } else {
      toast({
        title: "Error",
        description: "Please enter a complaint text",
        variant: "destructive",
      });
    }
  };

  const updateComplaint = (id: string, updates: any) => {
    setPrescriptionData({
      ...prescriptionData,
      complaints: prescriptionData.complaints.map((complaint: any) =>
        complaint.id === id ? { ...complaint, ...updates } : complaint
      ),
    });
  };

  const removeComplaint = (id: string) => {
    const complaint = prescriptionData.complaints.find((c: any) => c.id === id);
    setPrescriptionData({
      ...prescriptionData,
      complaints: prescriptionData.complaints.filter((complaint: any) => complaint.id !== id),
    });
    toast({
      title: "Success",
      description: `Complaint "${complaint?.text || 'Unknown'}" removed successfully`,
    });
  };

  const addMedicine = () => {
    if (newMedicine.trim()) {
      setPrescriptionData({
        ...prescriptionData,
        medicines: [
          ...prescriptionData.medicines,
          {
            id: Date.now().toString(),
            name: newMedicine,
            frequency: "1-0-0",
            medicineTime: "Post-meal",
            duration: "",
            quantity: "0",
          },
        ],
      });
      setNewMedicine("");
      toast({
        title: "Success",
        description: `Medicine "${newMedicine}" added successfully`,
      });
    } else {
      toast({
        title: "Error",
        description: "Please enter a medicine name",
        variant: "destructive",
      });
    }
  };

  const updateMedicine = (id: string, updates: any) => {
    setPrescriptionData({
      ...prescriptionData,
      medicines: prescriptionData.medicines.map((medicine: any) =>
        medicine.id === id ? { ...medicine, ...updates } : medicine
      ),
    });
  };

  const removeMedicine = (id: string) => {
    const medicine = prescriptionData.medicines.find((m: any) => m.id === id);
    setPrescriptionData({
      ...prescriptionData,
      medicines: prescriptionData.medicines.filter((medicine: any) => medicine.id !== id),
    });
    toast({
      title: "Success",
      description: `Medicine "${medicine?.name || 'Unknown'}" removed successfully`,
    });
  };

  const calculateNextVisitDate = (type: string, value: number) => {
    const today = new Date();
    let nextDate = new Date(today);

    switch (type) {
      case "days":
        nextDate.setDate(today.getDate() + value);
        break;
      case "weeks":
        nextDate.setDate(today.getDate() + (value * 7));
        break;
      case "months":
        nextDate.setMonth(today.getMonth() + value);
        break;
    }

    return nextDate;
  };

  const handleNextVisitChange = (type: string, value: number) => {
    const nextDate = calculateNextVisitDate(type, value);
    setPrescriptionData({
      ...prescriptionData,
      nextVisit: {
        type,
        value,
        date: nextDate,
      },
    });
  };

  // Initialize default next visit date (7 days) if not set
  useEffect(() => {
    if (!prescriptionData.nextVisit?.date) {
      const d = calculateNextVisitDate(prescriptionData.nextVisit?.type || 'days', prescriptionData.nextVisit?.value || 7);
      setPrescriptionData((prev: any) => ({
        ...prev,
        nextVisit: { ...(prev.nextVisit || { type: 'days', value: 7 }), date: d },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load current appointment images once patientInfo is present
  useEffect(() => {
    const apptId = patientInfo?.appointmentId;
    if (!apptId) return;
    (async () => {
      try {
        const res = await fetch(`/api/doctor/appointments/${apptId}/images`);
        if (res.ok) {
          const json = await res.json();
          const imgs = Array.isArray(json?.data) ? json.data : [];
          // Load all images as current images (no before/after distinction)
          setCurrentImages(imgs.map((i: any) => ({ id: i.id, url: i.imageUrl })));
        }
      } catch {
        // ignore
      }
    })();
  }, [patientInfo?.appointmentId]);

  // Load historical images from all patient appointments for gallery
  useEffect(() => {
    const patientId = patientInfo?.patientId || patientInfo?.id;
    if (!patientId) return;
    
    setLoadingHistoricalImages(true);
    (async () => {
      try {
        // Fetch patient appointments
        const res = await fetch(`/api/doctor/patients/${patientId}`);
        if (res.ok) {
          const data = await res.json();
          const appointments = data.doctorAppointments || [];
          setPatientAppointmentsForGallery(
            appointments
              .filter((apt: any) => apt.status === 'COMPLETED')
              .map((apt: any) => ({
                id: apt.id,
                date: apt.date || apt.doctorAvailability?.date || new Date().toISOString(),
                status: apt.status,
              }))
          );

          // Fetch images from all completed appointments
          const completedAppointments = appointments.filter(
            (apt: any) => apt.status === 'COMPLETED'
          );

          const imagePromises = completedAppointments.map(async (apt: any) => {
            try {
              const imgRes = await fetch(`/api/doctor/appointments/${apt.id}/images`);
              if (imgRes.ok) {
                const imgData = await imgRes.json();
                if (imgData.success && Array.isArray(imgData.data)) {
                  return imgData.data.map((img: any) => ({
                    ...img,
                    appointmentId: apt.id,
                  }));
                }
              }
              return [];
            } catch (error) {
              console.error(`Error fetching images for appointment ${apt.id}:`, error);
              return [];
            }
          });

          const imageArrays = await Promise.all(imagePromises);
          const flattened = imageArrays.flat();
          setHistoricalImages(flattened);
        }
      } catch (error) {
        console.error('Error fetching historical images:', error);
      } finally {
        setLoadingHistoricalImages(false);
      }
    })();
  }, [patientInfo?.patientId, patientInfo?.id]);

  // Fetch patient appointments and lab reports for Investigation section
  useEffect(() => {
    const patientId = patientInfo?.patientId || patientInfo?.id;
    if (!patientId) return;
    
    setLoadingAppointments(true);
    (async () => {
      try {
        // Fetch patient details which includes appointments and lab bookings
        const res = await fetch(`/api/doctor/patients/${patientId}`);
        if (res.ok) {
          const data = await res.json();
          setPatientAppointments(data.doctorAppointments || []);
          setLabBookings(data.labBookings || []);
        }
        
        // Fetch standalone reports
        const reportsRes = await fetch(`/api/reports/upload?patientId=${patientId}`);
        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          if (reportsData.success) {
            setStandaloneReports(reportsData.reports || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch patient data:', error);
      } finally {
        setLoadingAppointments(false);
      }
    })();
  }, [patientInfo?.patientId, patientInfo?.id]);

  // Cloudinary upload using existing unsigned preset
  const uploadImageToCloudinary = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "client-unsigned");
    formData.append("cloud_name", "pirated-virus-cloud");
    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/pirated-virus-cloud/image/upload", { method: "POST", body: formData });
      if (!res.ok) return null;
      const data = await res.json();
      return data.secure_url as string;
    } catch {
      return null;
    }
  };

  const handleUploadCurrentImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const apptId = patientInfo?.appointmentId;
    if (!apptId) return;
    setIsUploadingCurrent(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImageToCloudinary(files[i]);
        if (url) urls.push(url);
      }
      if (urls.length) {
        // Use 'AFTER' type for current images (maintaining backward compatibility)
        const resp = await fetch(`/api/doctor/appointments/${apptId}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls, type: 'AFTER', uploadedById: doctorInfo?.id ? Number(doctorInfo.id) : undefined }),
        });
        if (resp.ok) {
          const saved = await resp.json();
          const items = Array.isArray(saved?.data) ? saved.data.map((i: any) => ({ id: i.id, url: i.imageUrl })) : urls.map(u => ({ url: u }));
          setCurrentImages(prev => [...prev, ...items]);
          // Also update historical images to include the new ones (deduplicate by id)
          if (Array.isArray(saved?.data)) {
            const newHistoricalItems = saved.data.map((i: any) => ({
              id: i.id,
              imageUrl: i.imageUrl,
              type: 'AFTER' as const,
              createdAt: i.createdAt || new Date().toISOString(),
              appointmentId: apptId,
            }));
            setHistoricalImages(prev => {
              const existingIds = new Set(prev.map(img => img.id));
              const uniqueNewItems = newHistoricalItems.filter(item => !existingIds.has(item.id));
              return [...prev, ...uniqueNewItems];
            });
          }
          toast({ title: "Uploaded", description: `${urls.length} image(s) saved` });
        } else {
          toast({ title: "Error", description: "Failed to save images", variant: "destructive" });
        }
      }
    } finally {
      setIsUploadingCurrent(false);
      e.target.value = '';
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    const apptId = patientInfo?.appointmentId;
    if (!apptId) return;
    try {
      const resp = await fetch(`/api/doctor/appointments/${apptId}/images`, { 
        method: 'DELETE', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ imageId }) 
      });
      if (resp.ok) {
        setCurrentImages(prev => prev.filter(i => i.id !== imageId));
        setHistoricalImages(prev => prev.filter(i => i.id !== imageId));
        toast({ title: "Removed", description: "Image removed" });
      } else {
        toast({ title: "Error", description: "Failed to remove image", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to remove image", variant: "destructive" });
    }
  };

  const processFrequencyInput = (input: string): string => {
    // Remove all non-numeric characters except dashes
    const cleanInput = input.replace(/[^0-9-]/g, '');

    // If input is just numbers, format it as frequency
    if (/^\d{1,3}$/.test(cleanInput)) {
      const digits = cleanInput.split('');
      if (digits.length === 1) {
        return `${digits[0]}-0-0`;
      } else if (digits.length === 2) {
        return `${digits[0]}-${digits[1]}-0`;
      } else if (digits.length === 3) {
        return `${digits[0]}-${digits[1]}-${digits[2]}`;
      }
    }

    // If already in correct format, return as is
    if (/^\d-\d-\d$/.test(cleanInput)) {
      return cleanInput;
    }

    return input;
  };

  useEffect(() => {
    const detectSplitScreen = () => {
      // Check if we're in split screen mode by looking for the split screen container
      const splitContainer = document.querySelector('.lg\\:w-1\\/2') as HTMLElement;
      const scrollContainer = document.querySelector('.lg\\:h-full.overflow-y-auto') as HTMLElement;
      const isSplit = !!(splitContainer || scrollContainer);
      setIsSplitScreen(isSplit);
      
      // Header is always visible now in both modes
      setShowStickyHeader(true);
    };

    // Initial detection
    detectSplitScreen();

    // Re-check on window resize
    window.addEventListener('resize', detectSplitScreen);

    // Initialize speech recognition with robust cancellation
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      finalTranscriptRef.current = "";

      recognitionInstance.onstart = () => {
        setIsVoiceRecording(true);
        setVoiceTranscript("");
        setIsClearingVoice(false);
        finalTranscriptRef.current = "";
        recordingCancelledRef.current = false;
      };

      recognitionInstance.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setVoiceTranscript(finalTranscriptRef.current + interim);
      };

      recognitionInstance.onend = () => {
        setIsVoiceRecording(false);
        if (
          !recordingCancelledRef.current &&
          finalTranscriptRef.current.trim()
        ) {
          setVoiceTranscript(finalTranscriptRef.current.trim());
          processVoiceInput(finalTranscriptRef.current.trim());
        }
        setCurrentVoiceField(null);
      };

      recognitionInstance.onerror = (event: any) => {
        setIsVoiceRecording(false);
        // Don't show error toast if we're clearing voice data or if recording was cancelled
        if (!isClearingVoice && !recordingCancelledRef.current) {
          toast({
            title: "Speech Recognition Error",
            description: "There was an issue with speech recognition. Please try again.",
            variant: "destructive",
          });
        }
      };

      setRecognition(recognitionInstance);
    }

    return () => {
      window.removeEventListener('resize', detectSplitScreen);
    };
  }, []);

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a template name",
        variant: "destructive",
      });
      return;
    }

    setIsSavingTemplate(true);
    try {
      const response = await fetch('/api/doctor/prescription/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          ...prescriptionData,
        }),
      });

      if (!response.ok) throw new Error('Failed to save template');

      toast({
        title: "Success",
        description: `Template "${templateName}" saved successfully`,
      });

      setShowSaveDialog(false);
      setTemplateName("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleLoadTemplates = async () => {
    setIsLoadingTemplate(true);
    try {
      const response = await fetch('/api/doctor/prescription/templates');
      if (!response.ok) throw new Error('Failed to load templates');

      const data = await response.json();

      
      if (data.success && data.templates) {
        setSavedTemplates(data.templates || []);
        setShowLoadDialog(true);
        // toast({
        //   title: "Success",
        //   description: `Loaded ${data.templates.length} templates`,
        // });
      } else {
        throw new Error(data.error || 'Failed to load templates');
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  // Complaints templates handlers
  const handleSaveComplaintsTemplate = async () => {
    if (!complaintTemplateName.trim()) {
      toast({ title: "Error", description: "Please enter a template name", variant: "destructive" });
      return;
    }
    setIsSavingComplaintTemplate(true);
    try {
      const response = await fetch('/api/doctor/prescription/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: complaintTemplateName,
          complaints: prescriptionData.complaints,
          medicines: [],
        }),
      });
      if (!response.ok) throw new Error('Failed to save complaints template');
      toast({ title: 'Saved', description: `Complaints template "${complaintTemplateName}" saved` });
      setShowComplaintSaveDialog(false);
      setComplaintTemplateName("");
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to save complaints template', variant: 'destructive' });
    } finally {
      setIsSavingComplaintTemplate(false);
    }
  };

  const handleLoadComplaintsTemplates = async () => {
    try {
      const res = await fetch('/api/doctor/prescription/templates?type=complaints');
      if (!res.ok) throw new Error('Failed to load complaints templates');
      const data = await res.json();
      setComplaintTemplates(data.templates || []);
      setShowComplaintLoadDialog(true);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load complaints templates', variant: 'destructive' });
    }
  };

  const applyComplaintsTemplate = (template: any) => {
    const comps = (template.complaints || []).map((c: any) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text: c.complaintText,
      severity: c.severity || 'MODERATE',
      daysSince: 1,
      isFlagged: false,
    }));
    setPrescriptionData({ ...prescriptionData, complaints: comps });
    setShowComplaintLoadDialog(false);
    toast({ title: 'Loaded', description: `Complaints template applied` });
  };

  // Medicines templates handlers
  const handleSaveMedicinesTemplate = async () => {
    if (!medicineTemplateName.trim()) {
      toast({ title: "Error", description: "Please enter a template name", variant: "destructive" });
      return;
    }
    setIsSavingMedicineTemplate(true);
    try {
      const response = await fetch('/api/doctor/prescription/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: medicineTemplateName,
          complaints: [],
          medicines: prescriptionData.medicines,
        }),
      });
      if (!response.ok) throw new Error('Failed to save medicines template');
      toast({ title: 'Saved', description: `Medicines template "${medicineTemplateName}" saved` });
      setShowMedicineSaveDialog(false);
      setMedicineTemplateName("");
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to save medicines template', variant: 'destructive' });
    } finally {
      setIsSavingMedicineTemplate(false);
    }
  };

  const handleLoadMedicinesTemplates = async () => {
    try {
      const res = await fetch('/api/doctor/prescription/templates?type=medicines');
      if (!res.ok) throw new Error('Failed to load medicines templates');
      const data = await res.json();
      setMedicineTemplates(data.templates || []);
      setShowMedicineLoadDialog(true);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load medicines templates', variant: 'destructive' });
    }
  };

  const applyMedicinesTemplate = (template: any) => {
    const meds = (template.medicines || []).map((m: any) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: m.medicineName,
      frequency: m.frequency || "",
      medicineTime: m.medicineTime || "",
      duration: m.duration || "",
      quantity: (m.quantity ?? '').toString(),
      instructions: m.instructions || "",
    }));
    setPrescriptionData({ ...prescriptionData, medicines: meds });
    setShowMedicineLoadDialog(false);
    toast({ title: 'Loaded', description: `Medicines template applied` });
  };

  const handleSelectTemplate = (template: any) => {
    // Ensure template exists
    if (!template) {
      toast({
        title: "Error",
        description: "Invalid template data",
        variant: "destructive",
      });
      return;
    }
    
    // Reconstruct template data from separate relations
    const templateData = {
      complaints: template.complaints?.map((c: any) => ({
        id: c.id.toString(),
        text: c.complaintText,
        severity: c.severity,
        daysSince: 0,
        isFlagged: false,
      })) || [],
      vitals: {
        bloodPressure: "",
        pulse: "",
        height: "",
        weight: "",
      },
      history: {
        allergies: "",
        personalHistory: "",
        pastMedicalHistory: "",
        familyHistory: "",
      },
      systemicExamination: {
        general: "",
        cvs: "NAD",
        rs: "NAD",
        cns: "NAD",
      },
      medicines: template.medicines?.map((m: any) => ({
        id: m.id.toString(),
        name: m.medicineName,
        frequency: m.frequency || "",
        medicineTime: m.medicineTime || "",
        duration: m.duration || "",
        quantity: m.quantity?.toString() || "",
        instructions: m.instructions || "",
      })) || [],
      advice: template.advice || "",
      testsRequested: template.testsRequested || "",
      nextVisit: {
        type: "days",
        value: 7,
        date: undefined,
      },
    };
    setPrescriptionData({
      complaints: templateData.complaints || [],
      vitals: {
        bloodPressure: templateData.vitals?.bloodPressure || "",
        pulse: templateData.vitals?.pulse || "",
        height: templateData.vitals?.height || "",
        weight: templateData.vitals?.weight || "",
      },
      history: {
        allergies: templateData.history?.allergies || "",
        personalHistory: templateData.history?.personalHistory || "",
        pastMedicalHistory: templateData.history?.pastMedicalHistory || "",
        familyHistory: templateData.history?.familyHistory || "",
      },
      systemicExamination: {
        general: templateData.systemicExamination?.general || "",
        cvs: templateData.systemicExamination?.cvs || "NAD",
        rs: templateData.systemicExamination?.rs || "NAD",
        cns: templateData.systemicExamination?.cns || "NAD",
      },
      medicines: templateData.medicines || [],
      advice: templateData.advice || "",
      testsRequested: templateData.testsRequested || "",
      nextVisit: {
        type: templateData.nextVisit?.type || "days",
        value: templateData.nextVisit?.value || 7,
        date: templateData.nextVisit?.date ? new Date(templateData.nextVisit.date) : undefined,
      },
    });
    setShowLoadDialog(false);
    toast({
      title: "Success",
      description: `Template \"${template.templateName || template.name || 'Unnamed'}\" loaded successfully`,
    });
  };

  const handleLoadPrevious = async () => {
    setIsLoadingPrevious(true);
    try {
      await onLoadPrevious();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load previous medicines",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPrevious(false);
    }
  };

  const handleGeneratePrescription = async () => {
    setIsGeneratingPrescription(true);
    try {
      // Add prescription generation logic here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      toast({
        title: "Success",
        description: "Prescription generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate prescription",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPrescription(false);
    }
  };

  const handleVoiceTranscriptionComplete = (voiceData: any) => {
    setIsFillingForm(true);
    
    // Helper function to append medical history fields with comma separator
    const appendMedicalHistory = (existing: string | null | undefined, newValue: string | null | undefined): string => {
      const existingStr = existing?.trim() || "";
      const newStr = newValue?.trim() || "";
      
      if (!existingStr && !newStr) return "";
      if (!existingStr) return newStr;
      if (!newStr) return existingStr;
      
      // Append with comma separator
      return `${existingStr}, ${newStr}`;
    };
    
    // Merge voice data with existing prescription data intelligently
    const updatedData = {
      ...prescriptionData,
      // Add new complaints with unique IDs
      complaints: [
        ...prescriptionData.complaints,
        ...(voiceData.complaints || []).map((complaint: any) => ({
          ...complaint,
          id: Date.now().toString() + Math.random().toString(36).slice(2),
        }))
      ],
      // Update vitals only if voice data has non-empty values
      vitals: {
        ...prescriptionData.vitals,
        ...Object.fromEntries(
          Object.entries(voiceData.vitals || {}).filter(([_, value]) => value && value.toString().trim())
        ),
      },
      // Update history only if voice data has non-empty values
      history: {
        ...prescriptionData.history,
        ...Object.fromEntries(
          Object.entries(voiceData.history || {}).filter(([_, value]) => value && value.toString().trim())
        ),
      },
      // Update systemic examination only if voice data has non-empty values
      systemicExamination: {
        ...prescriptionData.systemicExamination,
        ...Object.fromEntries(
          Object.entries(voiceData.systemicExamination || {}).filter(([_, value]) => value && value.toString().trim())
        ),
      },
      // Add new medicines with unique IDs
      medicines: [
        ...prescriptionData.medicines,
        ...(voiceData.medicines || []).map((medicine: any) => ({
          ...medicine,
          id: Date.now().toString() + Math.random().toString(36).slice(2),
        }))
      ],
      // Update advice and tests only if voice data has content
      advice: voiceData.advice?.trim() || prescriptionData.advice,
      testsRequested: voiceData.testsRequested?.trim() || prescriptionData.testsRequested,
      historyOfCurrentIllness: voiceData.historyOfCurrentIllness?.trim() || prescriptionData.historyOfCurrentIllness,
      // Append medical history fields instead of replacing them
      medicalHistory: {
        allergies: appendMedicalHistory(
          prescriptionData.medicalHistory?.allergies,
          voiceData.medicalHistory?.allergies
        ),
        personalHistory: appendMedicalHistory(
          prescriptionData.medicalHistory?.personalHistory,
          voiceData.medicalHistory?.personalHistory
        ),
        pastMedicalHistory: appendMedicalHistory(
          prescriptionData.medicalHistory?.pastMedicalHistory,
          voiceData.medicalHistory?.pastMedicalHistory
        ),
        familyHistory: appendMedicalHistory(
          prescriptionData.medicalHistory?.familyHistory,
          voiceData.medicalHistory?.familyHistory
        ),
      },
      nextVisit: voiceData.nextVisit || prescriptionData.nextVisit,
    };

    setPrescriptionData(updatedData);
    setShowVoiceInput(false);
    
    const addedItems = [];
    if (voiceData.complaints?.length) addedItems.push(`${voiceData.complaints.length} complaint(s)`);
    if (voiceData.medicines?.length) addedItems.push(`${voiceData.medicines.length} medicine(s)`);
    if (voiceData.advice?.trim()) addedItems.push("advice");
    if (voiceData.testsRequested?.trim()) addedItems.push("tests");
    if (voiceData.historyOfCurrentIllness?.trim()) addedItems.push("history of current illness");
    if (voiceData.medicalHistory?.allergies?.trim() || voiceData.medicalHistory?.personalHistory?.trim() || voiceData.medicalHistory?.pastMedicalHistory?.trim() || voiceData.medicalHistory?.familyHistory?.trim()) addedItems.push("medical history");
    
    // Only show success if we actually added meaningful data
    if (addedItems.length > 0) {
      toast({
        title: "Voice Input Applied", 
        description: `Prescription form updated with: ${addedItems.join(", ")}`,
      });
    } else {
      toast({
        title: "No Data Extracted",
        description: "Could not extract meaningful prescription data from your voice input. Please try speaking more clearly.",
        variant: "destructive",
      });
    }
    
    setIsFillingForm(false);
  };

  const handleAIMicClick = () => {
    if (isVoiceRecording) {
      // Stop recording
      if (recognition) {
        recognition.stop();
      }
    } else {
      // Start recording
      if (recognition) {
        setVoiceTranscript("");
        setIsVoiceRecording(true);
        setIsClearingVoice(false);
        finalTranscriptRef.current = "";
        recordingCancelledRef.current = false;
        recognition.start();
        toast({
          title: "🎤 AI Mic Activated",
          description: "Listening for prescription details...",
        });
      } else {
        toast({
          title: "Speech Recognition Not Available",
          description: "Your browser doesn't support speech recognition.",
          variant: "destructive",
        });
      }
    }
  };

  const processVoiceInput = async (transcript: string) => {
    setIsProcessingVoice(true);
    
    toast({
      title: "🤖 AI Processing",
      description: "Converting speech to prescription data...",
    });

    try {
      const response = await fetch('/api/llm-process/voice-prescription-openrouter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcript,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process voice input');
      }

      const data = await response.json();
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }

      // Auto-fill the prescription form
      handleVoiceTranscriptionComplete(data);
      
    } catch (error) {
      console.error('Error processing voice input:', error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process voice input.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const handleVoiceInput = async (fieldName: string) => {
    if (isVoiceRecording) {
      // Stop recording
      if (recognition) {
        recognition.stop();
      }
      setCurrentVoiceField(null);
    } else {
      // Start recording for specific field
      setCurrentVoiceField(fieldName);
      if (recognition) {
        setVoiceTranscript("");
        setIsVoiceRecording(true);
        setIsClearingVoice(false);
        finalTranscriptRef.current = "";
        recordingCancelledRef.current = false;
        recognition.start();
        toast({
          title: "🎤 Recording",
          description: `Recording for ${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()}...`,
        });
      } else {
        toast({
          title: "Speech Recognition Not Available",
          description: "Your browser doesn't support speech recognition.",
          variant: "destructive",
        });
      }
    }
  };

  const clearAllVoiceData = () => {
    // Set clearing flag FIRST to prevent any onend events from processing
    setIsClearingVoice(true);

    // Mark as cancelled and clear transcript ref before aborting recognition
    recordingCancelledRef.current = true;
    finalTranscriptRef.current = "";
    // Stop any ongoing recognition
    if (recognition) {
      recognition.abort();
    }

    // Clear all voice-related state atomically
    setVoiceTranscript("");
    setIsProcessingVoice(false);
    setIsVoiceRecording(false);
    setIsFillingForm(false);
    setCurrentVoiceField(null);
    finalTranscriptRef.current = "";

    // Clear all form data that could have been filled by voice
    setPrescriptionData({
      complaints: [],
      vitals: {
        bloodPressure: "",
        pulse: "",
        height: "",
        weight: "",
      },
      historyOfCurrentIllness: "",
      systemicExamination: {
        general: "",
        cvs: "NAD",
        rs: "NAD",
        cns: "NAD",
      },
      medicines: [],
      advice: "",
      testsRequested: "",
      nextVisit: {
        type: "days",
        value: 7,
        date: undefined,
      },
    });

    toast({
      title: "Cleared Successfully",
      description: "All voice data and form inputs have been cleared.",
      options: { autoClose: 2000 }, // 2 seconds instead of default 5 seconds
    });

    // Reset clearing flag after a short delay to allow any pending events to be ignored
    setTimeout(() => {
      setIsClearingVoice(false);
    }, 100);
  };

  return (
    <>
      {/* Sticky Header - Always visible and positioned outside padded container */}
      <div className="sticky top-0 left-0 right-0 z-50 bg-white shadow-md border-b -mx-2 lg:-mx-4">
        <div className="flex items-center justify-between px-4 lg:px-6 py-3">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack} className="mr-2 p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-gray-900">{patientInfo.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAIMicClick}
              disabled={isLoadingData || isProcessingVoice || isFillingForm}
              className={`relative transition-all duration-500 ease-in-out ${
                isVoiceRecording 
                  ? "bg-gradient-to-r from-pink-500 to-blue-500 text-white border-transparent shadow-lg shadow-pink-500/20" 
                  : (isLoadingData || isProcessingVoice || isFillingForm)
                  ? "bg-gradient-to-r from-pink-400 to-blue-400 text-white border-transparent shadow-lg shadow-blue-500/20"
                  : "hover:bg-gradient-to-r hover:from-pink-50 hover:to-blue-50 hover:border-pink-200"
              }`}
            >
              {/* Subtle glow effect */}
              {(isVoiceRecording || isProcessingVoice || isFillingForm) && (
                <div className="absolute inset-0 rounded-md bg-gradient-to-r from-pink-500 to-blue-500 opacity-20 blur-sm"></div>
              )}
              
              {/* Wave Icon */}
              <div className="relative z-10 mr-2">
                <div className="flex items-center space-x-0.5">
                  <div className={`w-0.5 rounded-full transition-all duration-300 ${
                    isVoiceRecording ? "h-3 bg-white animate-pulse" : (isProcessingVoice || isFillingForm) ? "h-2 bg-white animate-bounce" : "h-2 bg-pink-600"
                  }`} style={{animationDelay: '0ms'}}></div>
                  <div className={`w-0.5 rounded-full transition-all duration-300 ${
                    isVoiceRecording ? "h-5 bg-white animate-pulse" : (isProcessingVoice || isFillingForm) ? "h-3 bg-white animate-bounce" : "h-3 bg-pink-600"
                  }`} style={{animationDelay: '200ms'}}></div>
                  <div className={`w-0.5 rounded-full transition-all duration-300 ${
                    isVoiceRecording ? "h-6 bg-white animate-pulse" : (isProcessingVoice || isFillingForm) ? "h-4 bg-white animate-bounce" : "h-4 bg-pink-600"
                  }`} style={{animationDelay: '400ms'}}></div>
                  <div className={`w-0.5 rounded-full transition-all duration-300 ${
                    isVoiceRecording ? "h-5 bg-white animate-pulse" : (isProcessingVoice || isFillingForm) ? "h-3 bg-white animate-bounce" : "h-3 bg-pink-600"
                  }`} style={{animationDelay: '600ms'}}></div>
                  <div className={`w-0.5 rounded-full transition-all duration-300 ${
                    isVoiceRecording ? "h-3 bg-white animate-pulse" : (isProcessingVoice || isFillingForm) ? "h-2 bg-white animate-bounce" : "h-2 bg-pink-600"
                  }`} style={{animationDelay: '800ms'}}></div>
                </div>
              </div>
              
              {/* Text */}
              <span className={`relative z-10 font-medium transition-all duration-300 ${
                (isVoiceRecording || isProcessingVoice || isFillingForm) 
                  ? "text-white" 
                  : "bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent"
              }`}>
                {isLoadingData ? "Loading..." : isVoiceRecording ? "Recording..." : isProcessingVoice ? "Thinking..." : isFillingForm ? "Filling..." : "AI Mic"}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadTemplates}
              disabled={isLoadingTemplate}
            >
              {isLoadingTemplate ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Load Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onGeneratePrescription}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              {existingPrescriptionId ? "Update Prescription" : "Generate Prescription"}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-5 w-full">

      {/* Voice Transcript Display */}
      {voiceTranscript && (
        <div className="bg-gradient-to-r from-pink-50 to-blue-50 p-4 rounded-lg border border-pink-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              Voice Transcript
            </h4>
            <div className="flex gap-2">
              {isProcessingVoice && (
                <span className="text-sm text-blue-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  Processing...
                </span>
              )}
              <Button 
                onClick={clearAllVoiceData}
                variant="outline" 
                size="sm"
                className="text-xs text-red-600 hover:text-red-700 hover:border-red-300"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{voiceTranscript}</p>
        </div>
      )}

      {/* Patient Information */}
      <div
        ref={patientCardRef}
        className="bg-custom-mutedgreen p-6 rounded-2xl border border-gray-200 flex justify-between items-start relative overflow-hidden"
      >
        {/* Embossed User Icon - Bottom Left */}
        <div className="absolute bottom-0 left-0 opacity-10">
          <User className="h-32 w-32 text-custom-darkgreen" />
        </div>
        {/* Content */}
        <div className="relative z-10 w-full flex justify-between items-start">
          <div className="flex items-center gap-3">
            {/* {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack} className="mr-2 p-2 text-custom-darkgreen">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )} */}
            <h3 className="text-lg text-custom-darkgreen font-semibold">Patient Information</h3>
          </div>
          <div className="flex flex-col text-right">
            <div>
              <h4 className="text-xl text-custom-darkgreen font-medium mb-1">#APT0{patientInfo.appointmentId || '001'}</h4>
            </div>
            <div>
              <h2 className="text-2xl text-custom-darkgreen font-semibold mb-1">{patientInfo.name}</h2>
            </div>
            {/* Prescription ID hidden as requested */}
          </div>
        </div>
      </div>

      {/* Vitals Section */}
      <div className="rounded-lg " data-section="vitals">
        {/* <h3 className="text-lg font-semibold mb-4">Vitals</h3> */}
        <div className="grid grid-cols-4 gap-6">
          {/* BP Vital */}
          <div className="flex flex-col">
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-custom-mutedgreen flex-1 flex items-center justify-center px-3 py-2">
                <span className="text-custom-darkgreen font-semibold text-sm">BP</span>
              </div>
              <div className="flex-1">
                <Input
                  id="bp"
                  value={prescriptionData.vitals?.bloodPressure || ""}
                  onChange={(e) =>
                    setPrescriptionData({
                      ...prescriptionData,
                                              vitals: { ...prescriptionData.vitals || {}, bloodPressure: e.target.value },
                    })
                  }
                  placeholder="120/80"
                  className="border-0 bg-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 h-full text-center"
                />
              </div>
            </div>
            <span className="text-sm text-gray-500 mt-1 text-right">mm/Hg</span>
          </div>

          {/* Pulse Vital */}
          <div className="flex flex-col">
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-custom-mutedgreen flex-1 flex items-center justify-center px-3 py-2">
                <span className="text-custom-darkgreen font-semibold text-sm">Pulse</span>
              </div>
              <div className="flex-1">
                <Input
                  id="pulse"
                  value={prescriptionData.vitals?.pulse || ""}
                  onChange={(e) =>
                    setPrescriptionData({
                      ...prescriptionData,
                                              vitals: { ...prescriptionData.vitals || {}, pulse: e.target.value },
                    })
                  }
                  placeholder="72"
                  className="border-0 bg-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 h-full text-center"
                />
              </div>
            </div>
            <span className="text-sm text-gray-500 mt-1 text-right">bpm</span>
          </div>

          {/* Height Vital */}
          <div className="flex flex-col">
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-custom-mutedgreen flex-1 flex items-center justify-center px-3 py-2">
                <span className="text-custom-darkgreen font-semibold text-sm">Height</span>
              </div>
              <div className="flex-1">
                <Input
                  id="height"
                  value={prescriptionData.vitals?.height || ""}
                  onChange={(e) =>
                    setPrescriptionData({
                      ...prescriptionData,
                                              vitals: { ...prescriptionData.vitals || {}, height: e.target.value },
                    })
                  }
                  placeholder="182"
                  className="border-0 bg-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 h-full text-center"
                />
              </div>
            </div>
            <span className="text-sm text-gray-500 mt-1 text-right">cm</span>
          </div>

          {/* Weight Vital */}
          <div className="flex flex-col">
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-custom-mutedgreen flex-1 flex items-center justify-center px-3 py-2">
                <span className="text-custom-darkgreen font-semibold text-sm">Weight</span>
              </div>
              <div className="flex-1">
                <Input
                  id="weight"
                  value={prescriptionData.vitals?.weight || ""}
                  onChange={(e) =>
                    setPrescriptionData({
                      ...prescriptionData,
                                              vitals: { ...prescriptionData.vitals || {}, weight: e.target.value },
                    })
                  }
                  placeholder="95"
                  className="border-0 bg-white-100 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 h-full text-center"
                />
              </div>
            </div>
            <span className="text-sm text-gray-500 mt-1 text-right">kg</span>
          </div>
        </div>
      </div>

      {/* Investigation Section */}
      <div className="bg-custom-mutedgreen p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Past Investigations</h3>
        <div className="flex gap-4">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 bg-white hover:bg-gray-50 border-gray-300"
            onClick={() => setPrescriptionModalOpen(true)}
            disabled={loadingAppointments}
          >
            <FileText className="h-4 w-4 mr-2" />
            View Prescriptions
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-1 bg-white hover:bg-gray-50 border-gray-300"
            onClick={() => setReportsModalOpen(true)}
            disabled={loadingAppointments}
          >
            <TestTube2 className="h-4 w-4 mr-2" />
            View Reports
          </Button>
        </div>
      </div>

      {/* Complaints Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Complaints</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onMouseDown={(e)=>e.preventDefault()} onClick={handleLoadComplaintsTemplates}>
              Load Complaints Template
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowComplaintSaveDialog(true)}>
              Save Complaints Template
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          <TypeAheadInput
            value={newComplaint}
            onChange={setNewComplaint}
            placeholder="Search complaints here..."
            type="complaints"
            className="w-full"
            showAddButtons={true}
            onAddItem={(item) => {
              const complaintText = item.text || item.name || item.value || "";
              setPrescriptionData({
                ...prescriptionData,
                complaints: [
                  ...prescriptionData.complaints,
                  {
                    id: Date.now().toString(),
                    text: complaintText,
                    severity: "MODERATE",
                    daysSince: 1,
                    isFlagged: false,
                  },
                ],
              });
            }}
          />

          {/* Existing Complaints */}
          <div className="space-y-3">
            {prescriptionData.complaints.map((complaint: any) => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                onUpdate={(updates: any) => updateComplaint(complaint.id, updates)}
                onRemove={() => removeComplaint(complaint.id)}
                severityOptions={severityOptions}
              />
            ))}
          </div>


        </div>
      </div>



      {/* History of Current Illness Section - Visit Specific */}
        <div className="bg-custom-mutedgreen p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">History of Current Illness</h3>
          <Textarea
            id="historyOfCurrentIllness"
            value={prescriptionData.historyOfCurrentIllness || ""}
            onChange={(e) =>
              setPrescriptionData({
                ...prescriptionData,
                historyOfCurrentIllness: e.target.value,
              })
            }
            placeholder="Describe the current illness, symptoms, duration, and progression..."
            rows={4}
            className="mt-1 bg-white"
          />
        </div>

      {/* Medical History Section - Longitudinal Patient Data */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Medical History</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Allergies</Label>
            <Textarea
              id="allergies"
              value={prescriptionData.medicalHistory?.allergies || ""}
              onChange={(e) =>
                setPrescriptionData({
                  ...prescriptionData,
                  medicalHistory: {
                    ...prescriptionData.medicalHistory,
                    allergies: e.target.value,
                  },
                })
              }
              placeholder="Enter patient allergies..."
              rows={3}
              className="mt-1 bg-white"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Personal History</Label>
            <Textarea
              id="personalHistory"
              value={prescriptionData.medicalHistory?.personalHistory || ""}
              onChange={(e) =>
                setPrescriptionData({
                  ...prescriptionData,
                  medicalHistory: {
                    ...prescriptionData.medicalHistory,
                    personalHistory: e.target.value,
                  },
                })
              }
              placeholder="Enter personal history..."
              rows={3}
              className="mt-1 bg-white"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Past Medical History</Label>
            <Textarea
              id="pastMedicalHistory"
              value={prescriptionData.medicalHistory?.pastMedicalHistory || ""}
              onChange={(e) =>
                setPrescriptionData({
                  ...prescriptionData,
                  medicalHistory: {
                    ...prescriptionData.medicalHistory,
                    pastMedicalHistory: e.target.value,
                  },
                })
              }
              placeholder="Enter past medical history..."
              rows={3}
              className="mt-1 bg-white"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Family History</Label>
            <Textarea
              id="familyHistory"
              value={prescriptionData.medicalHistory?.familyHistory || ""}
              onChange={(e) =>
                setPrescriptionData({
                  ...prescriptionData,
                  medicalHistory: {
                    ...prescriptionData.medicalHistory,
                    familyHistory: e.target.value,
                  },
                })
              }
              placeholder="Enter family history..."
              rows={3}
              className="mt-1 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Systemic Examination Section */}
      <div className="bg-custom-mutedgreen p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Systemic Examination</h3>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <Label htmlFor="general">General</Label>
            <Select
              value={prescriptionData.systemicExamination?.general || ""}
              onValueChange={(value) =>
                setPrescriptionData({
                  ...prescriptionData,
                  systemicExamination: { ...prescriptionData.systemicExamination || {}, general: value },
                })
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select general here" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="NAD">NAD</SelectItem>
                <SelectItem value="Conscious">Conscious</SelectItem>
                <SelectItem value="Orientated">Orientated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="cvs">CVS</Label>
            <Input
              id="cvs"
              className="bg-white"
              value={prescriptionData.systemicExamination?.cvs || ""}
              onChange={(e) =>
                setPrescriptionData({
                  ...prescriptionData,
                  systemicExamination: { ...prescriptionData.systemicExamination || {}, cvs: e.target.value },
                })
              }
              placeholder="NAD"
            />
          </div>
          <div>
            <Label htmlFor="rs">RS</Label>
            <Input
              id="rs"
              className="bg-white"
              value={prescriptionData.systemicExamination?.rs || ""}
              onChange={(e) =>
                setPrescriptionData({
                  ...prescriptionData,
                  systemicExamination: { ...prescriptionData.systemicExamination || {}, rs: e.target.value },
                })
              }
              placeholder="NAD"
            />
          </div>
          <div>
            <Label htmlFor="cns">CNS</Label>
            <Input
              id="cns"
              className="bg-white"
              value={prescriptionData.systemicExamination?.cns || ""}
              onChange={(e) =>
                setPrescriptionData({
                  ...prescriptionData,
                  systemicExamination: { ...prescriptionData.systemicExamination || {}, cns: e.target.value },
                })
              }
              placeholder="NAD"
            />
          </div>
        </div>
      </div>

      {/* Medicine Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Medicine</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowMedicineLoadDialog(true)} onMouseDown={(e)=>e.preventDefault()} onClickCapture={handleLoadMedicinesTemplates}>
              Load Medicines Template
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowMedicineSaveDialog(true)}>
              Save Medicines Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadPrevious}
              disabled={isLoadingPrevious}
            >
              {isLoadingPrevious ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              Load from Previous
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          <TypeAheadInput
            value={newMedicine}
            onChange={setNewMedicine}
            placeholder="Search medicines here..."
            type="medicines"
            className="w-full"
            showAddButtons={true}
            onAddItem={(item) => {
              const medicineName = item.text || item.name || item.value || "";
              setPrescriptionData({
                ...prescriptionData,
                medicines: [
                  ...prescriptionData.medicines,
                  {
                    id: Date.now().toString(),
                    name: medicineName,
                    frequency: "1-0-0",
                    medicineTime: "Post-meal",
                    duration: "",
                    quantity: "0",
                  },
                ],
              });
            }}
          />

          {/* Medicine Cards */}
          <div className="space-y-3">
            {prescriptionData.medicines.map((medicine: any) => (
              <MedicineCard
                key={medicine.id}
                medicine={medicine}
                onUpdate={(updates: any) => updateMedicine(medicine.id, updates)}
                onRemove={() => removeMedicine(medicine.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Advice and Tests Requested Section - Side by Side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Advice Section - Left Half */}
        <Card className="bg-custom-mutedgreen">
          <CardHeader>
            <CardTitle className="text-lg">Advice</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={prescriptionData.advice}
              onChange={(e) =>
                setPrescriptionData({
                  ...prescriptionData,
                  advice: e.target.value,
                })
              }
              placeholder="Write instructions or advice here..."
              rows={4}
              className="bg-white"
            />
          </CardContent>
        </Card>

        {/* Tests Requested Section - Right Half */}
        <Card className="bg-custom-mutedgreen">
          <CardHeader>
            <CardTitle className="text-lg">Tests Requested</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={prescriptionData.testsRequested}
              onChange={(e) =>
                setPrescriptionData({
                  ...prescriptionData,
                  testsRequested: e.target.value,
                })
              }
              placeholder="Enter the tests to be done by the patient here..."
              rows={4}
              className="bg-white"
            />
          </CardContent>
        </Card>
      </div>

      {/* Recommended Links Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Recommended Links</h3>
        
        <div className="space-y-3">
          {/* Display existing links */}
          {(prescriptionData.recommendedLinks || []).map((link: string, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="url"
                value={link}
                onChange={(e) => {
                  const updatedLinks = [...(prescriptionData.recommendedLinks || [])];
                  updatedLinks[index] = e.target.value;
                  setPrescriptionData({
                    ...prescriptionData,
                    recommendedLinks: updatedLinks,
                  });
                }}
                placeholder="https://example.com"
                className="flex-1"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  const updatedLinks = (prescriptionData.recommendedLinks || []).filter((_: string, i: number) => i !== index);
                  setPrescriptionData({
                    ...prescriptionData,
                    recommendedLinks: updatedLinks,
                  });
                  toast({
                    title: "Success",
                    description: "Link removed successfully",
                  });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {/* Add new link button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPrescriptionData({
                ...prescriptionData,
                recommendedLinks: [...(prescriptionData.recommendedLinks || []), ""],
              });
            }}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Link
          </Button>
        </div>
      </div>

      {/* Current Images Upload Section */}
      <div className="bg-custom-mutedgreen p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Current Images</h3>
        <div className="p-3 bg-slate-50 rounded-md border-2 border-dashed border-gray-300 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium text-gray-800">Upload Current Images</div>
            <label className="text-sm px-3 py-1 rounded bg-primary text-white cursor-pointer">
              {isUploadingCurrent ? 'Uploading…' : 'Upload'}
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                className="hidden" 
                onChange={handleUploadCurrentImages} 
              />
            </label>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {currentImages.length === 0 && (
              <div className="text-sm text-gray-500 col-span-3 md:col-span-4">No images uploaded yet</div>
            )}
            {currentImages.map((img) => (
              <div key={(img.id ?? img.url)} className="relative w-full aspect-square overflow-hidden rounded border">
                <Image src={img.url} alt="Current" fill className="object-cover" />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-white/80 text-red-600 text-xs px-1.5 py-0.5 rounded"
                  onClick={() => img.id && handleDeleteImage(img.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Historical Images Gallery */}
        {historicalImages.length > 0 && (
          <div className="mt-4">
            <ImageGallery
              images={historicalImages}
              appointments={patientAppointmentsForGallery}
              loading={loadingHistoricalImages}
              showUpload={false}
              allowDelete={false}
            />
          </div>
        )}
      </div>

      {/* Next Visit card – keep existing wrapper */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-2">Next Visit</h3>

        {/* ▸ Row 1: secondary labels */}
        <div className="grid grid-cols-12 gap-4 mb-2 text-sm text-gray-600 font-medium">
          <span className="col-span-4">Enter a number</span>
          <span className="col-span-4 ml-10">Choose Date</span>
          <span className="col-span-4">Next visit Date</span>
        </div>

        {/* ▸ Row 2: primary controls */}
        <div className="grid grid-cols-12 gap-6 items-center">
          {/* Number + unit buttons (first 4 cols) */}
          <div className="col-span-4 flex gap-2 items-center">
            <Input
              type="number"
              value={prescriptionData.nextVisit.value}
              onChange={(e) =>
                handleNextVisitChange(
                  prescriptionData.nextVisit.type,
                  parseInt(e.target.value) || 0
                )
              }
              placeholder="#"
              className="w-1/2 text-right"
            />

            <div className="flex-1 flex gap-1">
              {['Days', 'Weeks', 'Months'].map((type) => (
                <Button
                  key={type}
                  variant={
                    prescriptionData.nextVisit.type === type.toLowerCase()
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  onClick={() =>
                    handleNextVisitChange(type.toLowerCase(), prescriptionData.nextVisit.value)
                  }
                  className="flex-1"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Date picker (middle 4 cols) */}
          <div className="col-span-4">
            <div className="ml-10">
            <Input
              id="nextVisitDate"
              type="date"
              value={
                prescriptionData.nextVisit.date
                  ? new Date(prescriptionData.nextVisit.date).toISOString().substring(0, 10)
                  : ''
              }
              onChange={(e) => {
                const picked = e.target.value ? new Date(e.target.value) : null;
                setPrescriptionData({
                  ...prescriptionData,
                  nextVisit: { ...prescriptionData.nextVisit, date: picked },
                });
              }}
              className="bg-white w-fit"
            />
            </div>

          </div>

          {/* Display selected date (last 4 cols) */}
          <div className="col-span-4 flex items-center gap-2 text-sm text-gray-600">
            <span className="font-bold text-xl text-primary">
              {prescriptionData.nextVisit.date
                ? new Date(prescriptionData.nextVisit.date).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  weekday: 'long',
                })
                : 'dd-mm-yyyy (---)'}
            </span>
          </div>
        </div>
      </div>

      {/* Save Template Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Template</DialogTitle>
            <DialogDescription>
              Enter a name for your prescription template.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="templateName" className="text-right">
                Name
              </Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="col-span-3"
                placeholder="Enter template name..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={isSavingTemplate}>
              {isSavingTemplate ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Template Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Load Template</DialogTitle>
            <DialogDescription>
              Select a template to load into the prescription form.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
            {savedTemplates.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No saved templates found
              </div>
            ) : (
              savedTemplates.map((template: any) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div>
                    <h4 className="font-medium">{template.templateName || template.name || 'Unnamed Template'}</h4>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(template.createdAt).toLocaleDateString()}
                    </p>
                    {template.templateDescription && (
                      <p className="text-xs text-gray-400 mt-1">{template.templateDescription}</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleSelectTemplate(template); }}>
                    Load
                  </Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complaints Templates Dialogs */}
      <Dialog open={showComplaintSaveDialog} onOpenChange={setShowComplaintSaveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Complaints Template</DialogTitle>
            <DialogDescription>Enter a name for this complaints template.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="complaintTemplateName" className="text-right">Name</Label>
              <Input id="complaintTemplateName" value={complaintTemplateName} onChange={(e)=>setComplaintTemplateName(e.target.value)} className="col-span-3" placeholder="Enter template name..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowComplaintSaveDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveComplaintsTemplate} disabled={isSavingComplaintTemplate}>
              {isSavingComplaintTemplate ? (<Loader2 className="h-4 w-4 mr-2 animate-spin" />) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showComplaintLoadDialog} onOpenChange={setShowComplaintLoadDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Load Complaints Template</DialogTitle>
            <DialogDescription>Select a complaints template to load.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
            {complaintTemplates.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No complaints templates found</div>
            ) : (
              complaintTemplates.map((template: any) => (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => applyComplaintsTemplate(template)}>
                  <div>
                    <h4 className="font-medium">{template.templateName || 'Unnamed Template'}</h4>
                    <p className="text-sm text-gray-500">Created: {new Date(template.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); applyComplaintsTemplate(template); }}>Load</Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowComplaintLoadDialog(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Medicines Templates Dialogs */}
      <Dialog open={showMedicineSaveDialog} onOpenChange={setShowMedicineSaveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Medicines Template</DialogTitle>
            <DialogDescription>Enter a name for this medicines template.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="medicineTemplateName" className="text-right">Name</Label>
              <Input id="medicineTemplateName" value={medicineTemplateName} onChange={(e)=>setMedicineTemplateName(e.target.value)} className="col-span-3" placeholder="Enter template name..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMedicineSaveDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveMedicinesTemplate} disabled={isSavingMedicineTemplate}>
              {isSavingMedicineTemplate ? (<Loader2 className="h-4 w-4 mr-2 animate-spin" />) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMedicineLoadDialog} onOpenChange={setShowMedicineLoadDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Load Medicines Template</DialogTitle>
            <DialogDescription>Select a medicines template to load.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
            {medicineTemplates.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No medicines templates found</div>
            ) : (
              medicineTemplates.map((template: any) => (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => applyMedicinesTemplate(template)}>
                  <div>
                    <h4 className="font-medium">{template.templateName || 'Unnamed Template'}</h4>
                    <p className="text-sm text-gray-500">Created: {new Date(template.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); applyMedicinesTemplate(template); }}>Load</Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMedicineLoadDialog(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prescription Modal */}
      <Dialog open={prescriptionModalOpen} onOpenChange={setPrescriptionModalOpen}>
        <DialogContent className="sm:max-w-[720px] max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Prescriptions</DialogTitle>
            <DialogDescription>Select an appointment to view its prescription</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loadingAppointments ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading prescriptions...</p>
              </div>
            ) : patientAppointments.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No appointments found</div>
            ) : (
              <ul className="divide-y">
                {patientAppointments.map((apt: any) => {
                  const hasPrescription = Boolean(apt.prescriptionLink);
                  const viewHref = apt.prescriptionLink || `/doctor/appointments/${apt.id}/prescription`;
                  return (
                    <li key={apt.id} className="py-3 flex items-center">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">
                          Appointment #{apt.id}
                        </div>
                        <div className="text-xs text-gray-500">
                          {apt.doctorAvailability?.date 
                            ? new Date(apt.doctorAvailability.date).toLocaleString() 
                            : apt.date 
                            ? new Date(apt.date).toLocaleString() 
                            : 'No date'}
                        </div>
                        {apt.doctor?.name && (
                          <div className="text-xs text-gray-500 mt-1">
                            Dr. {apt.doctor.name}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        {hasPrescription && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(viewHref, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        )}
                        {hasPrescription ? (
                          <Button
                            size="sm"
                            className="w-44 shrink-0"
                            onClick={() => window.open(`/doctor/appointments/${apt.id}`, '_blank')}
                          >
                            Edit Prescription
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="w-44 shrink-0"
                            onClick={() => window.open(`/doctor/appointments/${apt.id}`, '_blank')}
                          >
                            Generate Prescription
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrescriptionModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reports Modal - Unified Analysis Modal */}
      <UnifiedAnalysisModal
        isOpen={reportsModalOpen}
        onClose={() => setReportsModalOpen(false)}
        patientId={String(patientInfo?.patientId || patientInfo?.id || '')}
        labReports={labBookings.map((booking: any) => ({
          id: booking.id,
          labPackageName: booking.labPackageName || booking.labPackage?.name || 'Unknown',
          date: booking.date || booking.labDate || new Date().toISOString(),
          status: booking.status || "COMPLETED",
          labResult: booking.labResult,
          reportLink: booking.reportLink
        }))}
        standaloneReports={standaloneReports}
        preSelectedStandaloneReportId={null}
        hideAIAnalysis={true}
      />
      </div>
    </>
  );
} 