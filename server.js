const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store quiz sessions (in production, use a database)
const quizSessions = new Map();

/**
 * Generate C++ quiz questions using Gemini AI
 * @param {string} difficulty - 'basic', 'moderate', or 'harder'
 * @param {number} count - number of questions to generate
 * @returns {Array} Array of quiz questions
 */
async function generateQuizQuestions(difficulty, count = 10) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `Generate exactly ${count} unique C++ programming quiz questions for ${difficulty} level difficulty. 
        Each question must be in this exact JSON format:
        {
            "question": "The question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct": 0,
            "explanation": "Brief explanation of the correct answer"
        }
        
        For ${difficulty} level focus on:
        - Basic: Variables, data types, basic syntax, simple loops, basic I/O, operators
        - Moderate: Functions, classes, pointers, memory management, STL basics, inheritance, polymorphism
        - Harder: Templates, smart pointers, advanced OOP, design patterns, move semantics, lambda expressions
        
        IMPORTANT: 
        - Make each question completely unique and different
        - Test different C++ concepts in each question
        - Ensure correct answer index (0-3) matches the right option
        - Provide clear, educational explanations
        - Return ONLY the JSON array, no other text
        
        Generate ${count} questions now:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean the response and parse JSON
        let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // Remove any text before the first [ and after the last ]
        const startIndex = cleanText.indexOf('[');
        const endIndex = cleanText.lastIndexOf(']');
        if (startIndex !== -1 && endIndex !== -1) {
            cleanText = cleanText.substring(startIndex, endIndex + 1);
        }
        
        console.log('Generated questions from Gemini:', cleanText.substring(0, 200) + '...');
        
        const questions = JSON.parse(cleanText);
        
        // Ensure we have the right number of questions
        return questions.slice(0, count);
    } catch (error) {
        console.error('Error generating questions:', error);
        
        // Fallback to static questions if API fails
        const fallbackQuestions = {
            basic: [
                {
                    question: "What is the correct way to declare an integer variable in C++?",
                    options: ["int x;", "integer x;", "var x;", "x = int;"],
                    correct: 0,
                    explanation: "In C++, you declare an integer variable using 'int' followed by the variable name."
                },
                {
                    question: "Which operator is used for assignment in C++?",
                    options: ["=", "==", "!=", ">="],
                    correct: 0,
                    explanation: "The single equals sign (=) is used for assignment, while == is used for comparison."
                }
            ],
            moderate: [
                {
                    question: "What is a pointer in C++?",
                    options: ["A variable that stores memory address", "A function", "A data type", "A loop"],
                    correct: 0,
                    explanation: "A pointer is a variable that stores the memory address of another variable."
                },
                {
                    question: "Which keyword is used to create a class?",
                    options: ["class", "struct", "object", "instance"],
                    correct: 0,
                    explanation: "The 'class' keyword is used to define a class in C++."
                }
            ],
            harder: [
                {
                    question: "What is a template in C++?",
                    options: ["A blueprint for creating generic functions/classes", "A data structure", "A function", "A variable"],
                    correct: 0,
                    explanation: "Templates are blueprints for creating generic functions and classes that work with different data types."
                },
                {
                    question: "What is a smart pointer?",
                    options: ["A pointer that automatically manages memory", "A fast pointer", "A large pointer", "A constant pointer"],
                    correct: 0,
                    explanation: "Smart pointers automatically manage memory allocation and deallocation, preventing memory leaks."
                }
            ]
        };
        
        const questions = fallbackQuestions[difficulty] || fallbackQuestions.basic;
        return questions.slice(0, count);
    }
}

/**
 * Create a new quiz session
 */
app.post('/api/quiz/new', async (req, res) => {
    try {
        const { difficulty = 'basic' } = req.body;
        
        if (!['basic', 'moderate', 'harder'].includes(difficulty)) {
            return res.status(400).json({ error: 'Invalid difficulty level' });
        }

        // Generate new questions
        const questions = await generateQuizQuestions(difficulty, 10);
        
        // Create session
        const sessionId = Date.now().toString();
        const session = {
            id: sessionId,
            difficulty,
            questions,
            currentQuestion: 0,
            answers: [],
            startTime: Date.now(),
            completed: false
        };
        
        quizSessions.set(sessionId, session);
        
        res.json({
            sessionId,
            difficulty,
            questions: questions.map(q => ({
                question: q.question,
                options: q.options
            }))
        });
    } catch (error) {
        console.error('Error creating quiz:', error);
        res.status(500).json({ error: 'Failed to create quiz' });
    }
});

/**
 * Submit an answer for a question
 */
app.post('/api/quiz/:sessionId/answer', (req, res) => {
    try {
        const { sessionId } = req.params;
        const { questionIndex, answer } = req.body;
        
        const session = quizSessions.get(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Quiz session not found' });
        }
        
        if (session.completed) {
            return res.status(400).json({ error: 'Quiz already completed' });
        }
        
        // Store the answer
        session.answers[questionIndex] = answer;
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error submitting answer:', error);
        res.status(500).json({ error: 'Failed to submit answer' });
    }
});

/**
 * Get quiz results
 */
app.get('/api/quiz/:sessionId/results', (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = quizSessions.get(sessionId);
        
        if (!session) {
            return res.status(404).json({ error: 'Quiz session not found' });
        }
        
        // Calculate results
        let correct = 0;
        const results = session.questions.map((question, index) => {
            const userAnswer = session.answers[index];
            const isCorrect = userAnswer === question.correct;
            if (isCorrect) correct++;
            
            return {
                question: question.question,
                userAnswer,
                correctAnswer: question.correct,
                isCorrect,
                explanation: question.explanation
            };
        });
        
        const score = Math.round((correct / session.questions.length) * 100);
        const timeSpent = Date.now() - session.startTime;
        
        // Mark as completed
        session.completed = true;
        
        res.json({
            score,
            correct,
            total: session.questions.length,
            results,
            timeSpent,
            difficulty: session.difficulty
        });
    } catch (error) {
        console.error('Error getting results:', error);
        res.status(500).json({ error: 'Failed to get results' });
    }
});

/**
 * Get quiz session info
 */
app.get('/api/quiz/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = quizSessions.get(sessionId);
        
        if (!session) {
            return res.status(404).json({ error: 'Quiz session not found' });
        }
        
        res.json({
            id: session.id,
            difficulty: session.difficulty,
            currentQuestion: session.currentQuestion,
            totalQuestions: session.questions.length,
            completed: session.completed
        });
    } catch (error) {
        console.error('Error getting session:', error);
        res.status(500).json({ error: 'Failed to get session' });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 C++ Quiz Server running on http://localhost:${PORT}`);
    console.log('📝 Make sure to set your GEMINI_API_KEY in the .env file');
});

module.exports = app;
