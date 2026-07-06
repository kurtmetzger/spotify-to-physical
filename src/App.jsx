import './App.css'
import { useState } from 'react'
import FileUpload from './components/FileUpload';

function App() {
  const [spotifyData, setSpotifyData] = useState(null);


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
