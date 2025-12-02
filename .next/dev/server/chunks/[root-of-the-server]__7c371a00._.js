module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/mongoose [external] (mongoose, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("mongoose", () => require("mongoose"));

module.exports = mod;
}),
"[project]/lib/mongodb/connection.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
}
const cached = global.mongoose || {
    conn: null,
    promise: null
};
if (!global.mongoose) {
    global.mongoose = cached;
}
async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }
    if (!cached.promise) {
        const opts = {
            bufferCommands: false
        };
        cached.promise = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connect(MONGODB_URI, opts).then((mongoose)=>{
            return mongoose;
        });
    }
    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }
    return cached.conn;
}
const __TURBOPACK__default__export__ = connectDB;
}),
"[project]/lib/mongodb/models/Link.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
const LinkSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["Schema"]({
    link: {
        type: String,
        required: true,
        maxlength: 500
    }
}, {
    timestamps: true
});
const Link = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].models.Link || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].model('Link', LinkSchema);
const __TURBOPACK__default__export__ = Link;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/querystring [external] (querystring, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("querystring", () => require("querystring"));

module.exports = mod;
}),
"[externals]/string_decoder [external] (string_decoder, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("string_decoder", () => require("string_decoder"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/timers [external] (timers, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("timers", () => require("timers"));

module.exports = mod;
}),
"[externals]/vm [external] (vm, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("vm", () => require("vm"));

module.exports = mod;
}),
"[externals]/child_process [external] (child_process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("child_process", () => require("child_process"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/process [external] (process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("process", () => require("process"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[externals]/http2 [external] (http2, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http2", () => require("http2"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[project]/lib/youtube/extractor.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "extractPlaylistId",
    ()=>extractPlaylistId,
    "extractVideoId",
    ()=>extractVideoId,
    "fetchPlaylistInfo",
    ()=>fetchPlaylistInfo,
    "fetchPlaylistVideos",
    ()=>fetchPlaylistVideos,
    "fetchVideoDetails",
    ()=>fetchVideoDetails,
    "isPlaylistUrl",
    ()=>isPlaylistUrl,
    "isValidYouTubeUrl",
    ()=>isValidYouTubeUrl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ytdl$2d$core$2f$lib$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/ytdl-core/lib/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$googleapis$2f$build$2f$src$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/googleapis/build/src/index.js [app-route] (ecmascript)");
;
;
const youtube = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$googleapis$2f$build$2f$src$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["google"].youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});
// Cache for video data
const videoCache = new Map();
const playlistCache = new Map();
const CACHE_DURATION = 3600000; // 1 hour in milliseconds
function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const pattern of patterns){
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}
function extractPlaylistId(url) {
    const match = url.match(/[?&]list=([^&\n?#]+)/);
    return match ? match[1] : null;
}
async function fetchVideoDetails(videoId) {
    // Check cache first
    const cached = videoCache.get(videoId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const info = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ytdl$2d$core$2f$lib$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].getInfo(videoUrl);
        const videoData = {
            url: videoUrl,
            title: info.videoDetails.title || 'Unknown Title',
            thumbnail: info.videoDetails.thumbnails?.[0]?.url || '',
            duration: parseInt(info.videoDetails.lengthSeconds || '0'),
            viewCount: parseInt(info.videoDetails.viewCount || '0'),
            uploadDate: info.videoDetails.uploadDate || ''
        };
        // Cache the result
        videoCache.set(videoId, {
            data: videoData,
            timestamp: Date.now()
        });
        return videoData;
    } catch (error) {
        // Sanitize videoId for logging (only allow alphanumeric, dash, underscore)
        const sanitizedVideoId = videoId.replace(/[^a-zA-Z0-9_-]/g, '');
        console.error('Error fetching video details for video:', sanitizedVideoId, error);
        return {
            url: `https://www.youtube.com/watch?v=${videoId}`,
            title: 'Error loading video',
            thumbnail: '',
            duration: 0,
            viewCount: 0,
            uploadDate: ''
        };
    }
}
async function fetchPlaylistVideos(playlistId) {
    // Check cache first
    const cached = playlistCache.get(playlistId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    try {
        if (!process.env.YOUTUBE_API_KEY) {
            console.error('YouTube API key is not set. Please set YOUTUBE_API_KEY environment variable.');
            return [];
        }
        const videoIds = [];
        let nextPageToken = undefined;
        do {
            const resp = await youtube.playlistItems.list({
                part: [
                    'contentDetails'
                ],
                playlistId: playlistId,
                maxResults: 50,
                pageToken: nextPageToken
            });
            const response = resp.data;
            if (response.items) {
                for (const item of response.items){
                    const videoId = item.contentDetails?.videoId;
                    if (videoId) {
                        videoIds.push(videoId);
                    }
                }
            }
            nextPageToken = response.nextPageToken || undefined;
        }while (nextPageToken)
        // Cache the result
        playlistCache.set(playlistId, {
            data: videoIds,
            timestamp: Date.now()
        });
        return videoIds;
    } catch (error) {
        // Sanitize playlistId for logging (only allow alphanumeric, dash, underscore)
        const sanitizedPlaylistId = playlistId.replace(/[^a-zA-Z0-9_-]/g, '');
        console.error('Error fetching playlist videos for playlist:', sanitizedPlaylistId, error);
        return [];
    }
}
async function fetchPlaylistInfo(playlistId) {
    try {
        if (!process.env.YOUTUBE_API_KEY) {
            console.error('YouTube API key is not set.');
            return null;
        }
        const resp = await youtube.playlists.list({
            part: [
                'snippet',
                'contentDetails'
            ],
            id: [
                playlistId
            ]
        });
        const response = resp.data;
        if (response && response.items && response.items.length > 0) {
            const playlist = response.items[0];
            return {
                title: playlist.snippet?.title || 'Unknown Playlist',
                uploader: playlist.snippet?.channelTitle || 'Unknown',
                videoCount: playlist.contentDetails?.itemCount || 0
            };
        }
        return null;
    } catch (error) {
        // Sanitize playlistId for logging (only allow alphanumeric, dash, underscore)
        const sanitizedPlaylistId = playlistId.replace(/[^a-zA-Z0-9_-]/g, '');
        console.error('Error fetching playlist info for playlist:', sanitizedPlaylistId, error);
        return null;
    }
}
function isValidYouTubeUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\/.+$/;
    return youtubeRegex.test(url);
}
function isPlaylistUrl(url) {
    return url.toLowerCase().includes('playlist') || url.toLowerCase().includes('list=') || url.includes('&list=') || url.includes('?list=');
}
}),
"[project]/app/api/extract-playlist/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mongodb$2f$connection$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/mongodb/connection.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mongodb$2f$models$2f$Link$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/mongodb/models/Link.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$youtube$2f$extractor$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/youtube/extractor.ts [app-route] (ecmascript)");
;
;
;
;
async function POST(request) {
    try {
        const { link } = await request.json();
        if (!link) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Link is required'
            }, {
                status: 400
            });
        }
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$youtube$2f$extractor$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isValidYouTubeUrl"])(link)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Invalid YouTube URL'
            }, {
                status: 400
            });
        }
        // Connect to database
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mongodb$2f$connection$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])();
        // Save link to database
        const newLink = new __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mongodb$2f$models$2f$Link$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"]({
            link
        });
        await newLink.save();
        // Check if it's a playlist or single video
        const isPlaylist = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$youtube$2f$extractor$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isPlaylistUrl"])(link);
        if (isPlaylist) {
            const playlistId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$youtube$2f$extractor$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["extractPlaylistId"])(link);
            if (!playlistId) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'Invalid playlist URL'
                }, {
                    status: 400
                });
            }
            // Fetch playlist info and video IDs
            const [playlistInfo, videoIds] = await Promise.all([
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$youtube$2f$extractor$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fetchPlaylistInfo"])(playlistId),
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$youtube$2f$extractor$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fetchPlaylistVideos"])(playlistId)
            ]);
            if (!videoIds || videoIds.length === 0) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'No videos found in playlist or API key not configured'
                }, {
                    status: 404
                });
            }
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                type: 'playlist',
                playlistInfo,
                videoIds,
                totalVideos: videoIds.length
            });
        } else {
            // Single video
            const videoId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$youtube$2f$extractor$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["extractVideoId"])(link);
            if (!videoId) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'Invalid video URL'
                }, {
                    status: 400
                });
            }
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                type: 'video',
                videoIds: [
                    videoId
                ],
                totalVideos: 1
            });
        }
    } catch (error) {
        console.error('Error in extract-playlist:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to process YouTube link'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__7c371a00._.js.map