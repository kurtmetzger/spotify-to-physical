import staticCache from '../data/albumCache.json'

function getCachedAlbum(artist, album){
    const local = localStorage.getItem('albumCache');
    if (local){
        const localData = JSON.parse(local);
        if (localData[artist]?.[album]){
            return localData[artist][album];
        }
    }

    if  (staticCache[artist]?.[album]){
        return staticCache[artist][album];
    }
    return null;
}

function setCachedAlbum(artist, album, data){
    const local = localStorage.getItem('albumCache');
    const localData = local ? JSON.parse(local) : {};

    if (!localData[artist]){
        localData[artist] = {}
    }
    localData[artist][album] = data

    localStorage.setItem('albumCache', JSON.stringify(localData));
}

export { getCachedAlbum, setCachedAlbum };