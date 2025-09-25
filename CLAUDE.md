# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based quiz application called "Quiz Jornada da Saúde" (Health Journey Quiz) built with vanilla HTML, CSS, and JavaScript. It's an interactive educational platform for health-related topics with multiple modules.

## Architecture

The application follows a simple client-side architecture:

- **Frontend**: Pure HTML/CSS/JavaScript with Bootstrap 5 for styling
- **Data Storage**: JSON files for quiz questions, localStorage for user progress
- **Structure**: Single-page application with screen-based navigation

### Key Files

- `index.html` - Main HTML structure with all screens (login, module selection, quiz, review)
- `js/config.js` - Central configuration including available modules
- `js/data.js` - Data management and JSON loading logic
- `js/app.js` - Main application logic and screen navigation
- `css/styles.css` - Custom styling with glassmorphism effects
- `*.json` - Quiz question data files (historia.json, dislipidemias.json, etc.)

### Application Flow

1. **Login Screen** - Simple entry point
2. **Module Selection** - Choose from configured health topics
3. **Quiz Screen** - Interactive questions with navigation and timer
4. **Review Screen** - Results and detailed answer explanations

### Configuration System

The app uses a centralized configuration in `js/config.js`:
- Add new modules by updating `quizConfig.modules` array
- Each module requires a corresponding JSON file with questions
- Questions support different types ("conteudista") and explanations

## Development Commands

This is a static web application that can be run directly in a web browser:

```bash
# Serve locally (if using a simple HTTP server)
python -m http.server 8000
# or
npx serve .
```

## JSON Question Format

Each module's JSON file contains an array of question objects:

```json
{
  "question": "Question text",
  "options": ["Option 1", "Option 2", "..."],
  "correctIndex": 0,
  "explanation": "Detailed explanation",
  "type": "conteudista"
}
```

## Adding New Modules

1. Create a new JSON file with questions in the root directory
2. Add module configuration to `js/config.js` in the `modules` array:
```javascript
{
  id: "module-id",
  name: "Display Name",
  file: "filename-without-extension"
}
```

## User Data Persistence

- Progress is saved to localStorage using the key defined in `quizConfig.storageKey`
- Tracks completion status and scores for each module
- No backend database required