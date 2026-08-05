# YouTube Playlist Video Extractor

A modern web application for extracting video links and metadata from YouTube playlists, built with the MERN stack (MongoDB, Express.js, React, Node.js) using Next.js 14.

![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## ✨ Features

### Core Functionality
- **Playlist Extraction**: Extract all video URLs, titles, thumbnails, and metadata from YouTube playlists
- **Single Video Support**: Also works with individual YouTube video URLs
- **Video Download**: Download a single video or the whole result set as MP4
- **Bulk Operations**: Copy all links, titles, or combined data with one click
- **Multi-format Export**: Download results as **CSV**, **Excel (.xlsx)**, or **PDF** —
  the Excel and PDF exports embed each video's thumbnail image

### User Experience
- **Real-time Loading**: Progressive video loading with live progress indicators
- **Dual View Modes**: 
  - **Paginated View**: Navigate through videos page by page (5, 10, 15, 20, 30, 50 videos per page)
  - **Real-time Stream**: Load all videos progressively in one continuous view
- **Responsive Design**: Modern Tailwind CSS interface optimized for desktop and mobile devices
- **Interactive UI**: Toast notifications, loading spinners, and visual feedback

### Performance & Reliability
- **Concurrent Processing**: Parallel video fetching for improved performance
- **Smart Caching**: 1-hour cache for video metadata to reduce API calls
- **Error Handling**: Graceful handling of private, deleted, or unavailable videos
- **TypeScript**: Full type safety throughout the application

## 🛠️ Technology Stack

- **Frontend**: React 18+ with Next.js 14 (App Router)
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: MongoDB (for link history storage)
- **YouTube Integration**: YouTube Data API v3 + ytdl-core
- **Styling**: Tailwind CSS v4
- **Exports**: ExcelJS (.xlsx), jsPDF + jspdf-autotable (PDF)
- **Language**: TypeScript
- **Caching**: In-memory caching with Redis support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or higher
- npm or yarn
- MongoDB (optional, for link history)
- YouTube Data API v3 key (required for playlist extraction)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/curiousbud/YouTube-Playlist-videos-link-Extractor.git
   cd YouTube-Playlist-videos-link-Extractor
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your YouTube API key:
   ```env
   YOUTUBE_API_KEY=your_youtube_api_key_here
   MONGODB_URI=mongodb://localhost:27017/youtube-playlist-extractor
   ```

4. **Get YouTube Data API Key**
   - Go to [Google Cloud Console](https://console.developers.google.com/)
   - Create a new project or select an existing one
   - Enable "YouTube Data API v3"
   - Create credentials (API key)
   - Copy the API key to your `.env.local` file

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Access Application**
   Open your browser and navigate to `http://localhost:3000`

## 📖 Usage Guide

### Basic Usage

1. **Enter Playlist URL**
   - Paste a YouTube playlist URL in the input field
   - Supported formats:
     - `https://www.youtube.com/playlist?list=PLxxxxxx`
     - `https://www.youtube.com/watch?v=xxxxx&list=PLxxxxxx`
   - Single video URLs also supported

2. **Configure Display Settings**
   - **View Mode**: Choose between "Paginated View" or "Load All (Real-time Stream)"
   - **Videos per Page**: Select 5, 10, 15, 20, 30, or 50 videos per page (for paginated view)

3. **Extract Videos**
   - Click "Extract Videos" to start processing
   - Watch real-time progress indicator for large playlists
   - Videos load progressively for immediate access

4. **Export and Copy Options**
   - **Individual Actions**: Copy video link, title, or both for each video
   - **Bulk Actions**: Copy all links, all titles, or all data at once
   - **Export menu**: Download the full result set in any of three formats:
     - **CSV** — plain spreadsheet text (RFC 4180, UTF-8 BOM for Excel compatibility)
     - **Excel (.xlsx)** — a worksheet with an embedded thumbnail per row
     - **PDF** — a printable table with an embedded thumbnail per row

   > Thumbnails are fetched through a same-origin image proxy (`/api/image-proxy`,
   > restricted to YouTube's CDN) so they embed reliably without cross-origin issues.

### Advanced Features

#### View Modes
- **Paginated View**: Traditional page-by-page navigation with customizable page sizes
- **Real-time Stream**: Continuous loading of all videos with progress tracking

#### Copy Functions
- **Copy Video Link**: Individual video URL
- **Copy Video Title**: Video title text
- **Copy Title + Link**: Combined format for easy sharing
- **Copy All Links**: All video URLs (newline separated)
- **Copy All Titles**: All video titles (newline separated)
- **Copy All Data**: Formatted list with numbers, titles, and URLs

#### Download Functions
- **Download (per video)**: Save the video as an MP4 file (highest quality progressive format — video + audio in one file)
- **Download All**: Sequentially download every video in the current result set
  (browsers may ask permission for multiple downloads on the first run)

> **Deployment note:** Downloads are streamed through the server, so they work
> on any Node.js host (self-hosted, Render, Railway, etc.). On Vercel's free or
> hobby plan function responses are capped (~4.5 MB), so large videos will fail
> there.

## 🏗️ Project Structure

```
YouTube-Playlist-videos-link-Extractor/
├── app/                           # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── extract-playlist/     # Playlist/video ID extraction endpoint
│   │   ├── process-video/        # Single video processing endpoint
│   │   ├── process-videos/       # Batch video processing (up to 50 IDs/call)
│   │   ├── download-video/       # Single video MP4 download (streamed)
│   │   └── image-proxy/          # Same-origin thumbnail proxy (for exports)
│   ├── layout.tsx                # Root layout (+ anti-FOUC theme script)
│   ├── theme.tsx                 # Dark/light theme switcher
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles + theme tokens
├── components/                    # React components
│   ├── ExtractorForm.tsx         # Main form component
│   ├── VideoList.tsx             # Video list + export menu
│   ├── Header.tsx / Footer.tsx   # Layout chrome
│   └── SocialIcons.tsx           # Inline SVG icons
├── lib/                          # Utility libraries
│   ├── format.ts                 # Duration / view-count formatters
│   ├── export/
│   │   └── exporters.ts          # CSV / Excel / PDF export logic
│   ├── mongodb/                  # MongoDB connection and models
│   │   ├── connection.ts         # Database connection
│   │   └── models/
│   │       └── Link.ts          # Link model
│   └── youtube/                  # YouTube integration
│       ├── extractor.ts         # Video extraction logic
│       └── download.ts          # Video download streaming logic
├── public/                       # Static assets
├── .env.local                    # Environment variables (not committed)
├── .env.example                  # Environment variables template
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

## 🔧 Configuration

### Environment Variables
The application requires the following environment variables (see `.env.example`):

```env
# YouTube Data API v3 Key (Required)
YOUTUBE_API_KEY=your_youtube_api_key_here

# MongoDB Connection (Optional - for link history)
MONGODB_URI=mongodb://localhost:27017/youtube-playlist-extractor

# Redis (Optional - for enhanced caching)
REDIS_URL=redis://localhost:6379

# Next.js Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# Password Protection (Optional - keep the site and API private)
SITE_PASSWORD=change_me_to_a_strong_password

# Session cookie signing secret (Optional - random string, e.g. openssl rand -base64 32)
SESSION_SECRET=
```

> **Private deployments:** when `SITE_PASSWORD` is set, the entire site and every
> `/api/*` route require a signed session cookie (see
> [Protecting your deployment](#protecting-your-deployment)). Set it if you want
> only yourself to be able to use the app.

### MongoDB Setup (Optional)
If you want to store link history:

1. Install MongoDB locally or use MongoDB Atlas
2. Update `MONGODB_URI` in `.env.local`
3. The application will automatically create the database and collections

## 🔒 Protecting your deployment

To make sure **only you** can use the site and its API, set `SITE_PASSWORD` in
your host's environment variables (plus `SESSION_SECRET`, ideally a random value
from `openssl rand -base64 32`). When `SITE_PASSWORD` is set:

- Every page except `/login` requires a valid signed session cookie; visitors
  without one are redirected to `/login`.
- Every `/api/*` route returns **401 Unauthorized** without a session cookie.
- Logging in with the correct password issues an httpOnly session cookie
  (HMAC-signed, 30-day expiry). Logout is available from the header.

Cookies are sent automatically on same-origin requests, so the existing client
code needs no changes. Do not share the password publicly.

## 🧪 API Endpoints

The application provides several API endpoints:

### POST `/api/extract-playlist`
Extract video IDs from a playlist or single video URL.

**Request Body:**
```json
{
  "link": "https://www.youtube.com/playlist?list=PLxxxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "type": "playlist",
  "playlistInfo": {
    "title": "Playlist Title",
    "uploader": "Channel Name",
    "videoCount": 50
  },
  "videoIds": ["videoId1", "videoId2", ...],
  "totalVideos": 50
}
```

### POST `/api/process-videos`
Fetch details for up to 50 videos in a single request. This is the endpoint the
UI uses — `videos.list` accepts up to 50 IDs per call (1 quota unit), so a
50-video playlist costs one API call instead of fifty.

**Request Body:**
```json
{ "videoIds": ["dQw4w9WgXcQ", "..."] }
```

**Response:**
```json
{ "success": true, "videos": [ { "url": "...", "title": "...", "thumbnail": "...", "duration": 213, "viewCount": 1000000, "uploadDate": "2024-01-01" } ] }
```
Results are returned in the same order as the input IDs, with a placeholder for
any private/deleted video the API omits.

### GET `/api/image-proxy?id=<videoId>&quality=<quality>`
Streams a YouTube thumbnail through the same origin so it can be embedded in the
Excel/PDF exports without cross-origin restrictions. To prevent the route from
being used as an open proxy (SSRF), it takes **only** a video ID (validated as 11
URL-safe characters) and an allow-listed quality token (e.g. `hqdefault`); the
request URL is built entirely from constants server-side — no user-supplied host
or path is ever fetched.

### GET `/api/download-video?id=<videoId>`
Streams a single video as an MP4 attachment (highest-quality progressive format
— video + audio in one file). Runs on the Node.js runtime and consumes no
YouTube Data API quota (`@distube/ytdl-core` scrapes the watch page). Works best
on a Node.js host; see the download deployment note above.

### POST `/api/process-video`
Fetch detailed information for a single video.

**Request Body:**
```json
{
  "videoId": "dQw4w9WgXcQ"
}
```

**Response:**
```json
{
  "success": true,
  "video": {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "Video Title",
    "thumbnail": "https://...",
    "duration": 213,
    "viewCount": 1000000,
    "uploadDate": "2024-01-01"
  }
}
```

## 📦 Build & Deploy

### Production Build
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Deploy to Vercel (Recommended)
1. Push your code to GitHub
2. Import your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy automatically

> **Note on images:** Next.js Image Optimization is disabled
> (`images.unoptimized: true` in `next.config.ts`). YouTube thumbnails are served
> directly from the CDN, so the app does **not** consume Vercel's metered Image
> Optimization quota — thumbnails keep working in production even on the free tier.

### Deploy to Other Platforms
The application can be deployed to any platform that supports Node.js:
- Netlify
- Railway
- Render
- AWS
- Google Cloud
- Azure

## 🐛 Troubleshooting

### Common Issues

**Issue**: "No videos found" for valid playlist
- **Solution**: Make sure your YouTube API key is set correctly and the API is enabled

**Issue**: "Failed to fetch playlist"
- **Solution**: Check if playlist is public and the URL format is correct

**Issue**: Slow loading for large playlists
- **Solution**: Use paginated view mode for better performance

**Issue**: Videos showing as "Error loading video"
- **Solution**: Some videos may be private, deleted, or geo-restricted

**Issue**: MongoDB connection error
- **Solution**: Ensure MongoDB is running and the connection string is correct. Note that MongoDB is optional.

### Debug Mode
Check the browser console and server logs for detailed error information.

## 🔄 Migration from Django

This application has been migrated from Django/Python to the MERN stack. Key changes:

- **Backend**: Django views → Next.js API routes
- **Frontend**: Django templates → React components
- **Database**: SQLite → MongoDB (optional)
- **YouTube Library**: yt-dlp → ytdl-core + YouTube Data API
- **Styling**: Bootstrap 5 → Tailwind CSS

The core functionality remains the same, with improved performance and modern web standards.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the Repository**
2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit Changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to Branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages
- Add comments for complex logic
- Test thoroughly before submitting
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [YouTube Data API](https://developers.google.com/youtube/v3) - Video data extraction
- [ytdl-core](https://github.com/fent/node-ytdl-core) - YouTube video information
- [MongoDB](https://www.mongodb.com/) - Database
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/curiousbud/YouTube-Playlist-videos-link-Extractor/issues) page
2. Create a new issue with detailed description
3. Include error messages and steps to reproduce

---

**Made with ❤️ using the MERN stack**
