import './AlbumList.css'
import AlbumCard from './AlbumCard';

function AlbumList({ scoredAlbums }){
    return (
        <div className="albumList">
            {scoredAlbums.map((album, index) => (
                <AlbumCard key={album.albumname} album={album} index={index}/>
            ))}
        </div>
    )
}

export default AlbumList