# C++ Quiz Challenge

views quiz application live : https://quiz-c.onrender.com

A modern, interactive C++ programming quiz application powered by AI-generated questions using Google's Gemini AI.

## Features

- 🎯 **Three Difficulty Levels**: Basic, Moderate, and Harder
- 🤖 **AI-Generated Questions**: Fresh questions created using Google Gemini AI
- ⏱️ **Timer System**: 60-second timer per question
- 📊 **Detailed Results**: Comprehensive score analysis and question review
- 🎨 **Modern UI**: Beautiful, responsive design with dark/light theme toggle
- 📱 **Mobile Friendly**: Optimized for all device sizes

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **AI**: Google Gemini AI for question generation
- **Styling**: Custom CSS with modern design patterns

## Getting Started

### Prerequisites

- Node.js (version 18.0.0 or higher)
- npm (version 8.0.0 or higher)
- Google Gemini AI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Sanesh764/quiz_c-.git
cd quiz_c-
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Add your Gemini AI API key to the `.env` file:
```
GEMINI_API_KEY=your_actual_api_key_here
```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:3000`

### Production Deployment

For production deployment, use:
```bash
npm start
```

## API Endpoints

- `POST /api/quiz/new` - Create a new quiz session
- `POST /api/quiz/:sessionId/answer` - Submit an answer
- `GET /api/quiz/:sessionId/results` - Get quiz results
- `GET /api/quiz/:sessionId` - Get session info

## Deployment

This application is ready for deployment on:
- **Render**: Connect your GitHub repository
- **Railway**: Deploy directly from GitHub
- **Heroku**: Use the included Procfile
- **Vercel**: Serverless deployment

### Environment Variables

Make sure to set the following environment variables in your deployment platform:
- `GEMINI_API_KEY`: Your Google Gemini AI API key
- `PORT`: Server port (optional, defaults to 3000)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Author

Created by [Sanesh764](https://github.com/Sanesh764)
