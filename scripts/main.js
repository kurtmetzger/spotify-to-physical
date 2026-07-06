require('dotenv').config();
const fs = require('fs');
const { musicBrainzFetchTest } = require('./mb-test');

const testFilePath = './test_data/Streaming_History_Audio_2025.json';

//Timer to avoid overaccessing MusicBrainz
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

fs.readFile(testFilePath, 'utf-8', async (err, jsonString) => {
    if (err) return console.log('Error reading file: ', err);
    
    const data = JSON.parse(jsonString);

    // Removes podcasts, skips, and plays less than 30 seconds
    const filtered = data.filter(entry => 
        entry.master_metadata_track_name !== null && 
        entry.skipped === false && 
        entry.ms_played > 30000
    );

    //Groups count by album
    const result = filtered.reduce((accumulator, entry) => {
        const album = accumulator[entry.master_metadata_album_album_name];
        if (album) {
            album.playCount += 1;
            if (album.trackCounts[entry.master_metadata_track_name]) {
                album.trackCounts[entry.master_metadata_track_name] += 1;
            } else {
                album.trackCounts[entry.master_metadata_track_name] = 1;
            }
        } else {
            accumulator[entry.master_metadata_album_album_name] = {
                artist: entry.master_metadata_album_artist_name,
                playCount: 1,
                tracks: new Set(),
                trackCounts: { [entry.master_metadata_track_name]: 1 }
            }
        }
        accumulator[entry.master_metadata_album_album_name].tracks.add(entry.master_metadata_track_name);
        return accumulator;
    }, {});


        // Score each album and sort
    const scored = Object.entries(result).filter(([albumName, album]) => album.tracks.size > 2).map(([albumName, album]) => {
        // placeholder until MusicBrainz provides real track counts
        const totalTracks = album.tracks.size;
        
        //Grabs the number of tracks listened to
        const engagedTracks = Object.keys(album.trackCounts).length;

        const trackPlayValues = Object.values(album.trackCounts);
            let sum = 0;
            for (let i = 0; i < trackPlayValues.length; i++) {
                sum += trackPlayValues[i];
        }
        const averagePlays = sum / trackPlayValues.length;
        
        const score = (engagedTracks / totalTracks) * averagePlays;
        
        return {
            albumName,
            artist: album.artist,
            score,
            engagedTracks,
            totalTracks,
            playCount: album.playCount,
            playAverage: averagePlays
        };

    }).sort((a, b) => b.score - a.score);

    //console.log('Top 10 albums:', scored.slice(0, 10));
    const top20 = scored.slice(0, 20);

    for (const topAlbum of top20){
        let result = await musicBrainzFetchTest(topAlbum.artist, topAlbum.albumName);
        if (result){
            //console.log('result.trackCount:', result.trackCount);
            //console.log('full result:', result);
            topAlbum.totalTracks = result.trackCount
            //console.log('topAlbum.totalTracks after assignment:', topAlbum.totalTracks);
            //console.log(result);
            topAlbum.releaseType = result.releaseType;
            topAlbum.links = result.links;
            topAlbum.totalTracks = result.trackCount;
            topAlbum.score = (topAlbum.engagedTracks / result.trackCount) * topAlbum.playAverage;
        } else{
            console.log('No link found for: ', topAlbum.artist, topAlbum.albumName);
        }
        await sleep(2000);
    }
    const albums = top20.filter(album => album.releaseType === 'Album');

    //Resort with track counts
    top20.sort((a, b) => b.score - a.score);
    console.log(top20.map(a => ({ albumName: a.albumName, score: a.score, engagedTracks: a.engagedTracks, totalTracks: a.totalTracks})));
});