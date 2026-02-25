# PWA Icons

This directory contains icons used for the PWA manifest.

## Generating PNG Icons

The `icon.svg` file is the source icon. Generate PNG versions using:

```bash
# Using ImageMagick
convert icon.svg -resize 192x192 icon-192x192.png
convert icon.svg -resize 512x512 icon-512x512.png

# Using sharp (Node.js)
npx sharp-cli -i icon.svg -o icon-192x192.png -w 192 -h 192
npx sharp-cli -i icon.svg -o icon-512x512.png -w 512 -h 512
```

Or use an online tool like [RealFaviconGenerator](https://realfavicongenerator.net/).

## Required Files

| File               | Size     | Purpose                        |
| ------------------ | -------- | ------------------------------ |
| `icon-192x192.png` | 192×192  | Standard PWA icon              |
| `icon-512x512.png` | 512×512  | Splash screen / install prompt |
| `icon.svg`         | Scalable | Source file for generation     |
