
//every second, check if the data has changed and if so, update the table
setInterval(function () {
    chrome.storage.sync.get(["webtoonTracker"], function (data) {
        if (data) {
            updateTable(data.webtoonTracker);
        }
    });
}, 100);

//function to update the table
function updateTable(data) {
    let tableData = document.getElementById("container");
    let table = tableData.getElementsByTagName("table");
    for (let i = 0; i < table.length; i++) {
        let tableBody = table[i].getElementsByTagName("tbody")[0];
        let tableHeader = table[i].getElementsByTagName("thead")[0];
        let tableHeaderText = tableHeader.getElementsByTagName("th")[0].innerText;
        let tableRows = tableBody.getElementsByTagName("tr");
        for (let j = 0; j < tableRows.length; j++) {
            let tableCells = tableRows[j].getElementsByTagName("td");
            let tableCellText = tableCells[0].getElementsByTagName("input")[0].value;
            let tableCellValue = tableCells[1].getElementsByTagName("input")[0].value;
            if (data[tableHeaderText][tableCellText]) {
                tableCells[1].getElementsByTagName("input")[0].value = data[tableHeaderText][tableCellText];
            }
        }
    }
}


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

//call saveData function on click of save button
document.getElementById("save").addEventListener("click", saveData);



//function to save data on click of save button
function saveData() {
    // let json = {
    //     Webtoon: {
    //         write: "1"
    //     },
    //     Manga: {
    //         your: "2"
    //     },
    //     Anime: {
    //         titles: "3"
    //     }
    // }
    // chrome.storage.sync.set({webtoonTracker: json});

    let data = {};
    let tableData = document.getElementById("container");
    let table = tableData.getElementsByTagName("table");
    for (let i = 0; i < table.length; i++) {
        let tableBody = table[i].getElementsByTagName("tbody")[0];
        let tableHeader = table[i].getElementsByTagName("thead")[0];
        let tableHeaderText = tableHeader.getElementsByTagName("th")[0].innerText;
        data[tableHeaderText] = {};
        let tableRows = tableBody.getElementsByTagName("tr");
        for (let j = 0; j < tableRows.length; j++) {
            let tableCells = tableRows[j].getElementsByTagName("td");
            let tableCellText = tableCells[0].getElementsByTagName("input")[0].value;
            let tableCellValue = tableCells[1].getElementsByTagName("input")[0].value;
            data[tableHeaderText][tableCellText] = tableCellValue;
        }
    }
    console.log("data: ", data);
    chrome.storage.sync.set({webtoonTracker: data});
}