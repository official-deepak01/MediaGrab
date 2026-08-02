# MediaGrab Backend API Service

Production-ready Node.js & Express REST API Backend for **MediaGrab - Video Downloader**.

Engineered following Google Senior Backend Architecture guidelines using MVC (Model-View-Controller) design pattern, service isolation, input validation, rate limiting, and centralized error handling.

---

## 🛠️ Tech Stack & Dependencies

* **Runtime**: Node.js (v18+)
* **Framework**: Express.js (v4.19)
* **HTTP Client**: Axios (v1.6)
* **Security**: Helmet, CORS, Express Rate Limit
* **Config**: Dotenv
* **Dev Engine**: Nodemon

---

## 📂 Backend Architecture & Folder Structure

```text
backend/
├── server.js               # Express application entrypoint & static file server
├── package.json            # Node.js dependencies & scripts
├── .env.example            # Environment variables template
├── .env                    # Active environment configuration
│
├── config/
│   └── config.js           # Centralized environment parameters & platform whitelists
│
├── routes/
│   ├── index.js            # Main API router & GET /api/health
│   ├── videoRoutes.js      # Video metadata extraction route
│   └── downloadRoutes.js   # Video stream request & binary download routes
│
├── controllers/
│   ├── videoController.js  # Controller for POST /api/video-info
│   └── downloadController.js# Controller for POST /api/download
│
├── services/
│   ├── videoService.js     # Video metadata extraction service (oEmbed + OpenGraph)
│   ├── downloadService.js  # Stream token generation service
│   └── validationService.js# URL & format parameter validator
│
├── middleware/
│   ├── errorMiddleware.js  # Centralized error handler (400, 404, 500)
│   ├── rateLimiter.js     # IP Rate Limiter (100 req / 15 min)
│   └── requestValidator.js # Express request middleware validator
│
├── utils/
│   ├── apiResponse.js      # Standardized JSON response builder
│   ├── appError.js         # Custom operational error class
│   └── urlParser.js        # Domain extractor & platform detector
│
├── public/                 # Served static frontend (index.html, style.css, script.js)
└── README.md               # Backend Documentation
```

---

## 🚀 Getting Started

### 1. Installation
Navigate into the `backend/` directory and install dependencies:

```bash
cd backend
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` (already created for local testing):

```bash
cp .env.example .env
```

### 3. Run Development Server
Start server with `nodemon` auto-reloading on port **5000**:

```bash
npm run dev
```

### 4. Run Production Server
```bash
npm start
```

---

## 📖 API Documentation

### 1. Health Check
* **Endpoint**: `GET /api/health`
* **Description**: Verifies API service status.
* **Response (200 OK)**:
```json
{
  "status": "running"
}
```

---

### 2. Extract Video Information
* **Endpoint**: `POST /api/video-info`
* **Content-Type**: `application/json`
* **Request Body**:
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "status": 200,
  "message": "Video metadata extracted successfully.",
  "data": {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "Rick Astley - Never Gonna Give You Up (Official Music Video)",
    "thumbnail": "assets/images/video_thumbnail_demo.jpg",
    "duration": "03:33",
    "author": "Rick Astley",
    "views": "1.5M views",
    "platform": "YouTube",
    "availableQualities": [
      {
        "quality": "4k",
        "resolution": "4K (2160p)",
        "format": "MP4",
        "label": "Ultra HD • MP4",
        "estimatedSize": "342.5 MB",
        "isDefault": true
      },
      {
        "quality": "1080p",
        "resolution": "1080p Full HD",
        "format": "MP4",
        "label": "Crisp HD • MP4",
        "estimatedSize": "94.2 MB",
        "isDefault": false
      },
      {
        "quality": "mp3",
        "resolution": "Audio (320kbps)",
        "format": "MP3",
        "label": "High Quality • MP3",
        "estimatedSize": "8.4 MB",
        "isDefault": false
      }
    ],
    "extractedAt": "2026-08-01T20:00:00.000Z"
  }
}
```

---

### 3. Request Video Download Stream
* **Endpoint**: `POST /api/download`
* **Content-Type**: `application/json`
* **Request Body**:
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "quality": "1080p"
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "status": 200,
  "message": "Download stream link generated successfully.",
  "data": {
    "status": "ready",
    "requestInfo": {
      "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "quality": "1080P",
      "platform": "YouTube"
    },
    "download": {
      "token": "4f8a1c92d3b5e6f7a8b9c0d1e2f3a4b5",
      "fileName": "MediaGrab_YouTube_1080p_4f8a1c.mp4",
      "fileExtension": "mp4",
      "quality": "1080P",
      "directDownloadUrl": "/api/download/stream/4f8a1c92d3b5e6f7a8b9c0d1e2f3a4b5?format=mp4&quality=1080p",
      "expiresInSeconds": 3600
    }
  }
}
```

---

## 🔒 Security Features Implemented

1. **Helmet HTTP Headers**: Secures against XSS, clickjacking, and mime sniffing.
2. **CORS Control**: Configurable cross-origin resource sharing.
3. **Rate Limiting**: Protects endpoints against DDoS and scraping (100 requests per 15-minute window).
4. **Input Validation & Sanitization**: Validates URLs, domains, and format values before controller execution.
