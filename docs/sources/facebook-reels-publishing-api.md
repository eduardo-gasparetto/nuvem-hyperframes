# Facebook Reels — Video Specifications (Meta for Developers)

- URL: https://developers.facebook.com/documentation/video-api/guides/reels-publishing
- Read by a subagent (web-fetch) on 2026-10-19; quotes below are the subagent's transcription, not seen directly by the orchestrator. Re-check the page if a value matters.

- Container: ".mp4 (recommended)"
- Aspect ratio: "9 x 16" (error 1363040: "Aspect ratios for videos need to be between 16x9 and 9x16.")
- Resolution: "1080 x 1920 pixels (recommended). Minimum is 540 x 960 pixels"
- Frame rate: "24 to 60 frames per second" (fixed frame rate, progressive scan)
- Duration: "3 to 90 seconds." ("A reel published as a story on a Facebook Page can not exceed 60 seconds.")
- Video: "H.264, H.265 (VP9, AV1 are also supported)", chroma 4:2:0, closed GOP (2-5 seconds)
- Audio: bitrate 128 kbps+, stereo, AAC Low Complexity, 48 kHz
- Not on the page: max file size; cover size (links to https://developers.facebook.com/docs/graph-api/reference/video/thumbnails#Creating).

## Conflict
Meta announcement (2025-06-17, https://about.fb.com/news/2025/06/making-it-easier-create-videos-facebook/): "Reels on Facebook will also not have any length or format restrictions." This contradicts the 3–90 s API limit. The announcement has no numbers; the API doc may lag the product. Dataset stores 90 s (conservative) and flags the conflict.
