import { cache } from "react";
import { getCachedAlbum, setCachedAlbum } from "./cache";

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

        return { 
            releases: data.releases, 
            releaseGroupMBID: primaryRelease['release-group'].id, 
            trackCount: primaryRelease['track-count'], 
            releaseType: primaryRelease['release-group']['primary-type'] 
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
    }    
}
async function getPhysicalReleaseData(releases, visitedReleases, artistHomepage){
    const physicalReleases = releases.filter(release => 
        release.media?.[0]?.format === 'Vinyl' || 
        release.media?.[0]?.format === 'CD'
    );

    const americanReleases = physicalReleases.filter(release => 
        release.country === 'US'
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

        const artistHomepageHostname = artistHomepage ? new URL(artistHomepage).hostname : null;

        if (!artistHomepageHostname) {
            return { official: null, visitedMBID: nextRelease.id };
        }

        

        const official = releaseData.relations.find(rel => 
            rel.type === 'purchase for mail-order' &&
            rel.url.resource.includes(artistHomepageHostname)); 
        //If official exists, use that as url. Otherwise, null
        const officialURL = official ? official.url.resource : null;

        return {official: officialURL, visitedMBID: nextRelease.id};
    } catch (err) {
        console.log('Error: ', err);
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
                trackCount: searchResult.trackCount,
                releaseType: searchResult.releaseType,
                releases: searchResult.releases,
                releaseGroupMBID: searchResult.releaseGroupMBID,
                coverArt: null,
                artistHomepage: null,
                visitedDigitalReleases: [],
                visitedPhysicalReleases: [],
                links: {bandcamp: null, official: null, discogs: null}
            };
        }
        if (!allLinksResolved(cached.links)){
            
            if (!cached?.links.discogs){
                const rgData = await getReleaseGroupData(cached.releaseGroupMBID);
                cached.links.discogs = rgData.discogs;
                cached.coverArt = rgData.coverArt;
                cached.artistHomepage = rgData.artistHomepage;
            }

            if (!cached?.links.bandcamp){
                const digitalData = await getDigitalReleaseData(cached.releases, cached.visitedDigitalReleases);
                cached.links.bandcamp = digitalData.bandcamp;
                if (digitalData.visitedMBID){
                    cached.visitedDigitalReleases.push(digitalData.visitedMBID);
                }
            }

            if (!cached?.links.official){
                const physicalData = await getPhysicalReleaseData(cached.releases, cached.visitedPhysicalReleases, cached.artistHomepage);
                cached.links.official = physicalData.official;
                if (physicalData.visitedMBID){
                    cached.visitedPhysicalReleases.push(physicalData.visitedMBID);
                }
            }

            setCachedAlbum(artist, album, cached);
        }


        return cached;
    } catch (err){
        console.log('Error:', err);
    }
}