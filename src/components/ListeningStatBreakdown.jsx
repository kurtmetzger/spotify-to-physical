import './ListeningStatBreakdown.css'

function ListeningStatBreakdown({spotifyData}){
    const filtered = spotifyData.filter(entry => 
        entry.master_metadata_track_name !== null && 
        entry.skipped === false && 
        entry.ms_played > 30000
    );

    return(
        <div className='listeningStatBreakdownContainer'>
            <div className='listeningStatBreakdown'>
                <p>Total plays: {filtered.length}</p>
                <p>Artists have recieved a total of ${Number(filtered.length * 0.0004).toFixed(2)} from your listening this year. One new CD or record gets an artist around $2-10 depending on distribution.</p>
                <p>To get the same ammount to artists you would have to buy {Math.round(Number(filtered.length * 0.0004).toFixed(2)/ 10)}-{Math.round(Number(filtered.length * 0.0004).toFixed(2) /2)} CDs or records this year.</p>
                <p>A premium Individual plan of 12.99 a year could buy around 12 CDs a year instead, or roughly 5 vinyl albums.</p>
            </div>
        </div>
        
    )
}

export default ListeningStatBreakdown