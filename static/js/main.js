// Advanced AI Interview Chatbot - Main Application Logic
class InterviewApp {
    constructor() {
        this.currentQuestion = null;
        this.questions = [];
        this.currentIndex = 0;
        this.timer = null;
        this.timeLeft = 0;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        
        this.initializeApp();
    }

    initializeApp() {
        this.bindEvents();
        this.initializeCharts();
        this.checkBrowserCompatibility();
    }

    bindEvents() {
        // Domain selection
        document.querySelectorAll('.domain-card').forEach(card => {
            card.addEventListener('click', () => this.selectDomain(card));
        });

        // Form submission
        const interviewForm = document.getElementById('interviewConfig');
        if (interviewForm) {
            interviewForm.addEventListener('submit', (e) => this.startInterview(e));
        }

        // Answer submission
        const answerForm = document.getElementById('answerForm');
        if (answerForm) {
            answerForm.addEventListener('submit', (e) => this.submitAnswer(e));
        }

        // Skip question
        const skipBtn = document.getElementById('skipBtn');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.skipQuestion());
        }

        // Speech recording
        const recordBtn = document.getElementById('recordBtn');
        if (recordBtn) {
            recordBtn.addEventListener('click', () => this.toggleRecording());
        }

        // Word count tracking
        const userAnswer = document.getElementById('userAnswer');
        if (userAnswer) {
            userAnswer.addEventListener('input', () => this.updateWordCount());
        }

        // Download report
        const downloadBtn = document.getElementById('downloadReport');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadReport());
        }

        // Modal close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
    }

    selectDomain(card) {
        // Deselect all domains
        document.querySelectorAll('.domain-card').forEach(c => {
            c.classList.remove('selected');
        });

        // Select clicked domain
        card.classList.add('selected');

        // Update form data
        const domainInput = document.createElement('input');
        domainInput.type = 'hidden';
        domainInput.name = 'domain';
        domainInput.value = card.dataset.domain;
        
        const existingInput = document.querySelector('input[name="domain"]');
        if (existingInput) {
            existingInput.remove();
        }
        
        document.getElementById('interviewConfig').appendChild(domainInput);
    }

    async startInterview(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const domain = formData.get('domain');
        const difficulty = formData.get('difficulty');
        const interviewType = formData.get('type');
        const enableSpeech = document.getElementById('enableSpeech').checked;
        const enableTimer = document.getElementById('enableTimer').checked;
        const enableAnalytics = document.getElementById('enableAnalytics').checked;

        if (!domain) {
            this.showNotification('Please select a career domain', 'error');
            return;
        }

        // Show loading modal
        this.showLoadingModal();

        try {
            const response = await fetch('/start_interview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    domain: domain,
                    difficulty: difficulty,
                    type: interviewType,
                    features: {
                        speech: enableSpeech,
                        timer: enableTimer,
                        analytics: enableAnalytics
                    }
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Store interview configuration
            this.interviewConfig = {
                domain: domain,
                difficulty: difficulty,
                type: interviewType,
                features: {
                    speech: enableSpeech,
                    timer: enableTimer,
                    analytics: enableAnalytics
                }
            };

            // Redirect to interview page
            setTimeout(() => {
                window.location.href = '/interview';
            }, 1500);

        } catch (error) {
            this.hideLoadingModal();
            this.showNotification('Failed to start interview: ' + error.message, 'error');
            console.error('Interview start error:', error);
        }
    }

    async submitAnswer(e) {
        e.preventDefault();
        
        const answerText = document.getElementById('userAnswer').value.trim();
        if (!answerText) {
            this.showNotification('Please enter your answer before submitting', 'warning');
            return;
        }

        // Stop timer if running
        if (this.timer) {
            clearInterval(this.timer);
        }

        // Disable form
        this.disableAnswerForm();

        try {
            const response = await fetch('/submit_answer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    answer: answerText,
                    response_time: 180 - this.timeLeft, // Calculate actual response time
                    audio_data: this.audioChunks.length > 0 ? await this.getAudioBlob() : null
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Display feedback
            this.displayFeedback(data.analysis);

            if (data.interview_complete) {
                // Show final results after delay
                setTimeout(() => {
                    this.showFinalResults(data.final_results);
                }, 2000);
            } else {
                // Show next question after delay
                setTimeout(() => {
                    this.showNextQuestion(data.next_question, data.metadata);
                    this.updateProgress(data.current_progress);
                }, 2000);
            }

        } catch (error) {
            this.showNotification('Failed to submit answer: ' + error.message, 'error');
            this.enableAnswerForm();
            console.error('Answer submission error:', error);
        }
    }

    skipQuestion() {
        if (confirm('Are you sure you want to skip this question? This will affect your overall score.')) {
            this.submitAnswer({ preventDefault: () => {} });
        }
    }

    displayFeedback(analysis) {
        // Update scores
        document.getElementById('technicalScore').textContent = analysis.scores.technical;
        document.getElementById('communicationScore').textContent = analysis.scores.communication;
        document.getElementById('behavioralScore').textContent = analysis.scores.behavioral;

        // Update feedback lists
        this.updateFeedbackList('technicalFeedback', analysis.detailed_feedback.technical);
        this.updateFeedbackList('communicationFeedback', analysis.detailed_feedback.communication);
        this.updateFeedbackList('improvementSuggestions', analysis.improvement_suggestions);

        // Add feedback to conversation
        this.addMessageToConversation('feedback', 
            `Technical: ${analysis.scores.technical}/10, Communication: ${analysis.scores.communication}/10, Behavioral: ${analysis.scores.behavioral}/10`
        );

        // Show strengths if any
        if (analysis.strengths && analysis.strengths.length > 0) {
            this.addMessageToConversation('feedback', 
                `Strengths: ${analysis.strengths.join(', ')}`
            );
        }

        // Update charts if analytics are enabled
        if (this.interviewConfig.features.analytics) {
            this.updatePerformanceCharts(analysis);
        }
    }

    updateFeedbackList(elementId, items) {
        const element = document.getElementById(elementId);
        if (Array.isArray(items)) {
            element.innerHTML = items.map(item => `<li>${item}</li>`).join('');
        } else {
            element.innerHTML = `<li>${items}</li>`;
        }
    }

    showNextQuestion(question, metadata) {
        document.getElementById('currentQuestion').textContent = question;
        
        if (metadata) {
            document.getElementById('questionType').textContent = 
                metadata.type === 'technical' ? 'Technical Question' : 'Behavioral Question';
            
            // Reset timer with expected time
            this.startTimer(metadata.expected_time || 180);
        }

        // Reset form
        this.enableAnswerForm();
        document.getElementById('userAnswer').value = '';
        this.updateWordCount();

        // Add question to conversation
        this.addMessageToConversation('question', question);
    }

    startTimer(duration) {
        this.timeLeft = duration;
        this.updateTimerDisplay();

        if (this.timer) {
            clearInterval(this.timer);
        }

        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();

            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.submitAnswer({ preventDefault: () => {} });
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            // Visual warnings
            if (this.timeLeft < 30) {
                timerElement.style.background = 'var(--danger)';
            } else if (this.timeLeft < 60) {
                timerElement.style.background = 'var(--warning)';
            }
        }
    }

    updateProgress(progress) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill && progressText) {
            const percentage = (progress.current / progress.total) * 100;
            progressFill.style.width = `${percentage}%`;
            progressText.textContent = `Question ${progress.current}/${progress.total}`;
        }
    }

    addMessageToConversation(type, content) {
        const conversationPanel = document.getElementById('conversationPanel');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        const timestamp = new Date().toLocaleTimeString();

        let sender = '';
        let icon = '';

        switch (type) {
            case 'question':
                sender = '🤖 Interviewer';
                icon = 'robot';
                break;
            case 'answer':
                sender = '👤 You';
                icon = 'user';
                break;
            case 'feedback':
                sender = '📊 Feedback';
                icon = 'chart-bar';
                break;
        }

        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-sender">
                    <i class="fas fa-${icon}"></i>
                    ${sender}
                </span>
                <span class="message-time">${timestamp}</span>
            </div>
            <div class="message-content">${content}</div>
        `;

        conversationPanel.appendChild(messageDiv);
        conversationPanel.scrollTop = conversationPanel.scrollHeight;
    }

    disableAnswerForm() {
        const form = document.getElementById('answerForm');
        const inputs = form.querySelectorAll('input, textarea, button');
        inputs.forEach(input => input.disabled = true);
    }

    enableAnswerForm() {
        const form = document.getElementById('answerForm');
        const inputs = form.querySelectorAll('input, textarea, button');
        inputs.forEach(input => input.disabled = false);
    }

    updateWordCount() {
        const textarea = document.getElementById('userAnswer');
        const wordCount = document.getElementById('wordCount');
        if (textarea && wordCount) {
            const words = textarea.value.trim().split(/\s+/).filter(word => word.length > 0);
            wordCount.textContent = `${words.length} words`;

            // Visual feedback based on word count
            if (words.length < 25) {
                wordCount.style.color = 'var(--danger)';
            } else if (words.length < 50) {
                wordCount.style.color = 'var(--warning)';
            } else {
                wordCount.style.color = 'var(--success)';
            }
        }
    }

    showFinalResults(results) {
        // Store results in session storage for results page
        sessionStorage.setItem('interviewResults', JSON.stringify(results));
        
        // Redirect to results page
        window.location.href = '/results';
    }

    showLoadingModal() {
        const modal = document.getElementById('loadingModal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Simulate progress for better UX
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(progressInterval);
                }
                this.updateLoadingProgress(progress);
            }, 200);
        }
    }

    hideLoadingModal() {
        const modal = document.getElementById('loadingModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    updateLoadingProgress(progress) {
        const progressFill = document.getElementById('initProgress');
        const progressText = document.querySelector('.progress-text');
        
        if (progressFill && progressText) {
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${Math.round(progress)}%`;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    border-left: 4px solid var(--primary);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    max-width: 400px;
                    animation: slideInRight 0.3s ease;
                }
                .notification-error { border-left-color: var(--danger); }
                .notification-warning { border-left-color: var(--warning); }
                .notification-success { border-left-color: var(--success); }
                .notification-content { display: flex; align-items: center; gap: 10px; flex: 1; }
                .notification-close { background: none; border: none; cursor: pointer; color: var(--gray-500); }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            'info': 'info-circle',
            'success': 'check-circle',
            'warning': 'exclamation-triangle',
            'error': 'exclamation-circle'
        };
        return icons[type] || 'info-circle';
    }

    checkBrowserCompatibility() {
        const incompatibleFeatures = [];

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            incompatibleFeatures.push('Speech recording');
        }

        if (incompatibleFeatures.length > 0) {
            this.showNotification(
                `Some features may not work: ${incompatibleFeatures.join(', ')}`,
                'warning'
            );
        }
    }

    initializeCharts() {
        // Initialize any charts on the current page
        if (typeof Charts !== 'undefined') {
            Charts.initializePerformanceCharts();
        }
    }

    updatePerformanceCharts(analysis) {
        if (typeof Charts !== 'undefined') {
            Charts.updateRealTimeCharts(analysis);
        }
    }

    async downloadReport() {
        try {
            const response = await fetch('/download_report');
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `interview_report_${new Date().getTime()}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                throw new Error('Failed to download report');
            }
        } catch (error) {
            this.showNotification('Failed to download report: ' + error.message, 'error');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Speech recording functionality
class SpeechRecorder {
    constructor() {
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioContext = null;
        this.analyser = null;
    }

    async toggleRecording() {
        if (this.isRecording) {
            await this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            // Setup audio visualization
            this.setupAudioVisualization(stream);

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.updateUI();

            // Auto-stop after 3 minutes
            this.autoStopTimer = setTimeout(() => {
                this.stopRecording();
            }, 180000);

        } catch (error) {
            console.error('Error starting recording:', error);
            app.showNotification('Microphone access denied', 'error');
        }
    }

    async stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            this.isRecording = false;
            this.updateUI();

            if (this.autoStopTimer) {
                clearTimeout(this.autoStopTimer);
            }

            // Convert audio to base64 for submission
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
            return await this.blobToBase64(audioBlob);
        }
        return null;
    }

    setupAudioVisualization(stream) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        const source = this.audioContext.createMediaStreamSource(stream);
        source.connect(this.analyser);
        
        this.analyser.fftSize = 256;
        this.visualizeAudio();
    }

    visualizeAudio() {
        if (!this.isRecording) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            if (!this.isRecording) return;

            requestAnimationFrame(draw);
            this.analyser.getByteFrequencyData(dataArray);

            // Calculate average volume
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;

            // Update visualizer
            const visualizer = document.querySelector('.audio-level');
            if (visualizer) {
                visualizer.style.width = `${average}%`;
            }
        };

        draw();
    }

    updateUI() {
        const recordBtn = document.getElementById('recordBtn');
        const visualizer = document.querySelector('.audio-level');

        if (recordBtn) {
            if (this.isRecording) {
                recordBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
                recordBtn.classList.add('recording');
            } else {
                recordBtn.innerHTML = '<i class="fas fa-microphone"></i> Start Recording';
                recordBtn.classList.remove('recording');
            }
        }

        if (visualizer) {
            visualizer.style.width = '0%';
        }
    }

    blobToBase64(blob) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new InterviewApp();
    window.speechRecorder = new SpeechRecorder();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InterviewApp, SpeechRecorder };
}