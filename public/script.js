/**
 * C++ Quiz Application
 * Modern, responsive quiz with AI-generated questions
 */

class QuizApp {
    constructor() {
        this.currentSession = null;
        this.currentQuestion = 0;
        this.timer = null;
        this.timeLeft = 60;
        this.answers = [];
        this.questions = [];
        this.userStats = this.loadUserStats();
        this.achievements = this.loadAchievements();
        this.theme = this.loadTheme();
        
        this.initializeElements();
        this.bindEvents();
        this.applyTheme();
        this.updateDifficultyScreen();
        this.hideLoadingScreen();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        // Screens
        this.difficultyScreen = document.getElementById('difficulty-screen');
        this.quizScreen = document.getElementById('quiz-screen');
        this.resultsScreen = document.getElementById('results-screen');
        this.loadingScreen = document.getElementById('loading-screen');
        this.errorModal = document.getElementById('error-modal');

        // Difficulty selection
        this.difficultyCards = document.querySelectorAll('.difficulty-card');

        // Quiz elements
        this.difficultyBadge = document.getElementById('difficulty-badge');
        this.questionCounter = document.getElementById('question-counter');
        this.timerDisplay = document.getElementById('timer-display');
        this.timerProgress = document.getElementById('timer-progress');
        this.progressFill = document.getElementById('progress-fill');
        this.progressText = document.getElementById('progress-text');
        this.questionText = document.getElementById('question-text');
        this.optionsContainer = document.getElementById('options-container');
        this.nextBtn = document.getElementById('next-btn');

        // Results elements
        this.finalScore = document.getElementById('final-score');
        this.resultsTitle = document.getElementById('results-title');
        this.resultsSubtitle = document.getElementById('results-subtitle');
        this.correctCount = document.getElementById('correct-count');
        this.incorrectCount = document.getElementById('incorrect-count');
        this.timeSpent = document.getElementById('time-spent');
        this.questionReview = document.getElementById('question-review');
        this.retryBtn = document.getElementById('retry-btn');
        this.newQuizBtn = document.getElementById('new-quiz-btn');

        // Error modal
        this.errorMessage = document.getElementById('error-message');
        this.errorOkBtn = document.getElementById('error-ok-btn');
        this.modalClose = document.querySelector('.modal-close');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Difficulty selection
        this.difficultyCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const difficulty = e.currentTarget.dataset.difficulty;
                this.startQuiz(difficulty);
            });
        });

        // Quiz controls
        this.nextBtn.addEventListener('click', () => {
            this.nextQuestion();
        });

        // Results actions
        this.retryBtn.addEventListener('click', () => {
            this.retryQuiz();
        });

        this.newQuizBtn.addEventListener('click', () => {
            this.newQuiz();
        });

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.saveTheme(this.theme === 'light' ? 'dark' : 'light');
            });
        }

        // Stats button
        const statsBtn = document.getElementById('stats-btn');
        if (statsBtn) {
            statsBtn.addEventListener('click', () => {
                this.showStatsModal();
            });
        }

        // Error modal
        this.errorOkBtn.addEventListener('click', () => {
            this.hideError();
        });

        this.modalClose.addEventListener('click', () => {
            this.hideError();
        });

        // Close modal on background click
        this.errorModal.addEventListener('click', (e) => {
            if (e.target === this.errorModal) {
                this.hideError();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.quizScreen.classList.contains('active')) {
                this.handleKeyboard(e);
            }
        });
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyboard(e) {
        if (e.key >= '1' && e.key <= '4') {
            const optionIndex = parseInt(e.key) - 1;
            const options = this.optionsContainer.querySelectorAll('.option');
            if (options[optionIndex] && !options[optionIndex].classList.contains('disabled')) {
                this.selectOption(optionIndex);
            }
        } else if (e.key === 'Enter' && !this.nextBtn.disabled) {
            this.nextQuestion();
        }
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        setTimeout(() => {
            this.loadingScreen.classList.add('hidden');
        }, 1000);
    }

    /**
     * Show loading screen
     */
    showLoadingScreen() {
        this.loadingScreen.classList.remove('hidden');
    }

    /**
     * Start a new quiz
     */
    async startQuiz(difficulty) {
        try {
            this.showLoadingScreen();
            
            const response = await fetch('/api/quiz/new', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ difficulty })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            this.currentSession = data.sessionId;
            this.questions = data.questions;
            this.currentQuestion = 0;
            this.answers = [];
            this.timeLeft = 60;

            this.showQuizScreen(difficulty);
            this.displayQuestion();
            this.startTimer();
            
        } catch (error) {
            console.error('Error starting quiz:', error);
            this.showError('Failed to start quiz. Please check your connection and try again.');
        } finally {
            this.hideLoadingScreen();
        }
    }

    /**
     * Show quiz screen
     */
    showQuizScreen(difficulty) {
        this.difficultyScreen.classList.remove('active');
        this.quizScreen.classList.add('active');
        this.resultsScreen.classList.remove('active');

        this.difficultyBadge.textContent = difficulty;
        this.difficultyBadge.className = `difficulty-badge ${difficulty}`;
    }

    /**
     * Display current question
     */
    displayQuestion() {
        const question = this.questions[this.currentQuestion];
        
        // Update question counter
        this.questionCounter.textContent = `Question ${this.currentQuestion + 1} of ${this.questions.length}`;
        
        // Update progress bar
        const progress = ((this.currentQuestion) / this.questions.length) * 100;
        this.progressFill.style.width = `${progress}%`;
        this.progressText.textContent = `${Math.round(progress)}% Complete`;
        
        // Display question
        this.questionText.textContent = question.question;
        
        // Display options
        this.optionsContainer.innerHTML = '';
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.innerHTML = `
                <span class="option-label">${String.fromCharCode(65 + index)}</span>
                <span class="option-text">${option}</span>
            `;
            optionElement.addEventListener('click', () => {
                this.selectOption(index);
            });
            this.optionsContainer.appendChild(optionElement);
        });

        // Reset next button
        this.nextBtn.disabled = true;
        this.nextBtn.innerHTML = '<span>Next Question</span><i class="fas fa-arrow-right"></i>';
    }

    /**
     * Select an option
     */
    selectOption(optionIndex) {
        // Remove previous selections
        this.optionsContainer.querySelectorAll('.option').forEach(option => {
            option.classList.remove('selected');
        });

        // Select current option
        const selectedOption = this.optionsContainer.children[optionIndex];
        selectedOption.classList.add('selected');

        // Store answer
        this.answers[this.currentQuestion] = optionIndex;

        // Enable next button
        this.nextBtn.disabled = false;
    }

    /**
     * Start timer for current question
     */
    startTimer() {
        this.timeLeft = 60;
        this.updateTimerDisplay();
        
        // Update timer progress circle
        const circumference = 2 * Math.PI * 45; // radius = 45
        this.timerProgress.style.strokeDasharray = circumference;
        this.timerProgress.style.strokeDashoffset = 0;

        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            // Update progress circle
            const progress = (60 - this.timeLeft) / 60;
            const offset = circumference - (progress * circumference);
            this.timerProgress.style.strokeDashoffset = offset;

            // Change color based on time left
            if (this.timeLeft <= 10) {
                this.timerProgress.classList.add('danger');
                this.timerProgress.classList.remove('warning');
            } else if (this.timeLeft <= 20) {
                this.timerProgress.classList.add('warning');
                this.timerProgress.classList.remove('danger');
            } else {
                this.timerProgress.classList.remove('warning', 'danger');
            }

            if (this.timeLeft <= 0) {
                this.timeUp();
            }
        }, 1000);
    }

    /**
     * Update timer display
     */
    updateTimerDisplay() {
        this.timerDisplay.textContent = this.timeLeft;
    }

    /**
     * Handle time up
     */
    timeUp() {
        clearInterval(this.timer);
        
        // Auto-select if no answer chosen
        if (this.answers[this.currentQuestion] === undefined) {
            this.answers[this.currentQuestion] = -1; // No answer
        }

        // Show correct answer
        this.showCorrectAnswer();
        
        // Auto-advance after 2 seconds
        setTimeout(() => {
            this.nextQuestion();
        }, 2000);
    }

    /**
     * Show correct answer
     */
    showCorrectAnswer() {
        const question = this.questions[this.currentQuestion];
        const options = this.optionsContainer.querySelectorAll('.option');
        
        options.forEach((option, index) => {
            option.classList.add('disabled');
            
            if (index === question.correct) {
                option.classList.add('correct');
            } else if (index === this.answers[this.currentQuestion]) {
                option.classList.add('incorrect');
            }
        });
    }

    /**
     * Move to next question
     */
    async nextQuestion() {
        // Clear timer
        if (this.timer) {
            clearInterval(this.timer);
        }

        // Submit answer if not already submitted
        if (this.answers[this.currentQuestion] !== undefined) {
            await this.submitAnswer();
        }

        this.currentQuestion++;

        if (this.currentQuestion >= this.questions.length) {
            this.finishQuiz();
        } else {
            this.displayQuestion();
            this.startTimer();
        }
    }

    /**
     * Submit answer to server
     */
    async submitAnswer() {
        try {
            await fetch(`/api/quiz/${this.currentSession}/answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    questionIndex: this.currentQuestion,
                    answer: this.answers[this.currentQuestion]
                })
            });
        } catch (error) {
            console.error('Error submitting answer:', error);
        }
    }

    /**
     * Finish quiz and show results
     */
    async finishQuiz() {
        try {
            const response = await fetch(`/api/quiz/${this.currentSession}/results`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const results = await response.json();
            this.showResults(results);
            
        } catch (error) {
            console.error('Error getting results:', error);
            this.showError('Failed to get quiz results. Please try again.');
        }
    }

    /**
     * Show results screen
     */
    showResults(results) {
        this.quizScreen.classList.remove('active');
        this.resultsScreen.classList.add('active');

        // Update user statistics
        this.updateUserStats(results);

        // Update score
        this.finalScore.textContent = results.score;
        
        // Update stats
        this.correctCount.textContent = results.correct;
        this.incorrectCount.textContent = results.total - results.correct;
        this.timeSpent.textContent = this.formatTime(results.timeSpent);

        // Update title and subtitle based on score
        if (results.score >= 80) {
            this.resultsTitle.textContent = 'Excellent Work!';
            this.resultsSubtitle.textContent = 'Outstanding performance! You really know your C++!';
            if (results.score === 100) {
                this.showConfetti();
            }
        } else if (results.score >= 60) {
            this.resultsTitle.textContent = 'Good Job!';
            this.resultsSubtitle.textContent = 'Well done! Keep practicing to improve even more.';
        } else {
            this.resultsTitle.textContent = 'Keep Going!';
            this.resultsSubtitle.textContent = 'Practice makes perfect! Don\'t give up, you\'re learning!';
        }

        // Display detailed results
        this.displayDetailedResults(results.results);
        
        // Show user statistics
        this.displayUserStats();
    }

    /**
     * Display detailed question review
     */
    displayDetailedResults(results) {
        this.questionReview.innerHTML = '';

        results.forEach((result, index) => {
            const reviewItem = document.createElement('div');
            reviewItem.className = `review-item ${result.isCorrect ? 'correct' : 'incorrect'}`;
            
            reviewItem.innerHTML = `
                <div class="review-question">
                    <strong>Question ${index + 1}:</strong> ${result.question}
                </div>
                <div class="review-answer ${result.isCorrect ? 'correct' : 'incorrect'}">
                    <i class="fas fa-${result.isCorrect ? 'check' : 'times'}"></i>
                    Your answer: ${result.userAnswer === -1 ? 'No answer' : String.fromCharCode(65 + result.userAnswer)}
                    ${!result.isCorrect ? ` | Correct answer: ${String.fromCharCode(65 + result.correctAnswer)}` : ''}
                </div>
                <div class="review-explanation">
                    ${result.explanation}
                </div>
            `;
            
            this.questionReview.appendChild(reviewItem);
        });
    }

    /**
     * Format time in minutes and seconds
     */
    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}m ${seconds}s`;
    }

    /**
     * Retry current quiz
     */
    retryQuiz() {
        if (this.currentSession) {
            const difficulty = this.difficultyBadge.textContent.toLowerCase();
            this.startQuiz(difficulty);
        }
    }

    /**
     * Start new quiz
     */
    newQuiz() {
        this.resultsScreen.classList.remove('active');
        this.difficultyScreen.classList.add('active');
    }

    /**
     * Show error modal
     */
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorModal.classList.add('active');
    }

    /**
     * Hide error modal
     */
    hideError() {
        this.errorModal.classList.remove('active');
    }

    /**
     * Load user statistics from localStorage
     */
    loadUserStats() {
        const defaultStats = {
            totalQuizzes: 0,
            totalQuestions: 0,
            correctAnswers: 0,
            averageScore: 0,
            bestScore: 0,
            streak: 0,
            lastQuizDate: null,
            difficultyProgress: {
                basic: { completed: 0, bestScore: 0 },
                moderate: { completed: 0, bestScore: 0 },
                harder: { completed: 0, bestScore: 0 }
            },
            topicProgress: {
                variables: { correct: 0, total: 0 },
                functions: { correct: 0, total: 0 },
                classes: { correct: 0, total: 0 },
                pointers: { correct: 0, total: 0 },
                stl: { correct: 0, total: 0 },
                templates: { correct: 0, total: 0 }
            }
        };
        
        const saved = localStorage.getItem('cppQuizStats');
        return saved ? { ...defaultStats, ...JSON.parse(saved) } : defaultStats;
    }

    /**
     * Save user statistics to localStorage
     */
    saveUserStats() {
        localStorage.setItem('cppQuizStats', JSON.stringify(this.userStats));
    }

    /**
     * Load achievements from localStorage
     */
    loadAchievements() {
        const defaultAchievements = {
            firstQuiz: false,
            perfectScore: false,
            streak5: false,
            streak10: false,
            allDifficulties: false,
            speedDemon: false,
            codeMaster: false,
            persistent: false
        };
        
        const saved = localStorage.getItem('cppQuizAchievements');
        return saved ? { ...defaultAchievements, ...JSON.parse(saved) } : defaultAchievements;
    }

    /**
     * Save achievements to localStorage
     */
    saveAchievements() {
        localStorage.setItem('cppQuizAchievements', JSON.stringify(this.achievements));
    }

    /**
     * Load theme preference
     */
    loadTheme() {
        return localStorage.getItem('cppQuizTheme') || 'light';
    }

    /**
     * Save theme preference
     */
    saveTheme(theme) {
        this.theme = theme;
        localStorage.setItem('cppQuizTheme', theme);
        this.applyTheme();
    }

    /**
     * Apply theme to the application
     */
    applyTheme() {
        document.body.classList.toggle('dark-theme', this.theme === 'dark');
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.innerHTML = this.theme === 'dark' ? 
                '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        }
    }

    /**
     * Update user statistics after quiz completion
     */
    updateUserStats(results) {
        this.userStats.totalQuizzes++;
        this.userStats.totalQuestions += results.total;
        this.userStats.correctAnswers += results.correct;
        this.userStats.averageScore = Math.round(
            (this.userStats.correctAnswers / this.userStats.totalQuestions) * 100
        );
        
        if (results.score > this.userStats.bestScore) {
            this.userStats.bestScore = results.score;
        }

        // Update difficulty progress
        const difficulty = results.difficulty;
        this.userStats.difficultyProgress[difficulty].completed++;
        if (results.score > this.userStats.difficultyProgress[difficulty].bestScore) {
            this.userStats.difficultyProgress[difficulty].bestScore = results.score;
        }

        // Update streak
        const today = new Date().toDateString();
        if (this.userStats.lastQuizDate === today) {
            // Already counted today
        } else if (this.userStats.lastQuizDate === new Date(Date.now() - 86400000).toDateString()) {
            this.userStats.streak++;
        } else {
            this.userStats.streak = 1;
        }
        this.userStats.lastQuizDate = today;

        this.saveUserStats();
        this.checkAchievements(results);
    }

    /**
     * Check and unlock achievements
     */
    checkAchievements(results) {
        const newAchievements = [];

        // First quiz
        if (!this.achievements.firstQuiz && this.userStats.totalQuizzes === 1) {
            this.achievements.firstQuiz = true;
            newAchievements.push('First Quiz Complete!');
        }

        // Perfect score
        if (!this.achievements.perfectScore && results.score === 100) {
            this.achievements.perfectScore = true;
            newAchievements.push('Perfect Score!');
        }

        // Streak achievements
        if (!this.achievements.streak5 && this.userStats.streak >= 5) {
            this.achievements.streak5 = true;
            newAchievements.push('5 Day Streak!');
        }

        if (!this.achievements.streak10 && this.userStats.streak >= 10) {
            this.achievements.streak10 = true;
            newAchievements.push('10 Day Streak!');
        }

        // All difficulties
        const allCompleted = Object.values(this.userStats.difficultyProgress)
            .every(diff => diff.completed > 0);
        if (!this.achievements.allDifficulties && allCompleted) {
            this.achievements.allDifficulties = true;
            newAchievements.push('Master of All Levels!');
        }

        // Speed demon (complete quiz in under 5 minutes)
        if (!this.achievements.speedDemon && results.timeSpent < 300000) {
            this.achievements.speedDemon = true;
            newAchievements.push('Speed Demon!');
        }

        // Code master (90%+ on harder difficulty)
        if (!this.achievements.codeMaster && results.difficulty === 'harder' && results.score >= 90) {
            this.achievements.codeMaster = true;
            newAchievements.push('Code Master!');
        }

        // Persistent (100+ questions answered)
        if (!this.achievements.persistent && this.userStats.totalQuestions >= 100) {
            this.achievements.persistent = true;
            newAchievements.push('Persistent Learner!');
        }

        if (newAchievements.length > 0) {
            this.saveAchievements();
            this.showAchievements(newAchievements);
        }
    }

    /**
     * Show achievement notifications
     */
    showAchievements(achievements) {
        achievements.forEach((achievement, index) => {
            setTimeout(() => {
                this.showToast(achievement, 'success', 5000);
            }, index * 1000);
        });
    }

    /**
     * Get adaptive difficulty based on user performance
     */
    getAdaptiveDifficulty() {
        const basicAvg = this.userStats.difficultyProgress.basic.bestScore;
        const moderateAvg = this.userStats.difficultyProgress.moderate.bestScore;
        
        if (basicAvg >= 80 && this.userStats.difficultyProgress.basic.completed >= 3) {
            if (moderateAvg >= 80 && this.userStats.difficultyProgress.moderate.completed >= 3) {
                return 'harder';
            }
            return 'moderate';
        }
        return 'basic';
    }

    /**
     * Show confetti animation for high scores
     */
    showConfetti() {
        // Simple confetti effect
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.innerHTML = '🎉'.repeat(50);
        confetti.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            font-size: 20px;
            animation: confetti-fall 3s ease-out forwards;
        `;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 3000);
    }

    /**
     * Display user statistics
     */
    displayUserStats() {
        // Add stats to results if not already present
        let statsContainer = document.getElementById('user-stats');
        if (!statsContainer) {
            statsContainer = document.createElement('div');
            statsContainer.id = 'user-stats';
            statsContainer.className = 'user-stats';
            statsContainer.innerHTML = `
                <h3>Your Progress</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-value">${this.userStats.totalQuizzes}</span>
                        <span class="stat-label">Quizzes Taken</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${this.userStats.averageScore}%</span>
                        <span class="stat-label">Average Score</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${this.userStats.bestScore}%</span>
                        <span class="stat-label">Best Score</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${this.userStats.streak}</span>
                        <span class="stat-label">Day Streak</span>
                    </div>
                </div>
            `;
            
            const detailedResults = document.querySelector('.detailed-results');
            detailedResults.parentNode.insertBefore(statsContainer, detailedResults);
        } else {
            // Update existing stats
            statsContainer.querySelector('.stat-item:nth-child(1) .stat-value').textContent = this.userStats.totalQuizzes;
            statsContainer.querySelector('.stat-item:nth-child(2) .stat-value').textContent = this.userStats.averageScore + '%';
            statsContainer.querySelector('.stat-item:nth-child(3) .stat-value').textContent = this.userStats.bestScore + '%';
            statsContainer.querySelector('.stat-item:nth-child(4) .stat-value').textContent = this.userStats.streak;
        }
    }

    /**
     * Show statistics modal
     */
    showStatsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-chart-bar"></i> Your Statistics</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="stats-overview">
                        <div class="stat-card">
                            <div class="stat-icon correct">
                                <i class="fas fa-trophy"></i>
                            </div>
                            <div class="stat-content">
                                <span class="stat-number">${this.userStats.totalQuizzes}</span>
                                <span class="stat-label">Quizzes Taken</span>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon time">
                                <i class="fas fa-target"></i>
                            </div>
                            <div class="stat-content">
                                <span class="stat-number">${this.userStats.averageScore}%</span>
                                <span class="stat-label">Average Score</span>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon correct">
                                <i class="fas fa-star"></i>
                            </div>
                            <div class="stat-content">
                                <span class="stat-number">${this.userStats.bestScore}%</span>
                                <span class="stat-label">Best Score</span>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon time">
                                <i class="fas fa-fire"></i>
                            </div>
                            <div class="stat-content">
                                <span class="stat-number">${this.userStats.streak}</span>
                                <span class="stat-label">Day Streak</span>
                            </div>
                        </div>
                    </div>
                    <div class="achievements-section">
                        <h4>Achievements</h4>
                        <div class="achievements-grid">
                            ${Object.entries(this.achievements).map(([key, unlocked]) => `
                                <div class="achievement ${unlocked ? 'unlocked' : 'locked'}">
                                    <i class="fas fa-${this.getAchievementIcon(key)}"></i>
                                    <span>${this.getAchievementName(key)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary modal-close">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.remove();
            });
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Get achievement icon
     */
    getAchievementIcon(key) {
        const icons = {
            firstQuiz: 'play-circle',
            perfectScore: 'trophy',
            streak5: 'fire',
            streak10: 'fire',
            allDifficulties: 'medal',
            speedDemon: 'bolt',
            codeMaster: 'code',
            persistent: 'graduation-cap'
        };
        return icons[key] || 'star';
    }

    /**
     * Get achievement name
     */
    getAchievementName(key) {
        const names = {
            firstQuiz: 'First Quiz',
            perfectScore: 'Perfect Score',
            streak5: '5 Day Streak',
            streak10: '10 Day Streak',
            allDifficulties: 'Master of All',
            speedDemon: 'Speed Demon',
            codeMaster: 'Code Master',
            persistent: 'Persistent Learner'
        };
        return names[key] || 'Unknown';
    }

    /**
     * Update difficulty screen with user progress
     */
    updateDifficultyScreen() {
        // Update difficulty card stats
        Object.entries(this.userStats.difficultyProgress).forEach(([difficulty, stats]) => {
            const bestElement = document.getElementById(`${difficulty}-best`);
            const completedElement = document.getElementById(`${difficulty}-completed`);
            
            if (bestElement) bestElement.textContent = `${stats.bestScore}%`;
            if (completedElement) completedElement.textContent = stats.completed;
        });
    }
}

/**
 * Utility functions
 */

/**
 * Format time for display
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Debounce function for performance
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function for performance
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Smooth scroll to element
 */
function smoothScrollTo(element) {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

/**
 * Check if element is in viewport
 */
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Add loading state to button
 */
function setButtonLoading(button, loading = true) {
    if (loading) {
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || button.innerHTML;
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add toast styles if not already present
    if (!document.querySelector('#toast-styles')) {
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 1001;
                transform: translateX(100%);
                transition: transform 0.3s ease;
            }
            .toast.show {
                transform: translateX(0);
            }
            .toast-info { background: #3b82f6; }
            .toast-success { background: #10b981; }
            .toast-warning { background: #f59e0b; }
            .toast-error { background: #ef4444; }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Hide toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Initialize app when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the quiz application
    window.quizApp = new QuizApp();
    
    // Add some performance optimizations
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', () => {
            img.classList.add('loaded');
        });
    });
    
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                smoothScrollTo(target);
            }
        });
    });
    
    // Add intersection observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.difficulty-card, .question-container, .results-content').forEach(el => {
        observer.observe(el);
    });
    
    console.log('🚀 C++ Quiz App initialized successfully!');
});

/**
 * Handle page visibility changes
 */
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.quizApp && window.quizApp.timer) {
        // Pause timer when page is hidden
        console.log('Page hidden - timer paused');
    } else if (!document.hidden && window.quizApp && window.quizApp.timer) {
        // Resume timer when page is visible
        console.log('Page visible - timer resumed');
    }
});

/**
 * Handle beforeunload event
 */
window.addEventListener('beforeunload', (e) => {
    if (window.quizApp && window.quizApp.currentSession && !window.quizApp.resultsScreen.classList.contains('active')) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your quiz progress will be lost.';
        return e.returnValue;
    }
});

/**
 * Export for potential module usage
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QuizApp, formatTime, debounce, throttle };
}
