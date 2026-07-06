import './App.css'
import { useEffect, useState } from 'react'
import FileUpload from './components/FileUpload';
import { filterPlays, aggregateAlbums, scoreAlbums } from './utils/scoring';


function App() {
  const [spotifyData, setSpotifyData] = useState(null);

  const [scoredAlbums, setScoredAlbums] = useState(null);

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
    console.log(scoredAlbums);
  }, [scoredAlbums]);

  return(
    <>
      <h1>Spotify to Physical</h1>
      {
        //Shows total plays if there is data uploaded
        spotifyData ? (
          <h5>Total plays: {spotifyData.length}</h5>
        ) : (
          <FileUpload onDataLoaded={setSpotifyData} />
        )
      }
    </>
    )  
}

export default App
