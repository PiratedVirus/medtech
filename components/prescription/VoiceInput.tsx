"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Square, Play, Trash2, FileText, Bot, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceInputProps {
  onTranscriptionComplete: (data: any) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
}

export default function VoiceInput({ onTranscriptionComplete, isRecording, setIsRecording }: VoiceInputProps) {
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [hasError, setHasError] = useState(false);
  const [errorType, setErrorType] = useState<string>("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState("");
  const [isTestingAPI, setIsTestingAPI] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Suppress extension errors for cleaner console
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      if (
        message.includes('runtime.lastError') ||
        message.includes('Could not establish connection') ||
        message.includes('Receiving end does not exist')
      ) {
        return; // Suppress extension errors
      }
      originalError.apply(console, args);
    };

    // Check browser compatibility and show manual input by default if speech recognition is problematic
    const checkBrowserCompatibility = () => {
      console.log('Browser compatibility check:');
      console.log('- webkitSpeechRecognition:', 'webkitSpeechRecognition' in window);
      console.log('- SpeechRecognition:', 'SpeechRecognition' in window);
      console.log('- Navigator online:', navigator.onLine);
      console.log('- Location protocol:', window.location.protocol);
      console.log('- User agent:', navigator.userAgent);
    };

    checkBrowserCompatibility();
    
    // Log version for debugging
    console.log('🎤 VoiceInput Component v2.3 loaded');

    // Initialize speech recognition
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setIsRecording(true);
        setHasError(false);
        setErrorType("");
        console.log('🎤 Recording started');
        toast({
          title: "Recording Started",
          description: "Listening for prescription details...",
        });
      };

      recognitionInstance.onresult = (event: any) => {
        let interim = '';
        
        // Process new results from the current event
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            console.log('✅ Final result:', event.results[i][0].transcript);
            // Add final result to our accumulated final transcript
            setFinalTranscript(prev => prev + event.results[i][0].transcript + ' ');
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        
        if (interim) {
          console.log('🔄 Interim result:', interim);
        }

        // Update interim display
        setInterimTranscript(interim);

        // For real-time display during recording
        if (isRecording) {
          setFinalTranscript(currentFinal => {
            const displayText = currentFinal + (interim ? '___INTERIM___' + interim : '');
            setTranscript(displayText);
            return currentFinal;
          });
        }
      };

      recognitionInstance.onerror = (event: any) => {
        // Don't log network errors to console as they're common and not actionable
        if (event.error !== 'network') {
          console.error('Speech recognition error:', event.error);
        }
        
        let errorMessage = `Error: ${event.error}`;
        let errorTitle = "Recording Error";
        
        switch (event.error) {
          case 'network':
            errorTitle = "Speech Service Unavailable";
            errorMessage = "Google's speech recognition service is temporarily unavailable. This is a common issue. Please try again in a few moments or use manual input.";
            break;
          case 'not-allowed':
            errorTitle = "Permission Denied";
            errorMessage = "Microphone access denied. Please allow microphone permissions and try again.";
            break;
          case 'no-speech':
            errorTitle = "No Speech Detected";
            errorMessage = "No speech detected. Please try speaking louder or closer to the microphone.";
            break;
          case 'aborted':
            errorTitle = "Recording Aborted";
            errorMessage = "Recording was stopped. You can try again.";
            break;
          case 'audio-capture':
            errorTitle = "Audio Capture Error";
            errorMessage = "No microphone found. Please check your microphone connection.";
            break;
          case 'service-not-allowed':
            errorTitle = "Service Not Allowed";
            errorMessage = "Speech recognition service not allowed. Please use HTTPS or localhost.";
            break;
        }
        
        setHasError(true);
        setErrorType(event.error);
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
        setIsRecording(false);
      };

      recognitionInstance.onend = () => {
        console.log('🛑 Recording stopped');
        setIsRecording(false);
        
        // When recording ends, show only the clean final transcript
        setInterimTranscript('');
        
        // Get the current final transcript and set it as the display transcript
        setFinalTranscript(current => {
          const cleanText = current.trim();
          console.log('📝 Final transcript:', cleanText);
          setTranscript(cleanText);
          
          if (cleanText) {
            // Automatically process and fill the form
            setTimeout(() => {
              autoProcessAndFill(cleanText);
            }, 500); // Small delay for better UX
            
            toast({
              title: "Recording Complete",
              description: "Processing speech to auto-fill prescription form...",
            });
          } else {
            toast({
              title: "No Speech Detected",
              description: "No clear speech was detected. Please try again or use manual input.",
              variant: "destructive",
            });
          }
          
          return current;
        });
      };

      setRecognition(recognitionInstance);
    } else {
      // Speech recognition not available - show manual input by default
      setShowManualInput(true);
      toast({
        title: "Speech Recognition Not Available",
        description: "Using manual text input instead. Your browser doesn't support speech recognition.",
        variant: "destructive",
      });
    }

    // Cleanup function to restore original console.error
    return () => {
      // Restore original console.error on cleanup
      if (typeof window !== 'undefined') {
        console.error = originalError;
      }
    };
  }, [toast, setIsRecording]);

  const startRecording = () => {
    if (recognition) {
      // Reset all transcript states
      setTranscript("");
      setFinalTranscript("");
      setInterimTranscript("");
      setHasError(false);
      setErrorType("");
      
      try {
        recognition.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        toast({
          title: "Recording Failed",
          description: "Failed to start recording. Please try again.",
          variant: "destructive",
        });
        setIsRecording(false);
      }
    } else {
      toast({
        title: "Speech Recognition Not Available",
        description: "Speech recognition is not available. Please refresh the page and try again.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
    }
  };

  const processTranscription = async () => {
    // Use the clean final transcript (no interim text)
    const cleanTranscript = transcript.trim();
    
    if (!cleanTranscript) {
      toast({
        title: "No Text to Process",
        description: "Please record some speech first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/llm-process/voice-prescription-openrouter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: cleanTranscript,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process voice input');
      }

      const data = await response.json();
      
      // Validate the response data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }

      onTranscriptionComplete(data);
      
      toast({
        title: "Voice Input Processed",
        description: "Prescription data has been auto-filled from your voice input.",
      });
    } catch (error) {
      console.error('Error processing voice input:', error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process voice input. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearTranscript = () => {
    // Stop any ongoing recognition
    if (recognition) {
      recognition.abort();
    }
    
    // Clear all transcript states
    setTranscript("");
    setFinalTranscript("");
    setInterimTranscript("");
    setHasError(false);
    setErrorType("");
    setIsRecording(false);
    setIsProcessing(false);
    setIsAutoFilling(false);
    
    // Clear manual text if it exists
    setManualText("");
    
    toast({
      title: "Cleared Successfully",
      description: "All voice data has been cleared.",
    });
  };

  const retryRecording = () => {
    // Stop any ongoing recognition first
    if (recognition) {
      recognition.abort();
    }
    
    // Clear all states
    setHasError(false);
    setErrorType("");
    setTranscript("");
    setFinalTranscript("");
    setInterimTranscript("");
    setIsProcessing(false);
    setIsAutoFilling(false);
    
    // Start fresh recording
    startRecording();
  };

  const handleManualTextSubmit = async () => {
    if (!manualText.trim()) {
      toast({
        title: "No Text Entered",
        description: "Please enter some text to process.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/llm-process/voice-prescription-openrouter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: manualText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process text input');
      }

      const data = await response.json();
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }

      onTranscriptionComplete(data);
      
      toast({
        title: "Text Input Processed",
        description: "Prescription data has been auto-filled from your text input.",
      });
      
      setShowManualInput(false);
      setManualText("");
    } catch (error) {
      console.error('Error processing manual text:', error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process text input. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const testAPI = async () => {
    setIsTestingAPI(true);
    try {
      const testText = "Patient has fever and headache, blood pressure 120 over 80, prescribe paracetamol 500 milligrams twice daily for 5 days";
      
      const response = await fetch('/api/llm-process/voice-prescription-openrouter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: testText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to test API');
      }

      const data = await response.json();
      
      toast({
        title: "API Test Successful",
        description: `OpenRouter API is working! Extracted ${data.complaints?.length || 0} complaints, ${data.medicines?.length || 0} medicines.`,
      });
      
      console.log('API Test Result:', data);
    } catch (error) {
      console.error('API Test Error:', error);
      toast({
        title: "API Test Failed",
        description: error instanceof Error ? error.message : "OpenRouter API test failed",
        variant: "destructive",
      });
    } finally {
      setIsTestingAPI(false);
    }
  };

  const autoProcessAndFill = async (text: string) => {
    setIsAutoFilling(true);
    try {
      const response = await fetch('/api/llm-process/voice-prescription-openrouter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: text,
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

      onTranscriptionComplete(data);
      
      const addedItems = [];
      if (data.complaints?.length) addedItems.push(`${data.complaints.length} complaint(s)`);
      if (data.medicines?.length) addedItems.push(`${data.medicines.length} medicine(s)`);
      if (data.advice?.trim()) addedItems.push("advice");
      if (data.testsRequested?.trim()) addedItems.push("tests");
      
      toast({
        title: "✨ AI Auto-Fill Complete",
        description: `Prescription form updated with: ${addedItems.join(", ")}`,
      });
      
    } catch (error) {
      console.error('Error in auto-processing:', error);
      toast({
        title: "Auto-Fill Error",
        description: error instanceof Error ? error.message : "Failed to auto-fill. You can still use 'Process & Fill Form' manually.",
        variant: "destructive",
      });
    } finally {
      setIsAutoFilling(false);
    }
  };

  return (
    <Card className="w-full relative">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="relative">
            <Bot className="h-5 w-5 text-blue-600" />
            {(isRecording || isAutoFilling) && (
              <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            )}
          </div>
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">
            AI Mic
          </span>
          {isAutoFilling && (
            <div className="flex items-center gap-1 text-blue-600 text-sm">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <span className="text-xs">Auto-filling...</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {!isRecording ? (
            <Button 
              onClick={startRecording} 
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              disabled={hasError && errorType === 'service-not-allowed' || isAutoFilling}
            >
              <div className="relative">
                <Mic className="h-4 w-4" />
                {isAutoFilling && (
                  <div className="absolute inset-0 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              {isAutoFilling ? "Processing..." : "Start Recording"}
            </Button>
          ) : (
            <Button onClick={stopRecording} variant="destructive" className="flex items-center gap-2 animate-pulse">
              <Square className="h-4 w-4" />
              Stop Recording
            </Button>
          )}
          
          {/* Always show manual input option */}
          <Button 
            onClick={() => setShowManualInput(!showManualInput)} 
            variant={showManualInput ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {showManualInput ? "Hide Manual Input" : "Manual Input"}
          </Button>

          {/* API Test Button */}
          <Button 
            onClick={testAPI}
            disabled={isTestingAPI}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
          >
            {isTestingAPI ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Test API
          </Button>
          
          {hasError && errorType !== 'service-not-allowed' && (
            <Button 
              onClick={retryRecording} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Mic className="h-4 w-4" />
              Retry Recording
            </Button>
          )}
          
          {transcript && (
            <>
              <Button 
                onClick={processTranscription} 
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Process & Fill Form
              </Button>
              
              <Button 
                onClick={clearTranscript} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            </>
          )}
        </div>

        {transcript && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">
              {isRecording ? "Recording... (Live Transcription)" : "Final Transcription"}
            </h4>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {isRecording && transcript.includes('___INTERIM___') ? (
                <>
                  <span>{transcript.split('___INTERIM___')[0]}</span>
                  <span className="text-blue-600 italic">
                    {transcript.split('___INTERIM___')[1]}
                  </span>
                </>
              ) : (
                transcript
              )}
            </div>
            {isRecording && transcript.includes('___INTERIM___') && (
              <p className="text-xs text-blue-600 mt-1">
                <em>Blue text is being processed... Click "Stop Recording" to finalize.</em>
              </p>
            )}
            {!isRecording && transcript && (
              <p className="text-xs text-green-600 mt-1">
                <em>✓ Recording complete. Clean text ready for processing.</em>
              </p>
            )}
          </div>
        )}

        {showManualInput && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium mb-2 text-blue-800">Manual Text Input</h4>
            <p className="text-sm text-blue-700 mb-3">
              Type your prescription details here if voice input is not working:
            </p>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Example: Patient has fever and headache, BP 120/80, prescribe paracetamol 500mg twice daily for 5 days..."
              className="w-full p-3 border border-blue-300 rounded-lg resize-none"
              rows={4}
            />
            <div className="flex gap-2 mt-3">
              <Button 
                onClick={handleManualTextSubmit}
                disabled={isProcessing || !manualText.trim()}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Process Text
              </Button>
              <Button 
                onClick={() => setManualText("")}
                variant="outline"
                size="sm"
                disabled={!manualText.trim()}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear Text
              </Button>
              <Button 
                onClick={() => setShowManualInput(false)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p><strong>Instructions:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li><strong>Voice Input:</strong> Click "Start Recording", speak clearly, then "Stop Recording"</li>
            <li><strong>Final Text:</strong> Clean transcript appears only after stopping recording (no duplicates)</li>
            <li><strong>Manual Input:</strong> Click "Manual Input" to type directly (recommended)</li>
            <li><strong>Example:</strong> "Patient has fever and headache, BP 120/80, prescribe paracetamol 500mg twice daily for 5 days"</li>
          </ul>
          
          {hasError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
              <p className="font-medium text-red-800 mb-1">Troubleshooting:</p>
              <ul className="list-disc list-inside space-y-1 text-red-700">
                {errorType === 'network' && (
                  <>
                    <li>Google's speech service may be temporarily unavailable</li>
                    <li>Try the "Manual Input" option below</li>
                    <li>Or wait a few minutes and try again</li>
                  </>
                )}
                {errorType === 'not-allowed' && (
                  <>
                    <li>Allow microphone permissions in your browser</li>
                    <li>Check browser settings for microphone access</li>
                  </>
                )}
                {errorType === 'service-not-allowed' && (
                  <>
                    <li>Use HTTPS or localhost for speech recognition</li>
                    <li>Some browsers require secure connections</li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
