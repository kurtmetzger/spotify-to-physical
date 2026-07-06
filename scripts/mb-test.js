require('dotenv').config();
const email = process.env.CONTACT_EMAIL;
const app_name = process.env.APP_NAME;


async function musicBrainzFetchTest(artist, album) {
    const url = `https://musicbrainz.org/ws/2/release/?query=artist:"${artist}" AND release:"${album}"&fmt=json`;
    try{
        const response = await fetch(url, {
            headers: {
                'User-Agent': `${process.env.APP_NAME}/0.1 (${process.env.CONTACT_EMAIL})`
            }
        });

        const data = await response.json();

        //Handles issuees with faulty data
        if (!data.releases || data.releases.length === 0) {
            return { trackCount: null, releaseType: null, links: { bandcamp: null, official: null, discogs: null }} 
        };
        //console.log(data);
        //console.log(data.releases[0]['release-group']);
        const MBID = data.releases[0].id
        const lookupURL = `https://musicbrainz.org/ws/2/release/${MBID}?inc=url-rels&fmt=json`;

        const response2 = await fetch(lookupURL, {
            headers: {
                'User-Agent': `${process.env.APP_NAME}/0.1 (${process.env.CONTACT_EMAIL})`
            }
        });


        const linkData = await response2.json();
        //console.log(linkData);
        //console.log(Object.keys(linkData));
        if (!linkData.relations) {
            return { trackCount: data.releases[0]['track-count'], releaseType: data.releases[0]['release-group']['primary-type'], links: { bandcamp: null, official: null, discogs: null } };
        }

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
};
module.exports = {musicBrainzFetchTest};