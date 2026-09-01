# Spotify to Physical

**[Try it live →](https://spotify-to-physical.netlify.app/)**

A tool for moving away from streaming on Spotify, but not knowing where to start. Upload your Spotify listening history adnd find links to purchase albums on Discogs, Bandcamp, or directly from the artist, all with your data staying 100% client side.

## How it works

Spotify lets you export your full listening history as a JSON file. This tool reads that file, scores your albums based on how much of each one you've actually heard and how often, and surfaces the ones most worth buying.

The scoring rewards albums where you've heard an entire album often. An album you listen to all the tracks 3 or 4 times will likely score higher than an album where you've heard one track 50 times.

The app then searches [MusicBrainz](https://musicbrainz.org/) in order to find the relevant information, then saves results in your localStorage of your browser so it can easily find that data again without having to wait for MusicBrainz's request limit.

## Your data never leaves your browser

Everything is processed client-side. Your listening history is never uploaded to any server. Close the tab and it's gone.

## How to export your Spotify data

1. Go to [Spotify Privacy Settings](https://www.spotify.com/account/privacy/)
2. Scroll to "Download your data"
3. Select **Extended streaming history** only
4. Confirm via the email Spotify sends you
5. Wait 1–5 days for the download link
6. Upload the JSON file to this tool

## Buy links

For each album the tool looks up:
- **Bandcamp** — direct artist support
- **Official store** — artist or label store from official website
- **Discogs** — finding physical releases of everything else

Links are sourced from [MusicBrainz](https://musicbrainz.org/), an open music encyclopedia. Coverage varies — if a link is missing for an artist you know has a Bandcamp, consider [adding it to MusicBrainz](https://musicbrainz.org/doc/How_to_Add_URLs) to improve the tool for everyone.

## Built with

- React + Vite
- MusicBrainz API
- Cover Art Archive
- localStorage for progressive link caching

## Run locally

```bash
git clone https://github.com/kurtmetzger/spotify-to-physical.git
cd spotify-to-physical
npm install
npm run dev
```
