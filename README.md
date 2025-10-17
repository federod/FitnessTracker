# Fitness Tracker

A modern, mobile-first fitness tracking application built with Vue 3, TypeScript, and Vite - similar to MyFitnessPal but optimized for mobile use.

## Features

### Dashboard
- Real-time nutrition progress with animated visual bars
- Exercise summary with calories burned and workout count
- Net calorie calculation (food - exercise)
- Quick action buttons with gradient backgrounds
- Responsive cards with modern animations

### Food Logging
- Track meals across breakfast, lunch, dinner, and snacks
- Pre-loaded database with 8 common foods
- Search functionality for quick food lookup
- Add custom foods with full nutrition details
- Adjustable serving sizes
- Real-time nutrition tracking with progress bars

### Exercise Tracking
- Quick-select common exercises with one tap
- Multiple exercise types (cardio, strength, flexibility, sports)
- Automatic calorie calculation based on duration
- Daily stats dashboard with animated counters
- Optional notes for each workout

### Profile & Goals
- Personal information management
- Automatic BMI, BMR, and TDEE calculations
- Customizable fitness goals (lose/maintain/gain weight)
- Activity level selection
- Personalized daily calorie and macro goals
- Visual stats cards

## iOS-Style Design

- **Dark & Light Themes**: Toggle between beautiful dark and light modes with persistent preference
- **Apple Design Language**: Authentic iOS typography, spacing, and interactions
- **Frosted Glass Effects**: Backdrop blur on navigation bars with 40px blur and 180% saturation
- **iOS System Colors**: Uses official iOS color palette (Blue, Green, Orange, Red, Purple, etc.)
- **Bottom Navigation**: iOS-style tab bar with icons and labels (mobile only)
- **Touch-Friendly**: All interactive elements sized at minimum 44px for comfortable tapping
- **Responsive Layout**: Seamlessly adapts from iPhone to desktop
- **Smooth Animations**: iOS-standard cubic-bezier timing functions
- **Safe Areas**: Full support for devices with notches and gesture areas
- **Theme Toggle**: Sun/moon icon button in navigation bar

## Tech Stack

- **Vue 3** with Composition API and `<script setup>` syntax
- **TypeScript** for type safety
- **Vite 6** for lightning-fast development and building
- **Vue Router 4** for navigation
- **Pinia** for state management
- **LocalStorage** for data persistence
- **Modern CSS** with CSS variables, gradients, and animations

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable Vue components
│   ├── NavBar.vue
│   └── NutritionProgress.vue
├── views/              # Page components
│   ├── Dashboard.vue
│   ├── FoodLog.vue
│   ├── Exercise.vue
│   └── Profile.vue
├── stores/             # Pinia stores
│   ├── userStore.ts
│   ├── foodStore.ts
│   └── exerciseStore.ts
├── router/             # Vue Router configuration
│   └── index.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.vue             # Root component
├── main.ts             # Application entry point
└── style.css           # Global styles
```

## Usage

### First Time Setup

1. Navigate to the **Profile** page
2. Enter your personal information (age, gender, height, weight)
3. Set your activity level
4. Choose your fitness goal (lose, maintain, or gain weight)
5. Save your profile

### Logging Food

1. Go to **Food Log** page
2. Click "+ Add" on any meal section
3. Search or select from common foods
4. Adjust serving size
5. Add to your daily log

### Logging Exercise

1. Go to **Exercise** page
2. Click "+ Add Exercise"
3. Select from quick options or enter custom exercise
4. Set duration and calories burned
5. Add optional notes

### Viewing Progress

Check the **Dashboard** to see:
- Daily nutrition progress vs goals
- Total calories burned from exercise
- Net calorie intake
- Quick action buttons

## Data Persistence

All data is stored in your browser's LocalStorage:
- Food entries
- Exercise logs
- User profile
- Custom foods

**Note:** Clearing browser data will remove all stored information.

## Future Enhancements

Potential features to add:
- Weight tracking over time with charts
- Water intake tracking
- Meal planning
- Recipe builder
- Dark mode
- Export data functionality
- Integration with fitness APIs
- Mobile app version

## License

MIT License - feel free to use this project for learning or personal use.
