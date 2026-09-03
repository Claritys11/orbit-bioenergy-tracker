#!/usr/bin/env bash
# Helper script to convert browser_subagent WebP recordings into MP4 or GIF for QA Demos

set -euo pipefail

INPUT_WEBP="${1:-}"
OUTPUT_MP4="${2:-}"

if [ -z "$INPUT_WEBP" ]; then
  echo "Usage: ./convert-video.sh <input.webp> [output.mp4]"
  exit 1
fi

if [ -z "$OUTPUT_MP4" ]; then
  OUTPUT_MP4="${INPUT_WEBP%.webp}.mp4"
fi

if ! command -v ffmpeg &> /dev/null; then
  echo "ffmpeg is not installed. WebP file remains available at: $INPUT_WEBP"
  exit 0
fi

echo "Converting $INPUT_WEBP to $OUTPUT_MP4..."
ffmpeg -y -i "$INPUT_WEBP" -vcodec libx264 -pix_fmt yuv420p -crf 23 "$OUTPUT_MP4"
echo "Done! QA Demo MP4 video generated at: $OUTPUT_MP4"
