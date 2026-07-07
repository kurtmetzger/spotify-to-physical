function AlbumList({ scoredAlbums }){
    return (
        <div>
            {scoredAlbums.map((album, index) => (
                <div key={album.albumName}>
                    <h2>{index +1}. {album.albumName}</h2>
                    <p>{album.artist}</p>
                </div>
            ))}
        </div>
    )
}

export default AlbumList