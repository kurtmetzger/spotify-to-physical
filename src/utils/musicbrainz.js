import { cache } from "react";
import { getCachedAlbum, setCachedAlbum, setCachedArtist } from "./cache";

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function searchRelease(artist, album){
    const url = `https://musicbrainz.org/ws/2/release/?query=artist:"${artist}" AND release:"${album}"&fmt=json`;

    try{
        const response = await fetch(url);

        const data = await response.json();

        if (!data.releases || data.releases.length === 0) {
            return null;
        }

        const officialReleases = data.releases.filter(r => r.status !== 'Bootleg');
        const primaryRelease = officialReleases[0] || data.releases[0];
        const correctReleaseGroupMBID = primaryRelease['release-group'].id;

        const filteredRelease = data.releases.filter(release =>
            release['release-group']?.id === correctReleaseGroupMBID
        );

        return { 
            releases: filteredRelease, 
            releaseGroupMBID: correctReleaseGroupMBID, 
            trackCount: primaryRelease['track-count'], 
            releaseType: primaryRelease['release-group']['primary-type'],
            artistMBID: primaryRelease['artist-credit'][0].artist.id
        };
    } catch (err){
        console.log('Error:', err);
    }
}
async function getReleaseGroupData(releaseGroupMBID){
    const releaseGroupEndpoint = `https://musicbrainz.org/ws/2/release-group/${releaseGroupMBID}?inc=url-rels&fmt=json`
    const coverArt = `https://coverartarchive.org/release-group/${releaseGroupMBID}/front`;
    
    try{
        const releaseGroupResponse = await fetch(releaseGroupEndpoint);
        const releaseGroupData = await releaseGroupResponse.json();

        if (!releaseGroupData.relations){
            return {discogs: null, coverArt, artistHomepage: null}
        }
        
        const officialSite = releaseGroupData.relations.find(rel => rel.type === 'official homepage');
        const officialSiteURL = officialSite ? officialSite.url.resource : null;

        const discogs = releaseGroupData.relations.find(rel => rel.type.includes('discogs'));
        //If discogs exists, use that as url. Otherwise, null
        const discogsURL = discogs ? discogs.url.resource : null;

        console.log('Release group relations:', releaseGroupData.relations?.map(r => ({ type: r.type, url: r.url?.resource })));

        return { 
            discogs: discogsURL, 
            coverArt: coverArt,
            artistHomepage: officialSiteURL
        };

    } catch (err){
        console.log('Error: ', err);
        return null;
    }
}
async function getDigitalReleaseData(releases, visitedReleases){
    const digitalReleases = releases.filter(release => 
        release.media?.[0]?.format === 'Digital Media'
    );

    //Returns most recent releases first
    digitalReleases.sort((a, b) => {
        if (!a.date) return 1;  // push missing dates to bottom
        if (!b.date) return -1;
        return new Date(b.date) - new Date(a.date); // most recent first
    });

    //Finds first item in digitalReleases not in visitedReleases
    const visitedSet = new Set(visitedReleases);
    const nextRelease = digitalReleases.find(release=> !visitedSet.has(release.id));
    if (!nextRelease){
        return {bandcamp: 'NONE', visitedMBID: null}
    }

    try{
        const lookupURL = `https://musicbrainz.org/ws/2/release/${nextRelease.id}?inc=url-rels&fmt=json`;
        const response = await fetch(lookupURL);
        const releaseData = await response.json();

        if (!releaseData.relations) {
            return { bandcamp: null, visitedMBID: nextRelease.id };
        }


        const bandcamp = releaseData.relations.find(rel => rel.url.resource.includes('bandcamp.com'));
        //If bancamp exists, use that as url. Otherwise, null
        const bandcampURL = bandcamp ? bandcamp.url.resource : null;

        return {bandcamp: bandcampURL, visitedMBID: nextRelease.id};
    } catch (err) {
        console.log('Error: ', err);
        return null;
    }    
}
async function getPhysicalReleaseData(releases, visitedReleases, artistHomepage){

    // TEMP: force specific release for testing finding official site
    //lookupURL must be commented out later for this to work
    //const testMBID = 'b4869afc-1b66-4a7b-b532-454cc4265157';
    //const lookupURL = `https://musicbrainz.org/ws/2/release/${testMBID}?inc=url-rels&fmt=json`;

    const physicalReleases = releases.filter(release => 
        release.media?.[0]?.format === '12" Vinyl' || 
        release.media?.[0]?.format === 'CD'
    );

    const americanReleases = physicalReleases.filter(release => 
        release.country === 'US' || release.country === "XW"
    );

    //Returns most recent releases first
    americanReleases.sort((a, b) => {
        if (!a.date) return 1;  // push missing dates to bottom
        if (!b.date) return -1;
        return new Date(b.date) - new Date(a.date); // most recent first
    });

    //Finds first item in physicalReleases not in visitedReleases
    const visitedSet = new Set(visitedReleases);
    const nextRelease = americanReleases.find(release=> !visitedSet.has(release.id));


    console.log('American releases:', americanReleases.map(r => r.id));
    console.log('Visited releases:', visitedReleases);
    console.log('Visited set:', [...visitedSet]);
    console.log('Next unvisited:', nextRelease?.id);

    if (!nextRelease){
        return {official: 'NONE', visitedMBID: null}
    }

    try{
        const lookupURL = `https://musicbrainz.org/ws/2/release/${nextRelease.id}?inc=url-rels&fmt=json`;
        const response = await fetch(lookupURL);
        const releaseData = await response.json();

        if (!releaseData.relations) {
            return { official: null, visitedMBID: nextRelease.id };
        }

        //Just grabs the main part of the url to see if the store page is under the larger umbrella. 
        // This filters for links like "store.georgeharrison.com" that don't match exactly
        const artistHomepageHostname = artistHomepage 
            ? new URL(artistHomepage).hostname.replace('www.', '') 
            : null;

        if (!artistHomepageHostname) {
            return { official: null, visitedMBID: nextRelease.id };
        }

        console.log('Physical release relations for check:', 
            releaseData.relations?.map(r => ({ type: r.type, url: r.url?.resource }))
        );
        console.log('Matching against hostname:', artistHomepageHostname);


        const official = releaseData.relations.find(rel => 
            rel.type === 'purchase for mail-order' &&
            rel.url.resource.includes(artistHomepageHostname)); 
        //If official exists, use that as url. Otherwise, null
        const officialURL = official ? official.url.resource : null;

        return {official: officialURL, visitedMBID: nextRelease.id};
    } catch (err) {
        console.log('Error: ', err);
        return null;
    }      
}
async function getArtistData(artistMBID){
    const artistPageURL = `https://musicbrainz.org/ws/2/artist/${artistMBID}?inc=url-rels&fmt=json`;

    try{
        const response = await fetch(artistPageURL);

        if (!response.ok){
            console.log('Request dailed with status:', response.status);
            return null;
        }

        const data = await response.json();

        if (!data.relations) return { artistHomepage: null };

        const officialSite = data.relations.find(rel => rel.type === 'official homepage');
        const artistHomepage = officialSite ? officialSite.url.resource : null;
        
        return {artistHomepage};
        
    } catch (err){
        console.log('Error:', err);
        return null;
    }
}

export async function getAlbumLinks(artist, album) {

    function isResolved(link) {
        return link !== null;
    }

    function allLinksResolved(links) {
        return isResolved(links.bandcamp) && 
                isResolved(links.official) && 
                isResolved(links.discogs);
        }

    try{
        let cached = getCachedAlbum(artist, album);

        if (!cached){
            const searchResult = await searchRelease(artist, album);
            if (!searchResult) return null;
            cached = {
                artistData: {
                    artistMBID: searchResult.artistMBID,
                    artistHomepage: null
                },
                albumData: {
                    trackCount: searchResult.trackCount,
                    releaseType: searchResult.releaseType,
                    releases: searchResult.releases,
                    releaseGroupMBID: searchResult.releaseGroupMBID,
                    coverArt: null,
                    visitedDigitalReleases: [],
                    visitedPhysicalReleases: [],
                    links: {bandcamp: null, official: null, discogs: null}
                }
            };
        }
        if (!allLinksResolved(cached.albumData.links)){

            if (!cached?.artistData.artistHomepage) {
                const artistData = await getArtistData(cached.artistData.artistMBID);
                if (artistData !== null){
                     cached.artistData.artistHomepage = artistData.artistHomepage || 'NONE';
                setCachedArtist(artist, {artistMBID: cached.artistData.artistMBID, artistHomepage: cached.artistData.artistHomepage})
                }
            }
            
            if (!cached?.albumData?.links.discogs){
                const rgData = await getReleaseGroupData(cached.albumData.releaseGroupMBID);
                if (rgData !== null){
                    cached.albumData.links.discogs = rgData.discogs;
                    cached.albumData.coverArt = rgData.coverArt;
                }
            }

            if (!cached?.albumData?.links.bandcamp){
                const digitalData = await getDigitalReleaseData(cached.albumData.releases, cached.albumData.visitedDigitalReleases);
                if (digitalData !== null){
                    cached.albumData.links.bandcamp = digitalData.bandcamp;
                    if (digitalData.visitedMBID){
                        cached.albumData.visitedDigitalReleases.push(digitalData.visitedMBID);
                    }
                }
               
            }

            if (!cached?.albumData?.links.official){
                const physicalData = await getPhysicalReleaseData(cached.albumData.releases, cached.albumData.visitedPhysicalReleases, cached.artistData.artistHomepage);
                if (physicalData !== null){
                    cached.albumData.links.official = physicalData.official;
                    if (physicalData.visitedMBID){
                        cached.albumData.visitedPhysicalReleases.push(physicalData.visitedMBID);
                    }
                }
                
            }

            setCachedAlbum(artist, album, cached.albumData);
        }


        return cached;
    } catch (err){
        console.log('Error:', err);
    }
}