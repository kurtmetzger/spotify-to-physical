import './AlbumCard.css'

function AlbumCard({ album, index }){
    return (
        <div className="albumCard">
            <div className='albumInfo'>
                <h5>{index + 1}.</h5>
                <img src={album.coverArt || 'public/no_album_art.png'} alt={album.albumName} />
                <div>
                    <h4>{album.albumName}</h4>
                    <h5>{album.artist}</h5>
                    <p>{album.engagedTracks}/{album.totalTracks} tracks listened</p>
                    <h5>Match score: {Math.round(album.score *100) / 100}</h5>
                </div>
            </div>
            <div className="purchaseButtons">
                <button type="button" disabled>
                    Bandcamp
                </button>
                <button type="button" disabled>
                    Official Site
                </button>
                <button type="button" disabled>
                    Discogs
                </button>
            </div>
        </div>
    )
}

export default AlbumCard