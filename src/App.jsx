import './App.css'
import { useEffect, useState } from 'react'
import FileUpload from './components/FileUpload';
import AlbumList from './components/AlbumList';
import ListeningStatBreakdown from './components/ListeningStatBreakdown';
import { filterPlays, aggregateAlbums, scoreAlbums } from './utils/scoring';
import {getAlbumLinks, sleep} from './utils/musicbrainz';


function App() {
  const [spotifyData, setSpotifyData] = useState(null);

  const [scoredAlbums, setScoredAlbums] = useState(null);

  const [enrichedAlbums, setEnrichedAlbums] = useState(null);

  const [isLoading, setIsLoading] = useState(null);

  useEffect(() => {
    //pass if there isn't any spotify data yet
    if(!spotifyData) return;
    const filtered = filterPlays(spotifyData);
    const aggregated = aggregateAlbums(filtered);
    const scored = scoreAlbums(aggregated);
    setScoredAlbums(scored);
  }, [spotifyData]);

  useEffect(() => {
    if (!scoredAlbums) return;
    //console.log(scoredAlbums);
  }, [scoredAlbums]);

  useEffect(() => {
    if (!scoredAlbums) return;

    async function enrichAlbums() {
      setIsLoading(true);
      const top20 = scoredAlbums.slice(0, 20);

      for (const topAlbum of top20){
        let result = await getAlbumLinks(topAlbum.artist, topAlbum.albumName);
        if (result){
            //console.log('result.trackCount:', result.trackCount);
            //console.log('full result:', result);
            topAlbum.totalTracks = result.albumData.trackCount
            //console.log('topAlbum.totalTracks after assignment:', topAlbum.totalTracks);
            //console.log(result);
            topAlbum.releaseType = result.albumData.releaseType;
            topAlbum.links = result.albumData.links;
            topAlbum.coverArt = result.albumData.coverArt;
            topAlbum.totalTracks = result.albumData.trackCount;
            topAlbum.score = (topAlbum.engagedTracks / result.albumData.trackCount) * topAlbum.playAverage;
        } else{
            console.log('No link found for: ', topAlbum.artist, topAlbum.albumName);
        }
        await sleep(2000);
      }
      const albums = top20
        .filter(album => album.releaseType === 'Album')
        .sort((a, b) => b.score - a.score);
      //Resort with track counts
      setEnrichedAlbums(albums);
      setIsLoading(false);
    }

    enrichAlbums();
  }, [scoredAlbums]);

  return(
    <>
      <div className='header'>
        <h1>Spotify to Physical</h1>
      </div>
      {
        //Shows total plays if there is data uploaded
        spotifyData && enrichedAlbums ? (
          <>
            <ListeningStatBreakdown spotifyData={spotifyData}/>
            <AlbumList scoredAlbums={enrichedAlbums}/>
          </>
        ) : spotifyData && isLoading ? (
          <p>Finding and scoring albums... this takes about 40 seconds</p>
        ) : (
          <FileUpload onDataLoaded={setSpotifyData} />
        )
      }
    </>
    )  
}

export default App
