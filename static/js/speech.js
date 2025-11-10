// Advanced Speech Recognition and Processing
class AdvancedSpeechProcessor {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.finalTranscript = '';
        this.interimTranscript = '';
        this.speechEvents = new EventTarget();
        
        this.initializeSpeechRecognition();
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.configureRecognition();
            this.setupEventListeners();
        } else {
            console.warn('Speech recognition not supported in this browser');
        }
    }

    configureRecognition() {
        if (this.recognition) {
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 1;
        }
    }

    setupEventListeners() {
        if (!this.recognition) return;

        this.recognition.onstart = () => {
            this.isListening = true;
            this.speechEvents.dispatchEvent(new CustomEvent('listeningStart'));
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.speechEvents.dispatchEvent(new CustomEvent('listeningEnd'));
        };

        this.recognition.onresult = (event) => {
            this.interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    this.finalTranscript += transcript + ' ';
                } else {
                    this.interimTranscript += transcript;
                }
            }
            
            this.speechEvents.dispatchEvent(new CustomEvent('transcriptUpdate', {
                detail: {
                    final: this.finalTranscript,
                    interim: this.interimTranscript
                }
            }));
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.speechEvents.dispatchEvent(new CustomEvent('error', {
                detail: { error: event.error }
            }));
        };
    }

    startListening() {
        if (this.recognition && !this.isListening) {
            this.finalTranscript = '';
            this.interimTranscript = '';
            
            try {
                this.recognition.start();
                return true;
            } catch (error) {
                console.error('Error starting speech recognition:', error);
                return false;
            }
        }
        return false;
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            return true;
        }
        return false;
    }

    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    getTranscript() {
        return {
            final: this.finalTranscript.trim(),
            interim: this.interimTranscript
        };
    }

    clearTranscript() {
        this.finalTranscript = '';
        this.interimTranscript = '';
    }

    // Speech analysis methods
    analyzeSpeechCharacteristics(transcript, audioData) {
        return {
            speakingRate: this.calculateSpeakingRate(transcript, audioData),
            clarity: this.assessClarity(transcript),
            confidence: this.assessConfidence(transcript),
            fillerWords: this.detectFillerWords(transcript),
            pauses: this.detectPauses(audioData)
        };
    }

    calculateSpeakingRate(transcript, audioData) {
        const wordCount = transcript.split(/\s+/).length;
        const duration = audioData ? audioData.duration : 60; // Default 1 minute
        return Math.round((wordCount / duration) * 60); // Words per minute
    }

    assessClarity(transcript) {
        // Simple clarity assessment based on sentence structure
        const sentences = transcript.split(/[.!?]+/).filter(s => s.length > 0);
        const avgSentenceLength = transcript.split(/\s+/).length / Math.max(sentences.length, 1);
        
        let clarityScore = 8; // Base score
        
        if (avgSentenceLength > 25) clarityScore -= 2; // Too long
        if (avgSentenceLength < 8) clarityScore -= 1;  // Too short
        
        return Math.max(1, Math.min(10, clarityScore));
    }

    assessConfidence(transcript) {
        const confidentIndicators = [
            'i am confident', 'i believe', 'definitely', 'certainly',
            'without a doubt', 'clearly', 'obviously'
        ];
        
        const unconfidentIndicators = [
            'i think', 'maybe', 'perhaps', 'possibly',
            'i\'m not sure', 'i don\'t know', 'kind of', 'sort of'
        ];
        
        const text = transcript.toLowerCase();
        let confidenceScore = 5; // Neutral base score
        
        confidentIndicators.forEach(indicator => {
            if (text.includes(indicator)) confidenceScore += 1;
        });
        
        unconfidentIndicators.forEach(indicator => {
            if (text.includes(indicator)) confidenceScore -= 1;
        });
        
        return Math.max(1, Math.min(10, confidenceScore));
    }

    detectFillerWords(transcript) {
        const fillerWords = [
            'um', 'uh', 'like', 'you know', 'actually', 'basically',
            'literally', 'honestly', 'so', 'well', 'right'
        ];
        
        const words = transcript.toLowerCase().split(/\s+/);
        let fillerCount = 0;
        
        fillerWords.forEach(filler => {
            const regex = new RegExp(`\\b${filler}\\b`, 'gi');
            const matches = transcript.match(regex);
            if (matches) fillerCount += matches.length;
        });
        
        return {
            count: fillerCount,
            density: (fillerCount / words.length) * 100,
            words: fillerWords.filter(filler => transcript.toLowerCase().includes(filler))
        };
    }

    detectPauses(audioData) {
        // This would require more advanced audio analysis
        // For now, return a simulated analysis
        return {
            totalPauses: Math.floor(Math.random() * 5) + 1,
            averagePauseDuration: (Math.random() * 2) + 0.5,
            pauseFrequency: Math.random() * 0.1
        };
    }

    // Real-time speech feedback
    provideRealTimeFeedback(analysis) {
        const feedback = [];
        
        if (analysis.speakingRate < 120) {
            feedback.push('Try speaking a bit faster for better engagement');
        } else if (analysis.speakingRate > 180) {
            feedback.push('Consider slowing down slightly for better clarity');
        }
        
        if (analysis.fillerWords.density > 5) {
            feedback.push(`Reduce filler words like "${analysis.fillerWords.words.slice(0, 2).join(', ')}"`);
        }
        
        if (analysis.confidence < 6) {
            feedback.push('Speak with more confidence and conviction');
        }
        
        return feedback;
    }
}

// Voice Activity Detection
class VoiceActivityDetector {
    constructor() {
        this.isVoiceActive = false;
        this.silenceThreshold = 0.01;
        this.voiceTimeout = null;
    }

    async initialize() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            
            microphone.connect(analyser);
            analyser.fftSize = 256;
            
            this.startDetection(analyser);
            return true;
        } catch (error) {
            console.error('Error initializing VAD:', error);
            return false;
        }
    }

    startDetection(analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const detect = () => {
            analyser.getByteFrequencyData(dataArray);
            
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;
            const normalized = average / 256;
            
            const wasVoiceActive = this.isVoiceActive;
            this.isVoiceActive = normalized > this.silenceThreshold;
            
            if (this.isVoiceActive !== wasVoiceActive) {
                this.onVoiceActivityChange(this.isVoiceActive);
            }
            
            requestAnimationFrame(detect);
        };
        
        detect();
    }

    onVoiceActivityChange(isActive) {
        // Clear previous timeout
        if (this.voiceTimeout) {
            clearTimeout(this.voiceTimeout);
        }
        
        if (isActive) {
            // Voice detected
            this.voiceTimeout = setTimeout(() => {
                // Continuous voice for 2 seconds - likely actual speech
                this.dispatchEvent('voiceStart');
            }, 2000);
        } else {
            // Silence detected
            this.voiceTimeout = setTimeout(() => {
                // Continuous silence for 1 second - likely speech ended
                this.dispatchEvent('voiceEnd');
            }, 1000);
        }
    }

    dispatchEvent(eventName) {
        window.dispatchEvent(new CustomEvent(eventName));
    }
}

// Speech Synthesis for feedback
class SpeechSynthesizer {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.selectedVoice = null;
        
        this.loadVoices();
    }

    loadVoices() {
        // Wait for voices to be loaded
        this.synth.onvoiceschanged = () => {
            this.voices = this.synth.getVoices();
            this.selectOptimalVoice();
        };
        
        // Initial load
        this.voices = this.synth.getVoices();
        if (this.voices.length > 0) {
            this.selectOptimalVoice();
        }
    }

    selectOptimalVoice() {
        // Prefer natural-sounding English voices
        const preferredVoices = this.voices.filter(voice => 
            voice.lang.startsWith('en-') && 
            voice.localService === true
        );
        
        this.selectedVoice = preferredVoices[0] || this.voices[0];
    }

    speak(text, options = {}) {
        if (this.synth.speaking) {
            this.synth.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply options
        utterance.voice = this.selectedVoice;
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 0.8;
        
        // Add event listeners
        utterance.onstart = () => {
            if (options.onStart) options.onStart();
        };
        
        utterance.onend = () => {
            if (options.onEnd) options.onEnd();
        };
        
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            if (options.onError) options.onError(event);
        };
        
        this.synth.speak(utterance);
    }

    provideAudioFeedback(feedback) {
        const positivePhrases = [
            'Great job on that answer!',
            'Excellent response!',
            'Well articulated!',
            'Good thinking!'
        ];
        
        const improvementPhrases = [
            'Consider adding more detail to your answer.',
            'Try to structure your response more clearly.',
            'Remember to use specific examples.',
            'Focus on being more concise.'
        ];
        
        // Select random positive phrase
        const positivePhrase = positivePhrases[Math.floor(Math.random() * positivePhrases.length)];
        
        // Speak feedback
        this.speak(`${positivePhrase} ${feedback.join(' ')}`, {
            rate: 1.1,
            onStart: () => console.log('Audio feedback started'),
            onEnd: () => console.log('Audio feedback completed')
        });
    }

    stop() {
        if (this.synth.speaking) {
            this.synth.cancel();
        }
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        AdvancedSpeechProcessor, 
        VoiceActivityDetector, 
        SpeechSynthesizer 
    };
} else {
    // Initialize speech components when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        window.speechProcessor = new AdvancedSpeechProcessor();
        window.voiceDetector = new VoiceActivityDetector();
        window.speechSynthesizer = new SpeechSynthesizer();
    });
}