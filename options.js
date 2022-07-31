
chrome.storage.sync.get("webtoonTracker", (data) => {
    let tableData = data.webtoonTracker;

    //create object from input data
    let json = {};
    for (let key in tableData) {
        json[key] = {};
        for (let key2 in tableData[key]) {
            json[key][key2] = tableData[key][key2];
        }
    }

    //create save button, ctrl+s to save
    let saveButton = document.createElement("button");
    saveButton.innerText = "Save";
    saveButton.id = "saveButton";
    saveButton.addEventListener("click", async () => {
        let data = await chrome.storage.sync.set({webtoonTracker: json});
        console.log("saved: ", $("#container :input"));
    });
    document.body.appendChild(saveButton);

    Object.keys(tableData).forEach(key => {
        let table = document.getElementById(key);
        let tableBody = document.createElement("tbody");
        let tableHeader = document.createElement("thead");
        tableHeader.innerHTML = `<tr><th>${key}</th></tr>`;
        table.appendChild(tableHeader);
        for (let key2 in tableData[key]) {
            let row = document.createElement("tr");
            let cell = document.createElement("td");
            let input = document.createElement("input");
            input.type = "text";
            input.value = key2;
            input.id = key2;
            cell.appendChild(input);
            row.appendChild(cell);
            cell = document.createElement("td");
            input = document.createElement("input");
            input.type = "text";
            input.value = tableData[key][key2];
            input.id = key2;
            cell.appendChild(input);
            row.appendChild(cell);
            tableBody.appendChild(row);
        }
        table.appendChild(tableBody);
    });
});