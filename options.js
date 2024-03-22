//TODO: Search tru users browser history and get all the previous urls and add them to the table with the highest chapter number (jump button as well).
//TODO: 4) Make the regex so it will work with chapter/rész/epizód, and not only dashes [-] between the title words but underscores as well [_].

// Make a column with a tick box that represents if the series is completed or not.
// Create a button that will toggle hide/show the completed series.

/*
Features:
 - Data structure change
 - Button to open current page
 - Button to open next page
 - Import / Export functionality with support for old data format
 - Reduced js errors
*/

//every .1 second, check if the data has changed and if so, update the table

const defaultMangaSeeURL = "https://mangasee123.com/404"

setInterval(function () {
    chrome.storage.sync.get(["webtoonTracker"], function (data) {
        if (data.webtoonTracker) {
            updateTable(data.webtoonTracker)
        }
    })
}, 100)

setInterval(function () {
    let open = document.getElementById("open")
    if (open) {
        open.onclick = function () {
            chrome.tabs.create({ url: "options.html" })
        }
    }
}, 1000)

//function to update the table
function updateTable(data) {
    let tableData = document.getElementById("container")
    if (!tableData) {
        return
    }
    let tables = tableData.getElementsByTagName("table")

    for (let i = 0; i < tables.length; i++) {
        let table = tables[i]
        let tableBody = table.getElementsByTagName("tbody")[0]
        let tableHeader = table.getElementsByTagName("thead")[0]
        let tableHeaderText = tableHeader.getElementsByTagName("th")[0].innerText
        let tableRows = tableBody.getElementsByTagName("tr")

        for (let j = 0; j < tableRows.length; j++) {
            let row = tableRows[j]
            let titleCell = row.cells[0].getElementsByTagName("input")[0]
            let chapterCell = row.cells[1].getElementsByTagName("input")[0]
            let openCurrentButton = row.cells[2].getElementsByTagName("button")[0]
            let openNextButton = row.cells[3].getElementsByTagName("button")[0]

            let title = titleCell.value

            if (data[tableHeaderText] && data[tableHeaderText][title]) {
                let entry = data[tableHeaderText][title]
                chapterCell.value = entry.currentChapter // Set the current chapter

                // Configure the Open button to open the next chapter URL
                openCurrentButton.onclick = function () {
                    chrome.tabs.create({ url: entry.currentChapterURL })
                }

                // Configure the Open button to open the next chapter URL
                openNextButton.onclick = function () {
                    chrome.tabs.create({ url: entry.nextChapterURL })
                }
            }
        }
    }
}

const textInfo =
    '<b>How to use this extension:</b><br>1. Click the "Add Row" button to add a new row to the table.' +
    "<br>2. Enter the name of the webtoon/manga/anime you want to track in the first cell of the row." +
    "<br>3. Enter the number of chapters you'r currently at in the second cell of the row." +
    "<br>4. Press Ctrl + s to save the changes." +
    "<br><b>Thats it!</b> The next time you navigate to a webtoon/manga/anime page, the extension will automatically update the table with the number of chapters you're currently at. (if it's greater than the number you entered)" +
    "<br><br>Made by: <b>Király Zoltán</b>"

//create bottom right circle information icon that displays info text on hover
function createInfoElement() {
    let infoText = document.createElement("div")
    infoText.id = "infoText"
    infoText.classList.add("infoText")
    infoText.innerHTML = textInfo
    infoText.style.display = "none"
    document.body.appendChild(infoText)

    let info = document.createElement("div")
    info.classList.add("info")
    info.innerHTML = "ⓘ"
    info.addEventListener("click", function () {
        if (infoText.style.display === "none") {
            infoText.style.display = "block"
        } else {
            infoText.style.display = "none"
        }
    })
    document.body.appendChild(info)
}

// create an export button that will export the data to a json file and download it
function createExportButton() {
    let exportButton = document.createElement("button")
    exportButton.id = "export"
    exportButton.innerHTML = "Export"
    exportButton.onclick = function () {
        chrome.storage.sync.get(["webtoonTracker"], function (data) {
            let json = JSON.stringify(data.webtoonTracker)
            let blob = new Blob([json], { type: "application/json" })
            let url = URL.createObjectURL(blob)
            let a = document.createElement("a")
            a.href = url
            a.download = "webtoonTracker.json"
            a.click()
        })
    }
    document.body.appendChild(exportButton)
}

// create an import button that will import the data from a json file and save it to the storage.
// first ask if we want to overwrite the current data or not.
function createImportButton() {
    let importButton = document.createElement("button")
    importButton.id = "import"
    importButton.innerHTML = "Import"
    importButton.onclick = function () {
        let input = document.createElement("input")
        input.type = "file"
        input.accept = ".json"
        input.onchange = function (e) {
            if (!confirm("Do you want to overwrite the current data with the imported data?")) {
                return
            }
            let file = e.target.files[0]
            let reader = new FileReader()
            reader.onload = function () {
                let data = JSON.parse(reader.result)
                let convertedData = convertDataFormat(data)
                chrome.storage.sync.set({ webtoonTracker: convertedData }, function () {
                    console.log("Data imported:", convertedData)
                })
            }
            reader.readAsText(file)
            // refresh the table with a reload.
            window.location.reload()
        }
        input.click()
    }
    document.body.appendChild(importButton)
}

// Function to check and convert data from old format
function convertDataFormat(data) {
    Object.keys(data).forEach(category => {
        Object.keys(data[category]).forEach(title => {
            // If the value is a string, it's in the old format
            if (typeof data[category][title] === "string") {
                data[category][title] = {
                    currentChapter: data[category][title],
                    currentChapterURL: "", // Leaving URL fields empty as per requirement
                    nextChapterURL: "",
                }
            }
        })
    })
    return data
}

// Function to add a row dynamically
function addDynamicRow(tableId) {
    let table = document.getElementById(tableId)
    let newRowAdded = false // Flag to check if new row is added

    const addRowIfNeeded = () => {
        let lastRowInputs = table.rows[table.rows.length - 1].getElementsByTagName("input")
        if (Array.from(lastRowInputs).some(input => input.value !== "") && !newRowAdded) {
            addDynamicRow(tableId) // Add new row
            newRowAdded = true
        }
    }

    // Add initial row
    addRowToTable(table, addRowIfNeeded)
}

function addRowToTable(table, addRowIfNeeded) {
    // Ensure we are working with the table's tbody
    let tableBody = table.getElementsByTagName("tbody")[0]
    if (!tableBody) {
        tableBody = table.createTBody()
    }

    let newRow = tableBody.insertRow(-1) // Add at the end of the tbody

    // Add two cells with input fields (as in your existing code)
    for (let i = 0; i < 2; i++) {
        let cell = newRow.insertCell(i)
        let input = createInput("text", "left", "100%")
        cell.appendChild(input)

        // Consistent styling
        cell.style.width = i === 0 ? "85%" : "15%"

        // Add event listener for dynamic addition if needed
        input.addEventListener("input", addRowIfNeeded)
    }

    //place the open buttons in a for loop as well.
    for (let i = 2; i < 4; i++) {
        let cell = newRow.insertCell(i)
        let openButton = document.createElement("button")
        openButton.textContent = i === 2 ? "Current" : "Next"
        openButton.classList.add("disabled") // Add class for styling
        openButton.disabled = true // Disable the button by default
        cell.appendChild(openButton)
    }

    // Adjust the column span for headers if needed
    let tableHeader = table.getElementsByTagName("thead")[0]
    if (tableHeader) {
        let headerCells = tableHeader.getElementsByTagName("th")
        for (let cell of headerCells) {
            cell.colSpan = 3
        }
    }
}

// Use this updated addRow function for button click events
document.addEventListener("DOMContentLoaded", function () {
    if (!document.getElementById("add0")) {
        return
    }
    document.getElementById("add0").addEventListener("click", () => addRow("Webtoon"))
    document.getElementById("add1").addEventListener("click", () => addRow("Manga"))
    document.getElementById("add2").addEventListener("click", () => addRow("Anime"))
})

// Map table names to their indexes
const tableIndexes = {
    Webtoon: 0,
    Manga: 1,
    Anime: 2,
}

// Helper function to create and style input elements
function createInput(type, textAlign, width) {
    let input = document.createElement("input")
    input.type = type
    input.value = ""
    input.style.width = width
    input.style.textAlign = textAlign
    return input
}

// Button function to add a new row to the table
function addRow(tablePressed) {
    let currentTable = tableIndexes[tablePressed]
    let table = document.getElementById("container").getElementsByTagName("table")[currentTable]

    // Call the addRowToTable function to add a row
    addRowToTable(table, () => {})
}

chrome.storage.sync.get("webtoonTracker", function (data) {
    let tableData = data.webtoonTracker
    console.log({ tableData })

    // Check if data exists
    if (!tableData) {
        console.log("No data found.")
        return
    }

    Object.keys(tableData).forEach(category => {
        let table = document.getElementById(category)
        if (!table) {
            return
        }
        let tableBody = table.getElementsByTagName("tbody")[0] || table.createTBody()
        let tableHeader = table.getElementsByTagName("thead")[0]

        // Create header if it doesn't exist
        if (!tableHeader) {
            tableHeader = document.createElement("thead")
            table.appendChild(tableHeader)
        }

        tableHeader.innerHTML = `<tr><th colspan="3">${category}</th></tr>`

        let entries = Object.entries(tableData[category])
        if (entries.length === 0) {
            // Add an empty row if no entries
            addRowToTable(table, () => {})
        } else {
            entries.forEach(([title, entry], index) => {
                let row = tableBody.insertRow()
                addCell(row, title, index % 2 === 0)
                addCell(row, entry.currentChapter, index % 2 === 0, "right")

                // Add Open button cell
                let openCell = row.insertCell(2)
                let openCurrentButton = document.createElement("button")
                openCurrentButton.textContent = "Current"
                openCurrentButton.classList.add("open-button")

                // Add Open Next button cell
                let openNextCell = row.insertCell(3)
                let openNextButton = document.createElement("button")
                openNextButton.textContent = "Next"
                openNextButton.classList.add("open-button")

                //Try to make a get request to the url and if the response has a html element with the id of "TopPage" then enable the button
                //otherwise disable the button

                chrome.runtime.sendMessage({ action: "checkChapter", url: entry.nextChapterURL }, function (response) {
                    if (response.success) {
                        // Now parse the HTML text with DOMParser
                        let parser = new DOMParser()
                        let doc = parser.parseFromString(response.html, "text/html")
                        let topPage = doc.getElementById("TopPage")

                        if (topPage) {
                            // Logic for when topPage exists
                            openNextButton.classList.remove("disabled")
                            openNextButton.disabled = false
                        } else {
                            // Logic for when topPage does not exist
                            openNextButton.classList.add("disabled")
                            openNextButton.disabled = true
                        }
                    } else {
                        console.error(response.error)
                        // Handle error
                    }
                })

                openCurrentButton.onclick = function () {
                    chrome.tabs.create({ url: entry.currentChapterURL })
                }
                openNextButton.onclick = function () {
                    chrome.tabs.create({ url: entry.nextChapterURL })
                }
                openCell.appendChild(openCurrentButton)
                openNextCell.appendChild(openNextButton)
            })
        }
    })
})

//Create a refresh button that will try all the disabled buttons and enable them if the response body has a html element with the id of "TopPage"

// Function to add a cell to the row
function addCell(row, value, isEven, textAlign = "left") {
    let cell = row.insertCell()
    let input = document.createElement("input")
    input.type = "text"
    input.value = value
    input.style.width = "100%"
    input.style.textAlign = textAlign
    cell.style.width = textAlign === "left" ? "85%" : "15%"
    cell.appendChild(input)

    if (isEven) {
        input.classList.add("input-even")
    }
    if (document.getElementById("infoText") === null) {
        createInfoElement()
    }
    if (document.getElementById("export") === null) {
        createExportButton()
    }
    if (document.getElementById("import") === null) {
        createImportButton()
    }
}

//ctrl+s call saveData function prevent default action of ctrl+s
document.addEventListener("keydown", function (e) {
    if (e.keyCode === 83 && e.ctrlKey) {
        e.preventDefault()
        saveData()
    }
})

//bottom right toast message that says "Saved"
function toast() {
    var x = document.getElementById("snackbar")
    x.className = "show"
    setTimeout(function () {
        x.className = x.className.replace("show", "")
    }, 3000)
}

//function to save data on click of save button
async function saveData() {
    toast() // Display the "Saved" toast message

    //get the current data from the storage
    let currentData = await new Promise((resolve, reject) => {
        chrome.storage.sync.get(["webtoonTracker"], function (result) {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError))
            } else {
                resolve(result.webtoonTracker)
            }
        })
    })

    let data = {} // Object to store the updated data
    let tables = document.getElementById("container").getElementsByTagName("table")

    for (let i = 0; i < tables.length; i++) {
        let table = tables[i]
        let tableHeader = table.getElementsByTagName("thead")[0]
        let category = tableHeader.getElementsByTagName("th")[0].innerText // Get the category (Webtoon, Manga, Anime)
        data[category] = {} // Initialize an empty object for each category

        let rows = table.getElementsByTagName("tbody")[0].getElementsByTagName("tr")
        for (let row of rows) {
            let title = row.cells[0].getElementsByTagName("input")[0].value
            let currentChapter = row.cells[1].getElementsByTagName("input")[0].value

            // Skip empty rows
            if (!title || !currentChapter) continue

            // Check if the title already exists in the storage data
            if (currentData[category] && currentData[category][title]) {
                // If it exists, use the existing nextChapterURL
                data[category][title] = {
                    currentChapter: currentChapter,
                    currentChapterURL: currentData[category][title].currentChapterURL,
                    nextChapterURL: currentData[category][title].nextChapterURL,
                }
            } else {
                // If it's a new title, initialize nextChapterURL with an empty string or default URL
                data[category][title] = {
                    currentChapter: currentChapter,
                    currentChapterURL: defaultMangaSeeURL, // Or a default URL if you have one
                    nextChapterURL: defaultMangaSeeURL, // Or a default URL if you have one
                }
            }
        }
    }

    // Save the updated data to Chrome storage
    chrome.storage.sync.set({ webtoonTracker: data }, function () {
        console.log("Data saved:", data)
    })
}
