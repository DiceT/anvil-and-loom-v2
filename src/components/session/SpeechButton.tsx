import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface SpeechButtonProps {
    onTranscript: (text: string) => void;
    isListening?: boolean;
    onListeningChange?: (isListening: boolean) => void;
}

export function SpeechButton({ onTranscript, isListening: controlledIsListening, onListeningChange }: SpeechButtonProps) {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Sync controlled state
    useEffect(() => {
        if (controlledIsListening !== undefined && controlledIsListening !== isListening) {
            if (controlledIsListening) {
                startListening();
            } else {
                stopListening();
            }
        }
    }, [controlledIsListening]);

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = false; // We want short bursts for chat
        recognition.interimResults = true;

        recognition.onstart = () => {
            setIsListening(true);
            onListeningChange?.(true);
        };

        recognition.onend = () => {
            setIsListening(false);
            onListeningChange?.(false);
        };

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                onTranscript(finalTranscript);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            if (event.error === 'network') {
                alert("Speech Recognition unavailable: Network error.\n\nNOTE: Electron apps require Google API keys to use the default speech engine. This feature may not work in development builds or offline.");
            }
            setIsListening(false);
            onListeningChange?.(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <button
            type="button"
            onClick={toggleListening}
            className={`p-2 rounded-full transition-all ${isListening
                ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 animate-pulse'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
            title={isListening ? 'Stop Listening' : 'Voice Input'}
        >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
    );
}
