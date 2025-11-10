# -*- coding: utf-8 -*-

import re
import nltk
from textblob import TextBlob
from nltk.sentiment import SentimentIntensityAnalyzer
from nltk.tokenize import sent_tokenize
import json

class AIAnalyzer:
    def __init__(self):
        self.sia = SentimentIntensityAnalyzer()
        self.load_evaluation_criteria()
    
    def load_evaluation_criteria(self):
        """Load evaluation criteria from file"""
        try:
            with open('data/evaluation_criteria.json', 'r') as f:
                self.criteria = json.load(f)
        except FileNotFoundError:
            self.criteria = self.get_default_criteria()
    
    def get_default_criteria(self):
        return {
            "technical": {
                "weight": 0.4,
                "factors": {
                    "keyword_coverage": 0.3,
                    "conceptual_accuracy": 0.4,
                    "example_quality": 0.3
                }
            },
            "communication": {
                "weight": 0.3,
                "factors": {
                    "clarity": 0.25,
                    "structure": 0.25,
                    "conciseness": 0.25,
                    "professional_tone": 0.25
                }
            },
            "behavioral": {
                "weight": 0.3,
                "factors": {
                    "confidence": 0.3,
                    "enthusiasm": 0.2,
                    "professionalism": 0.3,
                    "story_structure": 0.2
                }
            }
        }
    
    def analyze_response(self, question, user_answer, domain, response_time):
        """Comprehensive analysis of user response"""
        analysis = {
            'scores': {},
            'detailed_feedback': {},
            'improvement_suggestions': [],
            'strengths': [],
            'sentiment_analysis': {},
            'complexity_metrics': {}
        }
        
        # Technical analysis
        analysis['scores']['technical'] = self.analyze_technical(question, user_answer, domain)
        analysis['detailed_feedback']['technical'] = self.get_technical_feedback(question, user_answer)
        
        # Communication analysis
        analysis['scores']['communication'] = self.analyze_communication(user_answer)
        analysis['detailed_feedback']['communication'] = self.get_communication_feedback(user_answer)
        
        # Behavioral analysis
        analysis['scores']['behavioral'] = self.analyze_behavioral(user_answer, response_time)
        analysis['detailed_feedback']['behavioral'] = self.get_behavioral_feedback(user_answer)
        
        # Advanced analytics
        analysis['sentiment_analysis'] = self.analyze_sentiment(user_answer)
        analysis['complexity_metrics'] = self.analyze_complexity(user_answer)
        
        # Generate suggestions and strengths
        analysis['improvement_suggestions'] = self.generate_suggestions(analysis)
        analysis['strengths'] = self.identify_strengths(analysis)
        
        return analysis
    
    def analyze_technical(self, question, answer, domain):
        """Analyze technical aspects of the response"""
        score = 0
        expected_keywords = question.get('keywords', [])
        answer_lower = answer.lower()
        
        # Keyword coverage
        found_keywords = [kw for kw in expected_keywords if kw.lower() in answer_lower]
        keyword_score = min(10, len(found_keywords) * 2)  # Max 10 points
        
        # Conceptual accuracy (basic checks)
        conceptual_score = 6  # Base score
        if len(answer.split()) > 50:  # Substantive answer
            conceptual_score += 2
        if any(indicator in answer_lower for indicator in ['for example', 'for instance', 'such as']):
            conceptual_score += 1
        if 'i don\'t know' not in answer_lower and 'not sure' not in answer_lower:
            conceptual_score += 1
        
        # Combine scores
        technical_score = (keyword_score * 0.4 + conceptual_score * 0.6)
        return min(10, technical_score)
    
    def analyze_communication(self, answer):
        """Analyze communication skills"""
        score = 0
        
        # Length analysis
        word_count = len(answer.split())
        if 50 <= word_count <= 200:
            score += 3
        elif word_count > 200:
            score += 2
        else:
            score += 1
        
        # Structure analysis
        sentences = sent_tokenize(answer)
        if len(sentences) >= 3:
            score += 3  # Good structure
        elif len(sentences) >= 2:
            score += 2
        else:
            score += 1
        
        # Professional tone
        blob = TextBlob(answer)
        polarity = blob.sentiment.polarity
        if -0.1 <= polarity <= 0.5:  # Neutral to positive
            score += 2
        else:
            score += 1
        
        # Conciseness
        avg_sentence_length = word_count / len(sentences) if sentences else 0
        if 10 <= avg_sentence_length <= 25:
            score += 2
        
        return min(10, score)
    
    def analyze_behavioral(self, answer, response_time):
        """Analyze behavioral aspects"""
        score = 0
        
        # Confidence indicators
        confidence_indicators = ['i am confident', 'i believe', 'my experience', 'i successfully']
        if any(indicator in answer.lower() for indicator in confidence_indicators):
            score += 3
        
        # Story structure (STAR method indicators)
        star_indicators = ['situation', 'task', 'action', 'result', 'challenge', 'solution']
        star_count = sum(1 for indicator in star_indicators if indicator in answer.lower())
        score += min(3, star_count)
        
        # Response time consideration
        if response_time < 300:  # Under 5 minutes
            score += 2
        elif response_time < 600:  # Under 10 minutes
            score += 1
        
        # Professionalism (avoid negative phrases)
        negative_phrases = ["i can't", "i don't know", "not sure", "maybe", "perhaps"]
        if not any(phrase in answer.lower() for phrase in negative_phrases):
            score += 2
        
        return min(10, score)
    
    def analyze_sentiment(self, text):
        """Perform sentiment analysis"""
        blob = TextBlob(text)
        sia_scores = self.sia.polarity_scores(text)
        
        return {
            'polarity': blob.sentiment.polarity,
            'subjectivity': blob.sentiment.subjectivity,
            'compound': sia_scores['compound'],
            'positive': sia_scores['pos'],
            'negative': sia_scores['neg'],
            'neutral': sia_scores['neu']
        }
    
    def analyze_complexity(self, text):
        """Analyze text complexity"""
        sentences = sent_tokenize(text)
        words = text.split()
        
        if not sentences:
            return {'sentence_count': 0, 'avg_sentence_length': 0, 'lexical_diversity': 0}
        
        avg_sentence_length = len(words) / len(sentences)
        lexical_diversity = len(set(words)) / len(words) if words else 0
        
        return {
            'sentence_count': len(sentences),
            'avg_sentence_length': round(avg_sentence_length, 2),
            'lexical_diversity': round(lexical_diversity, 2),
            'word_count': len(words)
        }
    
    def get_technical_feedback(self, question, answer):
        feedback = []
        expected_keywords = question.get('keywords', [])
        found_keywords = [kw for kw in expected_keywords if kw.lower() in answer.lower()]
        
        if found_keywords:
            feedback.append(f"Good use of technical terms: {', '.join(found_keywords)}")
        else:
            feedback.append("Include more domain-specific technical terms in your answer.")
        
        if len(answer.split()) < 50:
            feedback.append("Consider providing more detailed technical explanations.")
        
        return feedback
    
    def get_communication_feedback(self, answer):
        feedback = []
        word_count = len(answer.split())
        
        if word_count < 50:
            feedback.append("Your answer is quite brief. Aim for 50-200 words for comprehensive responses.")
        elif word_count > 300:
            feedback.append("Your answer is very detailed. Consider being more concise while maintaining key points.")
        
        sentences = sent_tokenize(answer)
        if len(sentences) < 3:
            feedback.append("Structure your answer with clear introduction, body, and conclusion.")
        
        return feedback
    
    def get_behavioral_feedback(self, answer):
        feedback = []
        
        if 'situation' not in answer.lower() and 'challenge' not in answer.lower():
            feedback.append("For behavioral questions, use the STAR method: Situation, Task, Action, Result.")
        
        if 'i am confident' not in answer.lower():
            feedback.append("Express more confidence in your abilities and experiences.")
        
        return feedback
    
    def generate_suggestions(self, analysis):
        """Generate improvement suggestions based on analysis"""
        suggestions = []
        scores = analysis['scores']
        
        if scores['technical'] < 7:
            suggestions.append("Practice explaining technical concepts using simple analogies.")
        
        if scores['communication'] < 7:
            suggestions.append("Work on structuring your responses with clear topic sentences.")
        
        if scores['behavioral'] < 7:
            suggestions.append("Prepare 3-5 STAR method stories about your professional experiences.")
        
        complexity = analysis['complexity_metrics']
        if complexity.get('avg_sentence_length', 0) > 25:
            suggestions.append("Break long sentences into shorter, more digestible ones.")
        
        return suggestions
    
    def identify_strengths(self, analysis):
        """Identify strengths in the response"""
        strengths = []
        scores = analysis['scores']
        
        if scores['technical'] >= 8:
            strengths.append("Strong technical knowledge and terminology usage.")
        
        if scores['communication'] >= 8:
            strengths.append("Excellent communication skills and response structure.")
        
        if scores['behavioral'] >= 8:
            strengths.append("Effective use of behavioral examples and professional tone.")
        
        sentiment = analysis['sentiment_analysis']
        if sentiment.get('compound', 0) > 0.5:
            strengths.append("Positive and enthusiastic tone throughout responses.")
        
        return strengths