function filterPlays(data){
    // Removes podcasts, skips, and plays less than 30 seconds
    const filtered = data.filter(entry => 
        entry.master_metadata_track_name !== null && 
        entry.skipped === false && 
        entry.ms_played > 30000
    );
    return filtered;
}

function aggregateAlbums(filtered){
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
    return result;
}

function scoreAlbums(result){
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
    return scored;
}

export { filterPlays, aggregateAlbums, scoreAlbums}