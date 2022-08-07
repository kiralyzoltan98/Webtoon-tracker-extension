//every .1 second, check if the data has changed and if so, update the table
setInterval(function () {
    chrome.storage.sync.get(["webtoonTracker"], function (data) {
        if (data.webtoonTracker) {
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

//create html button on page load under each table last row that calls addRow() on click
document.addEventListener("DOMContentLoaded", function () {
    let tableData = document.getElementById("container");
    let table = tableData.getElementsByTagName("table");
    for (let i = 0; i < table.length; i++) {
        let tableHeader = table[i].getElementsByTagName("thead")[0];
        let tableHeaderText = tableHeader.getElementsByTagName("th")[0].innerText;
        let tableHeaderButton = document.createElement("button");
        tableHeaderButton.innerText = "Add Row";
        tableHeaderButton.onclick = function () {
            addRow(tableHeaderText);
        }
        tableHeader.appendChild(tableHeaderButton);
    }
});

//button that ads a new row to the table
function addRow(tablePressed) {
    let currentTable = 0;
    if (tablePressed === "Manga") {
        currentTable = 1;
    } else if (tablePressed === "Anime") {
        currentTable = 2;
    }
    let tableData = document.getElementById("container");
    let table = tableData.getElementsByTagName("table");
        let tableBody = table[currentTable].getElementsByTagName("tbody")[0];
        let tableHeader = table[currentTable].getElementsByTagName("thead")[0];
        let tableHeaderText = tableHeader.getElementsByTagName("th")[0].innerText;
        let tableRows = tableBody.getElementsByTagName("tr");
        let newRow = tableBody.insertRow(tableRows.length);
        let newCell1 = newRow.insertCell(0);
        let newCell2 = newRow.insertCell(1);
        let newInput1 = document.createElement("input");
        newInput1.type = "text";
        newInput1.value = "";
        newCell1.appendChild(newInput1);
        let newInput2 = document.createElement("input");
        newInput2.type = "text";
        newInput2.value = "";
        newCell2.appendChild(newInput2);
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

//ctrl+s call saveData function prevent default action of ctrl+s
document.addEventListener("keydown", function (e) {
    if (e.keyCode === 83 && e.ctrlKey) {
        e.preventDefault();
        saveData();
    }
});

//call saveData function on click of save button
document.getElementById("save").addEventListener("click", saveData);

//bottom right toast message that says "Saved"
function toast() {
    var x = document.getElementById("snackbar");
    x.className = "show";
    setTimeout(function () {
        x.className = x.className.replace("show", "");
    }, 3000);
}

//function to save data on click of save button
function saveData() {
    toast();
    let data = {};
    let tableData = document.getElementById("container");
    let table = tableData.getElementsByTagName("table");
    //remove empty rows
    for (let i = 0; i < table.length; i++) {
        let tableBody = table[i].getElementsByTagName("tbody")[0];
        let tableRows = tableBody.getElementsByTagName("tr");
        for (let j = 0; j < tableRows.length; j++) {
            let tableCells = tableRows[j].getElementsByTagName("td");
            let tableCellText = tableCells[0].getElementsByTagName("input")[0].value;
            let tableCellValue = tableCells[1].getElementsByTagName("input")[0].value;
            if (tableCellValue === "") {
                tableBody.removeChild(tableRows[j]);
            }
        }
    }
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
    chrome.storage.sync.set({webtoonTracker: data});
}