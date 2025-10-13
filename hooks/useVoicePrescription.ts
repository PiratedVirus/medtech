// New file implementing robust voice prescription hook
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";

interface VoiceState {
  transcript: string; // Clean, displayable text
  raw: string; // Raw final transcript before clean-up
  interim: string; // Interim transcript while recording
  isRecording: boolean;
  isProcessing: boolean;
}

interface UseVoicePrescriptionOptions {
  /** Automatically call LLM when recording stops (default true) */
  autoProcessOnStop?: boolean;
  /** Callback when structured prescription JSON is ready */
  onPrescriptionReady: (data: any) => void;
}

export function useVoicePrescription({ autoProcessOnStop = true, onPrescriptionReady }: UseVoicePrescriptionOptions) {
  // ----- state ------------------------------------------------------------
  const [state, setState] = useState<VoiceState>({
    transcript: "",
    raw: "",
    interim: "",
    isRecording: false,
    isProcessing: false,
  });

  // refs so we can mutate without causing renders during recording
  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const autoProcessTimerRef = useRef<NodeJS.Timeout>();
  const autoProcessEnabledRef = useRef<boolean>(autoProcessOnStop);

  // ----- helpers ----------------------------------------------------------
  const resetState = useCallback(() => {
    setState({ transcript: "", raw: "", interim: "", isRecording: false, isProcessing: false });
  }, []);

  const clear = useCallback(() => {
    // Stop speech recognition
    recognitionRef.current?.abort();
    // Cancel in-flight fetch
    abortControllerRef.current?.abort();
    // Cancel pending auto-process timer
    if (autoProcessTimerRef.current) clearTimeout(autoProcessTimerRef.current);
    // Disable any auto processing still queued
    autoProcessEnabledRef.current = false;
    resetState();
    toast({ title: "Cleared", description: "Voice input cleared successfully." });
  }, [resetState]);

  const processTranscript = useCallback(async (text: string) => {
    if (!text.trim()) return;
    // Cancel any previous fetch
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState((s) => ({ ...s, isProcessing: true }));

    try {
      const res = await fetch("/api/llm-process/voice-prescription-openrouter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to process");
      }
      const data = await res.json();
      onPrescriptionReady(data);
      toast({ title: "Voice Processed", description: "Prescription auto-filled." });
    } catch (e: any) {
      if (controller.signal.aborted) return; // cleared or new request
      toast({ title: "Processing Error", description: e.message || "Failed" , variant: "destructive"});
    } finally {
      setState((s) => ({ ...s, isProcessing: false }));
    }
  }, [onPrescriptionReady]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const startRecording = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Speech Recognition Not Supported", description: "Please use manual input.", variant: "destructive" });
      return;
    }
    // cancel previous recognition if any
    recognitionRef.current?.abort();

    const recognition = new SpeechRecognition();
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      autoProcessEnabledRef.current = autoProcessOnStop;
      setState((s) => ({ ...s, isRecording: true, interim: "", raw: "", transcript: "" }));
    };

    recognition.onresult = (e: any) => {
      let interimChunk = "";
      let finalChunk = "";
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        const result = e.results[i];
        if (result.isFinal) finalChunk += result[0].transcript;
        else interimChunk += result[0].transcript;
      }
      if (interimChunk)
        setState((s) => ({ ...s, interim: interimChunk }));
      if (finalChunk)
        setState((s) => ({ ...s, raw: s.raw + finalChunk + " ", interim: "" }));
    };

    recognition.onerror = (err: any) => {
      console.error("Speech rec error", err);
      toast({ title: "Speech Error", description: err.error || "Unknown", variant: "destructive" });
      setState((s) => ({ ...s, isRecording: false }));
    };

    recognition.onend = () => {
      setState((s) => ({ ...s, isRecording: false, interim: "" }));
      const cleanText = state.raw.trim();
      setState((s) => ({ ...s, transcript: cleanText }));

      if (autoProcessEnabledRef.current && cleanText) {
        autoProcessTimerRef.current = setTimeout(() => {
          processTranscript(cleanText);
        }, 300);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, [autoProcessOnStop, processTranscript, state.raw]);

  // cleanup on unmount
  useEffect(() => clear, []); // eslint-disable-line react-hooks/exhaustive-deps

  // public API
  return {
    state,
    startRecording,
    stopRecording,
    clear,
    process: () => processTranscript(state.transcript),
    setAutoProcessOnStop: (v: boolean) => (autoProcessEnabledRef.current = v),
  } as const;
}
