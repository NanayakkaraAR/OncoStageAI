# OncoStage AI Backend

## Getting Started

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

### Development

```bash
npm run dev
```

The server will start on http://localhost:3000

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## API Endpoints

- `GET /` - API root
- `GET /api/health` - Health check endpoint
