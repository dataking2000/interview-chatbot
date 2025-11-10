# -*- coding: utf-8 -*-

import base64
import wave
import io
import speech_recognition as sr
import tempfile
import os

class SpeechProcessor:
    def __init__(self):
        self.recognizer = sr.Recognizer()
    
    def analyze_speech(self, audio_data):
        """Analyze speech from base64 audio data"""
        try:
            # Decode base64 audio
            audio_bytes = base64.b64decode(audio_data.split(',')[1])
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_audio:
                temp_audio.write(audio_bytes)
                temp_audio_path = temp_audio.name
            
            # Analyze audio features
            analysis = self.analyze_audio_features(temp_audio_path)
            
            # Convert speech to text
            text = self.speech_to_text(temp_audio_path)
            analysis['transcribed_text'] = text
            
            # Clean up
            os.unlink(temp_audio_path)
            
            return analysis
            
        except Exception as e:
            return {
                'speech_analysis': {'error': str(e)},
                'transcribed_text': ''
            }
    
    def analyze_audio_features(self, audio_path):
        """Analyze audio features like pace, clarity, etc."""
        try:
            with wave.open(audio_path, 'rb') as audio_file:
                frames = audio_file.getnframes()
                rate = audio_file.getframerate()
                duration = frames / float(rate)
                
                # Basic audio analysis
                analysis = {
                    'duration_seconds': round(duration, 2),
                    'sample_rate': rate,
                    'frames': frames,
                    'speaking_rate': self.estimate_speaking_rate(audio_path, duration)
                }
                
                return {'audio_metrics': analysis}
                
        except Exception as e:
            return {'audio_metrics': {'error': f"Audio analysis failed: {str(e)}"}}
    
    def estimate_speaking_rate(self, audio_path, duration):
        """Estimate words per minute from audio"""
        try:
            text = self.speech_to_text(audio_path)
            if text:
                word_count = len(text.split())
                return round(word_count / (duration / 60), 2)  # Words per minute
            return 0
        except:
            return 0
    
    def speech_to_text(self, audio_path):
        """Convert speech to text using Google Speech Recognition"""
        try:
            with sr.AudioFile(audio_path) as source:
                audio = self.recognizer.record(source)
                text = self.recognizer.recognize_google(audio)
                return text
        except sr.UnknownValueError:
            return "[Speech not understood]"
        except sr.RequestError as e:
            return f"[Speech recognition error: {e}]"
        except Exception as e:
            return f"[Error: {str(e)}]"