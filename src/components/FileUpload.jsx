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
        <div className="fileUpload">
            <div>
                <input type ="file" accept=".json" onChange={handleFileChange} />
            </div>
        </div>
    )
}

export default FileUpload

