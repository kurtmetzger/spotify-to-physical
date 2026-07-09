import './FileUpload.css'

function FileUpload({ onDataLoaded }){
    function handleFileChange(event){
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = JSON.parse(e.target.result);
            onDataLoaded(data);
        }
        reader.readAsText(file);
    }

    return(
        <div className="fileUploadContainer">
            <div className="fileUpload">
                {/* -- TODO: replace this directions link with a page of my own. */}
                <p>To get your results, upload a JSON of your spotify listening history. Not sure how to get this? Follow the instructions <a href='https://explorify.link/instructions'>here</a></p>
                <input type ="file" accept=".json" onChange={handleFileChange} />
            </div>
        </div>
    )
}

export default FileUpload

