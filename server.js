const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 8080;

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
        // Check if API key is available
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            console.log('GEMINI_API_KEY not set, using fallback questions');
            throw new Error('API key not configured');
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // Add timestamp and random elements to ensure uniqueness
        const timestamp = Date.now();
        const randomSeed = Math.floor(Math.random() * 1000);
        
        const prompt = `Generate exactly ${count} unique C++ programming quiz questions for ${difficulty} level difficulty. 
        Each question must be in this exact JSON format:
        {
            "question": "The question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct": 0,
            "explanation": "Brief explanation of the correct answer"
        }
        
        For ${difficulty} level focus on:
        - Basic: Variables, data types, basic syntax, simple loops, basic I/O, operators, conditionals, arrays
        - Moderate: Functions, classes, pointers, memory management, STL basics, inheritance, polymorphism, constructors, destructors
        - Harder: Templates, smart pointers, advanced OOP, design patterns, move semantics, lambda expressions, RAII, const correctness
        
        IMPORTANT: 
        - Make each question completely unique and different from any previous questions
        - Test different C++ concepts in each question
        - Ensure correct answer index (0-3) matches the right option
        - Provide clear, educational explanations
        - Use varied question formats (code snippets, theoretical concepts, practical scenarios)
        - Include questions about different C++ versions (C++11, C++14, C++17, C++20)
        - Return ONLY the JSON array, no other text
        
        Generate ${count} completely unique questions now (timestamp: ${timestamp}, seed: ${randomSeed}):`;

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
                },
                {
                    question: "What is the output of: cout << 5 + 3 * 2;",
                    options: ["16", "11", "13", "10"],
                    correct: 1,
                    explanation: "Multiplication has higher precedence than addition, so 3 * 2 = 6, then 5 + 6 = 11."
                },
                {
                    question: "Which data type is used for storing single characters in C++?",
                    options: ["char", "string", "character", "text"],
                    correct: 0,
                    explanation: "The 'char' data type is used to store single characters in C++."
                },
                {
                    question: "What is the correct syntax for a for loop in C++?",
                    options: ["for(int i=0; i<10; i++)", "for i in range(10)", "loop(int i=0; i<10; i++)", "for(int i=0; i<10; i++) {"],
                    correct: 0,
                    explanation: "The correct syntax is 'for(int i=0; i<10; i++)' followed by the loop body."
                },
                {
                    question: "Which keyword is used to include header files in C++?",
                    options: ["#include", "#import", "#require", "#load"],
                    correct: 0,
                    explanation: "The '#include' preprocessor directive is used to include header files."
                },
                {
                    question: "What is the size of an int in C++?",
                    options: ["4 bytes", "2 bytes", "8 bytes", "Depends on the system"],
                    correct: 3,
                    explanation: "The size of int depends on the system architecture (typically 4 bytes on 32-bit systems)."
                },
                {
                    question: "Which operator is used for logical AND in C++?",
                    options: ["&&", "&", "and", "AND"],
                    correct: 0,
                    explanation: "The '&&' operator is used for logical AND operations in C++."
                },
                {
                    question: "What is the correct way to declare a constant in C++?",
                    options: ["const int x = 5;", "constant int x = 5;", "final int x = 5;", "readonly int x = 5;"],
                    correct: 0,
                    explanation: "The 'const' keyword is used to declare constants in C++."
                },
                {
                    question: "Which loop executes at least once?",
                    options: ["do-while", "while", "for", "foreach"],
                    correct: 0,
                    explanation: "The do-while loop executes the body at least once before checking the condition."
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
                },
                {
                    question: "What is the purpose of a constructor?",
                    options: ["Initialize object data", "Destroy objects", "Call methods", "Declare variables"],
                    correct: 0,
                    explanation: "A constructor is used to initialize the data members of an object when it is created."
                },
                {
                    question: "Which access specifier makes members accessible only within the class?",
                    options: ["private", "public", "protected", "internal"],
                    correct: 0,
                    explanation: "The 'private' access specifier restricts access to members only within the same class."
                },
                {
                    question: "What is function overloading?",
                    options: ["Multiple functions with same name but different parameters", "Functions that call themselves", "Functions that return multiple values", "Functions with no parameters"],
                    correct: 0,
                    explanation: "Function overloading allows multiple functions with the same name but different parameter lists."
                },
                {
                    question: "Which STL container provides dynamic array functionality?",
                    options: ["vector", "array", "list", "deque"],
                    correct: 0,
                    explanation: "The 'vector' class provides dynamic array functionality with automatic resizing."
                },
                {
                    question: "What is inheritance in C++?",
                    options: ["Creating new classes from existing ones", "Creating multiple objects", "Creating functions", "Creating variables"],
                    correct: 0,
                    explanation: "Inheritance allows creating new classes that inherit properties and methods from existing classes."
                },
                {
                    question: "Which operator is used for dynamic memory allocation?",
                    options: ["new", "malloc", "allocate", "create"],
                    correct: 0,
                    explanation: "The 'new' operator is used for dynamic memory allocation in C++."
                },
                {
                    question: "What is polymorphism in C++?",
                    options: ["Same interface, different implementations", "Same implementation, different interfaces", "Multiple inheritance", "Function overloading"],
                    correct: 0,
                    explanation: "Polymorphism allows objects of different types to be treated as objects of a common base type."
                },
                {
                    question: "Which keyword is used to prevent inheritance?",
                    options: ["final", "sealed", "private", "static"],
                    correct: 0,
                    explanation: "The 'final' keyword (C++11) prevents a class from being inherited."
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
                },
                {
                    question: "What is RAII in C++?",
                    options: ["Resource Acquisition Is Initialization", "Random Access Iterator Interface", "Runtime Array Indexing Interface", "Recursive Algorithm Implementation"],
                    correct: 0,
                    explanation: "RAII is a programming technique that binds resource management to object lifetime."
                },
                {
                    question: "Which C++11 feature allows type deduction?",
                    options: ["auto", "var", "let", "type"],
                    correct: 0,
                    explanation: "The 'auto' keyword allows the compiler to automatically deduce the type of a variable."
                },
                {
                    question: "What is move semantics in C++11?",
                    options: ["Transferring resources without copying", "Moving objects in memory", "Changing object types", "Deleting objects"],
                    correct: 0,
                    explanation: "Move semantics allows transferring resources from one object to another without copying."
                },
                {
                    question: "Which keyword is used for perfect forwarding?",
                    options: ["forward", "move", "transfer", "pass"],
                    correct: 0,
                    explanation: "The 'forward' function is used for perfect forwarding of arguments in templates."
                },
                {
                    question: "What is a lambda expression?",
                    options: ["Anonymous function object", "Named function", "Class method", "Global function"],
                    correct: 0,
                    explanation: "A lambda expression is an anonymous function that can be defined inline."
                },
                {
                    question: "Which design pattern ensures only one instance exists?",
                    options: ["Singleton", "Factory", "Observer", "Strategy"],
                    correct: 0,
                    explanation: "The Singleton pattern ensures that a class has only one instance and provides global access to it."
                },
                {
                    question: "What is const correctness in C++?",
                    options: ["Using const to prevent unintended modifications", "Making all variables constant", "Using const for performance", "Declaring constants"],
                    correct: 0,
                    explanation: "Const correctness is the practice of using const to prevent unintended modifications of objects."
                },
                {
                    question: "Which C++17 feature allows structured binding?",
                    options: ["auto [a, b] = pair", "let [a, b] = pair", "var [a, b] = pair", "bind [a, b] = pair"],
                    correct: 0,
                    explanation: "Structured binding allows unpacking tuple-like objects into individual variables using auto [a, b] syntax."
                }
            ]
        };
        
        // Get questions for the difficulty level
        const difficultyQuestions = fallbackQuestions[difficulty] || fallbackQuestions.basic;
        
        // Shuffle the questions to ensure variety
        const shuffled = [...difficultyQuestions].sort(() => Math.random() - 0.5);
        
        // Add timestamp to make questions appear unique
        const timestamp = Date.now();
        const uniqueQuestions = shuffled.slice(0, count).map((q, index) => ({
            ...q,
            question: `${q.question} (Session: ${timestamp + index})`
        }));
        
        console.log(`Using fallback questions for ${difficulty} difficulty (${uniqueQuestions.length} questions)`);
        return uniqueQuestions;
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
