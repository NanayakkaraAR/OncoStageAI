# OncoStage AI

A monorepo application for lung cancer staging using AI.

## Project Structure

```
.
├── frontend/          # Angular application
├── backend/           # Node.js/Express API
└── package.json       # Root workspace configuration
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

Install dependencies for all packages:

```bash
# Install frontend dependencies
npm run install:frontend

# Install backend dependencies
npm run install:backend

# Or install all at once
npm run install:all
```

### Development

Run the development servers:

```bash
# Start frontend (Angular)
npm run dev:frontend

# Start backend (Express)
npm run dev:backend
```

The frontend will be available at http://localhost:4200
The backend API will be available at http://localhost:3000

### Build

Build all packages:

```bash
npm run build:all
```

Or build individually:

```bash
npm run build:frontend
npm run build:backend
```

## Workspace Structure

### Frontend

Angular-based web application located in the `frontend/` directory.

### Backend

Node.js/Express API server located in the `backend/` directory.
