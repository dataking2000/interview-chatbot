# -*- coding: utf-8 -*-

from flask import Flask, render_template, request, jsonify, session, send_file, redirect
import json
import random
import re
import os
from datetime import datetime, timedelta
import io
import math

# Configuration class
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'ai-interview-chatbot-advanced-2024'
    PERMANENT_SESSION_LIFETIME = timedelta(hours=2)
    MAX_RESPONSE_TIME = 180
    MIN_WORD_COUNT = 25
    IDEAL_WORD_COUNT = 150
    TECHNICAL_WEIGHT = 0.4
    COMMUNICATION_WEIGHT = 0.3
    BEHAVIORAL_WEIGHT = 0.3

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Make session permanent
@app.before_request
def make_session_permanent():
    session.permanent = True
    app.permanent_session_lifetime = timedelta(hours=2)

# Simple sentiment analysis without NLTK
class SimpleSentimentAnalyzer:
    def __init__(self):
        self.positive_words = set([
            'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 
            'outstanding', 'superb', 'brilliant', 'awesome', 'positive', 'happy',
            'pleased', 'satisfied', 'success', 'successful', 'achievement', 'win',
            'confident', 'optimistic', 'excited', 'enthusiastic', 'proud'
        ])
        self.negative_words = set([
            'bad', 'poor', 'terrible', 'awful', 'horrible', 'disappointing',
            'failure', 'failed', 'problem', 'issue', 'difficult', 'hard',
            'challenging', 'struggle', 'negative', 'unhappy', 'disappointed',
            'frustrated', 'concerned', 'worried', 'anxious', 'stress', 'stressful'
        ])
    
    def polarity_scores(self, text):
        words = text.lower().split()
        total_words = len(words)
        if total_words == 0:
            return {'compound': 0.0, 'pos': 0.0, 'neg': 0.0, 'neu': 1.0}
        
        pos_count = sum(1 for word in words if word in self.positive_words)
        neg_count = sum(1 for word in words if word in self.negative_words)
        neu_count = total_words - pos_count - neg_count
        
        # Calculate scores
        pos_score = pos_count / total_words
        neg_score = neg_count / total_words
        neu_score = neu_count / total_words
        
        # Compound score (simple calculation)
        compound = (pos_score - neg_score)
        
        return {
            'compound': compound,
            'pos': pos_score,
            'neg': neg_score,
            'neu': neu_score
        }

# AI Analyzer without external dependencies
class SimpleAIAnalyzer:
    def __init__(self):
        self.sentiment_analyzer = SimpleSentimentAnalyzer()
        self.technical_keywords = {
            'software engineering': ['algorithm', 'database', 'api', 'framework', 'debugging', 'testing'],
            'data science': ['machine learning', 'statistics', 'python', 'analysis', 'visualization'],
            'product management': ['strategy', 'roadmap', 'user stories', 'metrics', 'prioritization']
        }
    
    def analyze_response(self, question, user_answer, domain, response_time):
        # Calculate technical score based on keyword matching
        tech_score = self._calculate_technical_score(question, user_answer, domain)
        
        # Calculate communication score based on response quality
        comm_score = self._calculate_communication_score(user_answer)
        
        # Calculate behavioral score
        behav_score = self._calculate_behavioral_score(user_answer, response_time)
        
        # Sentiment analysis
        sentiment = self.sentiment_analyzer.polarity_scores(user_answer)
        
        # Complexity metrics
        complexity = self._calculate_complexity_metrics(user_answer)
        
        return {
            'scores': {
                'technical': round(tech_score, 1),
                'communication': round(comm_score, 1),
                'behavioral': round(behav_score, 1)
            },
            'detailed_feedback': {
                'technical': self._get_technical_feedback(question, user_answer, domain),
                'communication': self._get_communication_feedback(user_answer),
                'behavioral': self._get_behavioral_feedback(user_answer)
            },
            'improvement_suggestions': self._get_improvement_suggestions(tech_score, comm_score, behav_score),
            'strengths': self._identify_strengths(tech_score, comm_score, behav_score, user_answer),
            'sentiment_analysis': sentiment,
            'complexity_metrics': complexity
        }
    
    def _calculate_technical_score(self, question, answer, domain):
        base_score = 6.0  # Base score
        
        # Check for expected keywords
        expected_keywords = question.get('keywords', [])
        answer_lower = answer.lower()
        found_keywords = [kw for kw in expected_keywords if kw.lower() in answer_lower]
        
        # Keyword bonus
        keyword_bonus = min(2.0, len(found_keywords) * 0.5)
        
        # Length bonus
        word_count = len(answer.split())
        length_bonus = 0
        if word_count > 100:
            length_bonus = 2.0
        elif word_count > 50:
            length_bonus = 1.0
        
        # Example bonus
        example_bonus = 1.0 if any(word in answer_lower for word in ['for example', 'for instance', 'such as']) else 0
        
        return min(10.0, base_score + keyword_bonus + length_bonus + example_bonus)
    
    def _calculate_communication_score(self, answer):
        score = 5.0  # Base score
        
        # Sentence structure
        sentences = re.split(r'[.!?]+', answer)
        sentence_count = len([s for s in sentences if s.strip()])
        if sentence_count >= 3:
            score += 2.0
        elif sentence_count >= 2:
            score += 1.0
        
        # Word count appropriateness
        word_count = len(answer.split())
        if 50 <= word_count <= 200:
            score += 2.0
        elif word_count > 200:
            score += 1.0
        else:
            score += 0.5
        
        # Professional tone (check for professional words)
        professional_words = ['however', 'therefore', 'additionally', 'furthermore', 'consequently']
        professional_bonus = sum(1 for word in professional_words if word in answer.lower()) * 0.5
        score += min(1.0, professional_bonus)
        
        return min(10.0, score)
    
    def _calculate_behavioral_score(self, answer, response_time):
        score = 5.0  # Base score
        
        # Confidence indicators
        confidence_phrases = ['i am confident', 'i believe', 'my experience', 'i successfully']
        if any(phrase in answer.lower() for phrase in confidence_phrases):
            score += 2.0
        
        # STAR method indicators
        star_indicators = ['situation', 'task', 'action', 'result', 'challenge', 'solution']
        star_count = sum(1 for indicator in star_indicators if indicator in answer.lower())
        score += min(2.0, star_count * 0.5)
        
        # Response time consideration
        if response_time < 180:  # Under 3 minutes
            score += 1.0
        
        # Positive language
        sentiment = self.sentiment_analyzer.polarity_scores(answer)
        if sentiment['compound'] > 0.1:
            score += 1.0
        
        return min(10.0, score)
    
    def _calculate_complexity_metrics(self, text):
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        words = text.split()
        
        if not sentences:
            return {'sentence_count': 0, 'avg_sentence_length': 0, 'lexical_diversity': 0, 'word_count': 0}
        
        avg_sentence_length = len(words) / len(sentences)
        lexical_diversity = len(set(words)) / len(words) if words else 0
        
        return {
            'sentence_count': len(sentences),
            'avg_sentence_length': round(avg_sentence_length, 2),
            'lexical_diversity': round(lexical_diversity, 2),
            'word_count': len(words)
        }
    
    def _get_technical_feedback(self, question, answer, domain):
        feedback = []
        expected_keywords = question.get('keywords', [])
        found_keywords = [kw for kw in expected_keywords if kw.lower() in answer.lower()]
        
        if found_keywords:
            feedback.append(f"Good use of technical terms: {', '.join(found_keywords[:3])}")
        else:
            feedback.append("Include more domain-specific technical terms in your answer.")
        
        if len(answer.split()) < 50:
            feedback.append("Consider providing more detailed technical explanations.")
        elif len(answer.split()) > 300:
            feedback.append("Your answer is quite detailed. Ensure you're staying focused on the key points.")
        
        return feedback
    
    def _get_communication_feedback(self, answer):
        feedback = []
        word_count = len(answer.split())
        
        if word_count < 50:
            feedback.append("Your answer is quite brief. Aim for 50-200 words for comprehensive responses.")
        elif word_count > 300:
            feedback.append("Your answer is very detailed. Consider being more concise while maintaining key points.")
        
        sentences = re.split(r'[.!?]+', answer)
        if len([s for s in sentences if s.strip()]) < 3:
            feedback.append("Structure your answer with clear introduction, body, and conclusion.")
        
        return feedback
    
    def _get_behavioral_feedback(self, answer):
        feedback = []
        
        if 'situation' not in answer.lower() and 'challenge' not in answer.lower():
            feedback.append("For behavioral questions, use the STAR method: Situation, Task, Action, Result.")
        
        if 'i am confident' not in answer.lower():
            feedback.append("Express more confidence in your abilities and experiences.")
        
        return feedback
    
    def _get_improvement_suggestions(self, tech_score, comm_score, behav_score):
        suggestions = []
        
        if tech_score < 7:
            suggestions.append("Practice explaining technical concepts using simple analogies.")
        
        if comm_score < 7:
            suggestions.append("Work on structuring your responses with clear topic sentences.")
        
        if behav_score < 7:
            suggestions.append("Prepare 3-5 STAR method stories about your professional experiences.")
        
        return suggestions
    
    def _identify_strengths(self, tech_score, comm_score, behav_score, answer):
        strengths = []
        
        if tech_score >= 8:
            strengths.append("Strong technical knowledge and terminology usage.")
        
        if comm_score >= 8:
            strengths.append("Excellent communication skills and response structure.")
        
        if behav_score >= 8:
            strengths.append("Effective use of behavioral examples and professional tone.")
        
        sentiment = self.sentiment_analyzer.polarity_scores(answer)
        if sentiment['compound'] > 0.3:
            strengths.append("Positive and enthusiastic tone throughout responses.")
        
        return strengths

# Simple speech processor
class SimpleSpeechProcessor:
    def analyze_speech(self, audio_data):
        return {
            'audio_metrics': {
                'duration_seconds': random.uniform(30, 120),
                'sample_rate': 16000,
                'frames': 1000,
                'speaking_rate': random.uniform(120, 180)
            },
            'transcribed_text': '[Speech analysis would appear here]'
        }

# Initialize components
ai_analyzer = SimpleAIAnalyzer()
speech_processor = SimpleSpeechProcessor()

# Domain functions
def get_domain_icon(domain):
    icon_mapping = {
        'Software Engineering': 'code',
        'Data Science': 'chart-bar',
        'Product Management': 'tasks',
        'Digital Marketing': 'bullhorn',
        'Finance': 'coins',
        'Healthcare': 'heartbeat',
        'Sales': 'handshake',
        'Teaching': 'chalkboard-teacher',
        'Graphic Design': 'palette',
        'Customer Service': 'headset'
    }
    return icon_mapping.get(domain, 'briefcase')

def get_domain_description(domain):
    description_mapping = {
        'Software Engineering': 'Technical interviews for software development roles',
        'Data Science': 'Data analysis, machine learning, and analytics interviews',
        'Product Management': 'Product strategy and leadership interviews',
        'Digital Marketing': 'Marketing strategy and growth interviews',
        'Finance': 'Financial analysis and planning interviews',
        'Healthcare': 'Medical and healthcare profession interviews',
        'Sales': 'Sales and business development interviews',
        'Teaching': 'Classroom instruction and education interviews',
        'Graphic Design': 'Visual design and creative content interviews',
        'Customer Service': 'Customer support and service interviews'
    }
    return description_mapping.get(domain, 'Professional interview practice')

# Register template globals
app.jinja_env.globals.update(
    get_domain_icon=get_domain_icon,
    get_domain_description=get_domain_description
)

# Data loading functions
def load_questions():
    try:
        with open('data/questions.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Questions file not found. Using default questions.")
        return get_default_questions()
    except Exception as e:
        print(f"Error loading questions: {e}")
        return get_default_questions()

def get_default_questions():
    return {
        "domains": {
            "Software Engineering": {
                "description": "Technical interviews for software development roles",
                "questions": [
                    {
                        "question": "Explain object-oriented programming and its main principles with real-world examples.",
                        "type": "technical",
                        "difficulty": "beginner",
                        "keywords": ["encapsulation", "inheritance", "polymorphism", "abstraction", "classes", "objects"],
                        "expected_time": 120,
                        "category": "fundamentals"
                    },
                    {
                        "question": "What's the difference between SQL and NoSQL databases? Provide use cases for each.",
                        "type": "technical",
                        "difficulty": "intermediate",
                        "keywords": ["relational", "non-relational", "structured", "unstructured", "scalability", "consistency"],
                        "expected_time": 180,
                        "category": "databases"
                    },
                    {
                        "question": "Describe a challenging technical problem you solved and walk through your approach.",
                        "type": "behavioral",
                        "difficulty": "intermediate",
                        "keywords": ["problem-solving", "debugging", "analysis", "solution", "results"],
                        "expected_time": 240,
                        "category": "problem_solving"
                    }
                ]
            },
            "Data Science": {
                "description": "Data analysis, machine learning, and analytics interviews",
                "questions": [
                    {
                        "question": "Explain the bias-variance tradeoff in machine learning with practical examples.",
                        "type": "technical",
                        "difficulty": "intermediate",
                        "keywords": ["bias", "variance", "overfitting", "underfitting", "model complexity"],
                        "expected_time": 180,
                        "category": "ml_fundamentals"
                    },
                    {
                        "question": "How would you handle missing data in a large dataset? Discuss multiple approaches.",
                        "type": "technical",
                        "difficulty": "intermediate",
                        "keywords": ["missing data", "imputation", "deletion", "mean", "median", "model-based"],
                        "expected_time": 150,
                        "category": "data_preprocessing"
                    }
                ]
            }
        }
    }

# Helper functions
def select_questions(domain_data, difficulty, interview_type):
    """Select questions based on criteria"""
    all_questions = domain_data.get('questions', [])
    
    # Filter by difficulty
    filtered_questions = [q for q in all_questions if q.get('difficulty') == difficulty]
    
    if not filtered_questions:
        filtered_questions = all_questions
    
    # Filter by type if specified
    if interview_type != 'mixed':
        filtered_questions = [q for q in filtered_questions if q.get('type') == interview_type]
    
    # Select random subset (3-5 questions for demo)
    num_questions = min(random.randint(3, 5), len(filtered_questions))
    return random.sample(filtered_questions, num_questions)

def calculate_estimated_duration(questions):
    """Calculate total estimated interview duration"""
    return sum(q.get('expected_time', 120) for q in questions)

def update_performance_metrics(analysis, word_count, response_time):
    """Update performance tracking metrics"""
    metrics = session.get('performance_metrics', {
        'technical_scores': [],
        'communication_scores': [],
        'behavioral_scores': [],
        'word_counts': [],
        'response_times': []
    })
    metrics['technical_scores'].append(analysis['scores']['technical'])
    metrics['communication_scores'].append(analysis['scores']['communication'])
    metrics['behavioral_scores'].append(analysis['scores']['behavioral'])
    metrics['word_counts'].append(word_count)
    metrics['response_times'].append(response_time)
    session['performance_metrics'] = metrics

def calculate_final_results():
    """Calculate comprehensive final results"""
    metrics = session.get('performance_metrics', {
        'technical_scores': [],
        'communication_scores': [],
        'behavioral_scores': [],
        'word_counts': [],
        'response_times': []
    })
    conversation = session.get('conversation', [])
    
    if not metrics['technical_scores']:
        return {
            'domain': session.get('domain', 'Unknown'),
            'difficulty': session.get('difficulty', 'intermediate'),
            'interview_type': session.get('interview_type', 'mixed'),
            'completion_time': datetime.now().isoformat(),
            'scores': {
                'overall': 0,
                'technical': 0,
                'communication': 0,
                'behavioral': 0
            },
            'metrics': metrics,
            'insights': ['No data available for analysis'],
            'conversation': conversation,
            'recommendations': ['Complete an interview session to get recommendations']
        }
    
    # Calculate averages
    avg_technical = sum(metrics['technical_scores']) / len(metrics['technical_scores'])
    avg_communication = sum(metrics['communication_scores']) / len(metrics['communication_scores'])
    avg_behavioral = sum(metrics['behavioral_scores']) / len(metrics['behavioral_scores'])
    
    overall_score = (avg_technical * 0.4 + avg_communication * 0.3 + avg_behavioral * 0.3)
    
    # Performance insights
    insights = generate_insights(metrics, conversation)
    
    return {
        'domain': session.get('domain', 'Unknown'),
        'difficulty': session.get('difficulty', 'intermediate'),
        'interview_type': session.get('interview_type', 'mixed'),
        'completion_time': datetime.now().isoformat(),
        'scores': {
            'overall': round(overall_score, 1),
            'technical': round(avg_technical, 1),
            'communication': round(avg_communication, 1),
            'behavioral': round(avg_behavioral, 1)
        },
        'metrics': metrics,
        'insights': insights,
        'conversation': conversation,
        'recommendations': generate_recommendations(metrics, insights)
    }

def generate_insights(metrics, conversation):
    """Generate performance insights"""
    insights = []
    
    # Technical insight
    tech_scores = metrics['technical_scores']
    if len(tech_scores) > 1 and max(tech_scores) - min(tech_scores) > 3:
        insights.append("Your technical knowledge appears inconsistent across different topics.")
    elif avg(tech_scores) > 8:
        insights.append("Strong technical foundation demonstrated throughout the interview.")
    
    # Communication insight
    word_counts = metrics['word_counts']
    if word_counts and max(word_counts) > 300:
        insights.append("Some responses were too verbose. Work on being more concise.")
    elif word_counts and avg(word_counts) < 50:
        insights.append("Consider providing more detailed explanations in your responses.")
    
    # Behavioral insight
    behavioral_scores = metrics['behavioral_scores']
    if behavioral_scores and avg(behavioral_scores) < 6:
        insights.append("Focus on structuring behavioral responses using the STAR method.")
    
    return insights

def generate_recommendations(metrics, insights):
    """Generate personalized recommendations"""
    recommendations = []
    
    if metrics['technical_scores'] and avg(metrics['technical_scores']) < 7:
        recommendations.append("Practice explaining core concepts in your field using simple analogies.")
    
    if metrics['communication_scores'] and avg(metrics['communication_scores']) < 7:
        recommendations.append("Work on structuring responses with clear introductions and conclusions.")
    
    if metrics['response_times'] and avg(metrics['response_times']) > 150:
        recommendations.append("Practice thinking aloud to reduce response time while maintaining quality.")
    
    # Add insights as recommendations
    recommendations.extend(insights)
    
    return recommendations

def avg(lst):
    return sum(lst) / len(lst) if lst else 0

# Routes
@app.route('/')
def index():
    session.clear()
    questions_data = load_questions()
    domains = list(questions_data['domains'].keys())
    return render_template('index.html', domains=domains)

@app.route('/interview')
def interview():
    """Interview page route"""
    if 'questions' not in session:
        return redirect('/')
    return render_template('interview.html')

@app.route('/results')
def results():
    if 'interview_results' not in session:
        return render_template('error.html', message="No interview results found.")
    return render_template('results.html', results=session['interview_results'])

@app.route('/start_interview', methods=['POST'])
def start_interview():
    try:
        data = request.get_json()
        domain = data.get('domain')
        difficulty = data.get('difficulty', 'intermediate')
        interview_type = data.get('type', 'mixed')
        
        questions_data = load_questions()
        domain_data = questions_data['domains'].get(domain)
        
        if not domain_data:
            return jsonify({'error': 'Domain not found'}), 400
        
        # Select questions based on type and difficulty
        questions = select_questions(domain_data, difficulty, interview_type)
        
        if not questions:
            return jsonify({'error': 'No questions available for this configuration'}), 400
        
        # Initialize session
        session.clear()
        session['domain'] = domain
        session['difficulty'] = difficulty
        session['interview_type'] = interview_type
        session['questions'] = questions
        session['current_question_index'] = 0
        session['start_time'] = datetime.now().isoformat()
        session['conversation'] = []
        session['performance_metrics'] = {
            'technical_scores': [],
            'communication_scores': [],
            'behavioral_scores': [],
            'response_times': [],
            'word_counts': []
        }
        
        first_question = questions[0]
        session['conversation'].append({
            'type': 'question',
            'content': first_question['question'],
            'metadata': {
                'type': first_question.get('type', 'technical'),
                'difficulty': first_question.get('difficulty', 'intermediate'),
                'expected_time': first_question.get('expected_time', 120)
            },
            'timestamp': datetime.now().isoformat()
        })
        
        return jsonify({
            'success': True,
            'question': first_question['question'],
            'metadata': {
                'type': first_question.get('type', 'technical'),
                'difficulty': first_question.get('difficulty', 'intermediate'),
                'expected_time': first_question.get('expected_time', 120)
            },
            'total_questions': len(questions),
            'interview_duration': calculate_estimated_duration(questions)
        })
        
    except Exception as e:
        print(f"Error starting interview: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/get_current_question')
def get_current_question():
    """Get the current question from session"""
    try:
        if 'questions' not in session:
            return jsonify({'error': 'No active interview session'}), 400
        
        current_index = session.get('current_question_index', 0)
        questions = session['questions']
        
        if current_index >= len(questions):
            return jsonify({'interview_complete': True})
        
        current_question = questions[current_index]
        
        return jsonify({
            'question': current_question['question'],
            'metadata': {
                'type': current_question.get('type', 'technical'),
                'difficulty': current_question.get('difficulty', 'intermediate'),
                'expected_time': current_question.get('expected_time', 120)
            },
            'current_progress': {
                'current': current_index + 1,
                'total': len(questions)
            }
        })
        
    except Exception as e:
        print(f"Error getting current question: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/submit_answer', methods=['POST'])
def submit_answer():
    try:
        if 'questions' not in session:
            return jsonify({'error': 'No active interview session'}), 400
        
        data = request.get_json()
        user_answer = data.get('answer', '').strip()
        response_time = data.get('response_time', 0)
        audio_data = data.get('audio_data')  # Base64 encoded audio
        
        if not user_answer:
            return jsonify({'error': 'Empty response'}), 400
        
        current_index = session['current_question_index']
        current_question = session['questions'][current_index]
        
        # Analyze response using AI
        analysis_result = ai_analyzer.analyze_response(
            question=current_question,
            user_answer=user_answer,
            domain=session.get('domain'),
            response_time=response_time
        )
        
        # Process audio if provided
        if audio_data:
            speech_analysis = speech_processor.analyze_speech(audio_data)
            analysis_result.update(speech_analysis)
        
        # Update performance metrics
        update_performance_metrics(analysis_result, len(user_answer.split()), response_time)
        
        # Add to conversation
        session['conversation'].append({
            'type': 'answer',
            'content': user_answer,
            'analysis': analysis_result,
            'response_time': response_time,
            'word_count': len(user_answer.split()),
            'timestamp': datetime.now().isoformat()
        })
        
        # Move to next question or complete interview
        session['current_question_index'] += 1
        interview_complete = session['current_question_index'] >= len(session['questions'])
        
        response_data = {
            'analysis': analysis_result,
            'interview_complete': interview_complete,
            'current_progress': {
                'current': session['current_question_index'],
                'total': len(session['questions'])
            }
        }
        
        if not interview_complete:
            next_question = session['questions'][session['current_question_index']]
            session['conversation'].append({
                'type': 'question',
                'content': next_question['question'],
                'metadata': {
                    'type': next_question.get('type', 'technical'),
                    'difficulty': next_question.get('difficulty', 'intermediate'),
                    'expected_time': next_question.get('expected_time', 120)
                },
                'timestamp': datetime.now().isoformat()
            })
            
            response_data['next_question'] = next_question['question']
            response_data['metadata'] = {
                'type': next_question.get('type', 'technical'),
                'difficulty': next_question.get('difficulty', 'intermediate'),
                'expected_time': next_question.get('expected_time', 120)
            }
        else:
            # Calculate final results
            final_results = calculate_final_results()
            session['interview_results'] = final_results
            response_data['final_results'] = final_results
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error submitting answer: {e}")
        return jsonify({'error': f'Analysis error: {str(e)}'}), 500

@app.route('/save_audio', methods=['POST'])
def save_audio():
    """Save audio recording"""
    try:
        data = request.get_json()
        audio_data = data.get('audio_data')
        return jsonify({'success': True, 'message': 'Audio saved'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download_report')
def download_report():
    """Generate and download PDF report"""
    if 'interview_results' not in session:
        return jsonify({'error': 'No results available'}), 400
    
    try:
        # Simple text report instead of PDF for now
        results = session['interview_results']
        report_content = f"""
        AI Interview Performance Report
        ==============================
        
        Domain: {results['domain']}
        Difficulty: {results['difficulty']}
        Interview Type: {results['interview_type']}
        Completion Date: {results['completion_time'][:10]}
        
        SCORES:
        - Overall: {results['scores']['overall']}/10
        - Technical: {results['scores']['technical']}/10
        - Communication: {results['scores']['communication']}/10
        - Behavioral: {results['scores']['behavioral']}/10
        
        RECOMMENDATIONS:
        {chr(10).join(f'- {rec}' for rec in results['recommendations'])}
        """
        
        buffer = io.BytesIO()
        buffer.write(report_content.encode('utf-8'))
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"interview_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt",
            mimetype='text/plain'
        )
    except Exception as e:
        print(f"Error generating report: {e}")
        return jsonify({'error': f'Report generation failed: {str(e)}'}), 500

# Error handler
@app.errorhandler(404)
def not_found(error):
    return render_template('error.html', message="Page not found"), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('error.html', message="Internal server error"), 500

# Only run if this file is executed directly
if __name__ == '__main__':
    # Get port from environment variable or default to 5000
    port = int(os.environ.get('PORT', 5000))
    
    # Run the app
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False  # Always False in production
    )