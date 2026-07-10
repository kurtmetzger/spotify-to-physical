import './AlbumCard.css'

function AlbumCard({ album, index }){
    return (
        <div className="albumCard">
            <div className='albumInfo'>
                <h5>{index + 1}.</h5>
                <img className='albumArt' src={album.coverArt || '/no_album_art.png'} alt={album.albumName} />
                <div className='albumDetails'>
                    <div className='albumTitleWrapper'>
                        <h3 className='albumTitle'>{album.albumName}</h3>
                    </div>
                    <h4>{album.artist}</h4>
                    <h4>{album.engagedTracks}/{album.totalTracks} tracks listened</h4>
                    <h4>Match score: {Math.round(album.score *100) / 100}</h4>
                </div>
            </div>
            <div className="purchaseButtons">
                {
                    album.links.bandcamp ? (
                        <a type="button" href={album.links.bandcamp} target="_blank">
                            Bandcamp
                        </a>
                    ) : (
                    <></>
                    )
                }
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