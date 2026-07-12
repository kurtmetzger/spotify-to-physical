export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function getAlbumLinks(artist, album) {
    const url = `https://musicbrainz.org/ws/2/release/?query=artist:"${artist}" AND release:"${album}"&fmt=json`;
    try{
        const response = await fetch(url);

        const data = await response.json();

        //Handles issuees with faulty data
        if (!data.releases || data.releases.length === 0) {
            
            return { trackCount: null, releaseType: null, links: { bandcamp: null, official: null, discogs: null }} 
        };

        const physicalReleases = data.releases.filter(release => 
            release.media?.[0]?.format === 'Vinyl' || 
            release.media?.[0]?.format === 'CD'
        );
        const targetPhysical = physicalReleases.at(-1).id || data.releases[0].id;
        const lastLookupURL = `https://musicbrainz.org/ws/2/release/${targetPhysical}?inc=url-rels&fmt=json`;
        const lastResponse = await fetch(lastLookupURL);
        const lastData = await lastResponse.json();
        console.log('Last release relations:', lastData.relations?.map(r => ({ type: r.type, url: r.url?.resource })));
        //console.log(data);
        //console.log(data.releases[0]['release-group']);
        //TODO: Look into ensuring same release as on spotify (double check track number, iterate for a release on offficial store)
        //TODO: If first entry doesn't have bandcamp, look for digital release.
        const MBID = data.releases[0].id
        const lookupURL = `https://musicbrainz.org/ws/2/release/${MBID}?inc=url-rels&fmt=json`;

        const response2 = await fetch(lookupURL);


        const linkData = await response2.json();
        //console.log(linkData);
        //console.log(Object.keys(linkData));
        if (!linkData.relations) {
            return { trackCount: data.releases[0]['track-count'], releaseType: data.releases[0]['release-group']['primary-type'], links: { bandcamp: null, official: null, discogs: null } };
        }

        //console.log(`Relations for ${artist} - ${album}:`, linkData.relations);
        //console.log('artist MBID:', data.releases[0]['artist-credit'][0].artist.id);
        //linkData.relations.forEach(rel => console.log(rel.type, rel.url?.resource));

        //linkData.relations.forEach(rel => console.log(rel.type, rel.url));

        //Checks if bancamp, an official website, or discog link exists
        const bandcamp = linkData.relations.find(rel => rel.url.resource.includes('bandcamp'));
        //If bancamp exists, use that as url. Otherwise, null
        const bandcampURL = bandcamp ? bandcamp.url.resource : null;

        const officialSite = linkData.relations.find(rel => rel.type === 'official homepage');
        //If official site exists, use that as url. Otherwise, null
        const officialSiteURL = officialSite ? officialSite.url.resource : null;

        const discogs = linkData.relations.find(rel => rel.type.includes('discogs'));
        //If discogs exists, use that as url. Otherwise, null
        const discogsURL = discogs ? discogs.url.resource : null;

        const links = {
            bandcamp: bandcampURL,
            official: officialSiteURL,
            discogs: discogsURL
        };

        return {
            trackCount: data.releases[0]['track-count'],
            releaseType: data.releases[0]['release-group']['primary-type'],
            links
        }
    } catch (err){
        console.log('Error:', err);
    }
}