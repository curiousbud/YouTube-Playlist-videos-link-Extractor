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
- **Bulk Operations**: Copy all links, titles, or combined data with one click
- **CSV Export**: Export playlist data to CSV format for external use

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
- **Styling**: Tailwind CSS
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
   - **CSV Export**: Download complete playlist data as CSV file

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

## 🏗️ Project Structure

```
YouTube-Playlist-videos-link-Extractor/
├── app/                           # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── extract-playlist/     # Playlist extraction endpoint
│   │   └── process-video/        # Single video processing endpoint
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── components/                    # React components
│   ├── ExtractorForm.tsx         # Main form component
│   └── VideoList.tsx             # Video list component
├── lib/                          # Utility libraries
│   ├── mongodb/                  # MongoDB connection and models
│   │   ├── connection.ts         # Database connection
│   │   └── models/
│   │       └── Link.ts          # Link model
│   └── youtube/                  # YouTube integration
│       └── extractor.ts         # Video extraction logic
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
```

### MongoDB Setup (Optional)
If you want to store link history:

1. Install MongoDB locally or use MongoDB Atlas
2. Update `MONGODB_URI` in `.env.local`
3. The application will automatically create the database and collections

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
