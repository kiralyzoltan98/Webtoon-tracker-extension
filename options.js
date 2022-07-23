//let table = document.getElementById("table");
let selectedClassName = "current";
const presetButtonColors = ["#3aa757", "#e8453c", "#f9bb2d", "#4688f1"];

// Reacts to a button click by marking the selected button and saving
// the selection
function handleButtonClick(event) {
    // Remove styling from the previously selected color
    let current = event.target.parentElement.querySelector(
        `.${selectedClassName}`
    );
    if (current && current !== event.target) {
        current.classList.remove(selectedClassName);
    }

    // Mark the button as selected
    let color = event.target.dataset.color;
    event.target.classList.add(selectedClassName);
    chrome.storage.sync.set({ color });
}

// Add a button to the page for each supplied color
function constructOptions(buttonColors) {
    chrome.storage.sync.get("color", (data) => {
        let currentColor = data.color;
        // For each color we were provided…
        for (let buttonColor of buttonColors) {
            // …create a button with that color…
            let button = document.createElement("button");
            button.dataset.color = buttonColor;
            button.style.backgroundColor = buttonColor;

            // …mark the currently selected color…
            if (buttonColor === currentColor) {
                button.classList.add(selectedClassName);
            }

            // …and register a listener for when that button is clicked
            button.addEventListener("click", handleButtonClick);
            //page.appendChild(button);
        }
    });

}
chrome.storage.sync.get("webtoonTracker", (data) => {
    let tableData = data.webtoonTracker;

    console.log("wbtdata: ", tableData);

    // Create a table element
    let table = document.createElement("table");

    // Create table row tr element of a table
    let tr = table.insertRow(-1);

    Object.keys(tableData).forEach(key => {
        console.log(key, tableData[key]);
        // Create the table header th element
        let header = document.createElement("th");
        let chHeader = document.createElement("th");
        header.innerHTML = key;
        chHeader.innerHTML = "Chapter";

        // Append columnName to the table row
        tr.appendChild(header);
        tr.appendChild(chHeader);

        // Add the newly created table containing json data
        let el = document.getElementById("table");
        el.innerHTML = "";
        el.appendChild(table);
    });

    Object.keys(tableData).forEach(key => {
        trow = table.insertRow(-1);
        // Adding the data to the table
        Object.keys(tableData[key]).forEach(key2 => {
            let titleCell = trow.insertCell(-1);
            let chapterCell = trow.insertCell(-1);
            titleCell.innerHTML = key2;
            chapterCell.innerHTML = tableData[key][key2];
        })

        // Add the newly created table containing json data
        let el = document.getElementById("table");
        el.innerHTML = "";
        el.appendChild(table);
    });
});

// Initialize the page by constructing the table data
constructOptions(presetButtonColors);