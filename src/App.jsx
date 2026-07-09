import './App.css'
import { useEffect, useState } from 'react'
import FileUpload from './components/FileUpload';
import AlbumList from './components/AlbumList';
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
      <div className='header'>
        <h1>Spotify to Physical</h1>
      </div>
      {
        //Shows total plays if there is data uploaded
        spotifyData && scoredAlbums ? (
          <>
            <h5>Total plays: {spotifyData.length}</h5>
            <h5>Artists have recieved a total of ${Number(spotifyData.length * 0.0004).toFixed(2)} from your listening this year. One new CD or record gets an artist around $2-10 depending on distribution.</h5>
            <h5>To get the same ammount to artists you would have to buy {Math.round(Number(spotifyData.length * 0.0004).toFixed(2)/ 10)}-{Math.round(Number(spotifyData.length * 0.0004).toFixed(2) /2)} CDs or records this year.</h5>
            <h5>A premium Individual plan of 12.99 a year could buy around 12 CDs a year instead, or roughly 5 vinyl albums.</h5>
            <AlbumList scoredAlbums={scoredAlbums}/>
          </>
        ) : (
          <FileUpload onDataLoaded={setSpotifyData} />
        )
      }
    </>
    )  
}

export default App
