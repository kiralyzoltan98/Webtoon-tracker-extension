//TODO: Search tru users browser history and get all the previous urls and add them to the table with the highest chapter number (jump button as well).
//TODO: 4) Make the regex so it will work with chapter/rész/epizód, and not only dashes [-] between the title words but underscores as well [_].

/* TODO:
    - Create a refresh button that will try all the disabled buttons and enable them if the response body has a html element with the id of "TopPage"
    - Add a button the the options page that will add the current manhwa to the list, with its url, and title.

    - Refactor a row to be represented by a class.
       - The class should have these fields:
            - title
            - currentChapter
            - currentChapterURL
            - nextChapterURL
            - nextChapterAvailable
            - completed
    - The main containers (Anime, Manga, Webtoon) should contain an array of these objects.
*/

// Create a button that will toggle hide/show the completed series.

/*
Features:
 - Data structure change
 - Button to open current page
 - Button to open next page
 - Import / Export functionality with support for old data format
 - Reduced js errors
 V2:
 - Implement a new datastructure that can store if we are hiding the completed chapters or not. Maybe like { "Preferences": { "HideCompleted": true, "LastFetchDate": "2024-01-01 12:00:00" } }
 - Also extend the data structure to be able to store the last automated fetch date, 
    that can be used when loading the page to check if we need to update the Next buttin in the table or not.
 - If we are in hiding mode then automatically hide the row if the checkbox is checked.
*/

//every .1 second, check if the data has changed and if so, update the table

const defaultMangaSeeURL = "https://mangasee123.com/404"

const defaultPreferences = {
    HideCompleted: true,
    LastFetchDate: Date.now(),
    TableUpdateNeeded: false,
}

const forceFetch = true

const TOAST_LEVEL = {
    info: "#4a90e2",
    success: "#2dc476",
    warning: "#ebd983",
    error: "#e23636",
}

const MAIN_STORAGE_KEY = "webtoonTracker"

let refreshTable = false

setInterval(function () {
    chrome.storage.sync.get([MAIN_STORAGE_KEY], function (data) {
        if (data[MAIN_STORAGE_KEY]) {
            updateTable(data[MAIN_STORAGE_KEY])
        }
    })
}, 100)

function updateTable(data) {
    const tableData = document.getElementById("container")
    if (!tableData) {
        return
    }

    const { tables, tableHeaderText } = findTableElements(tableData)

    Array.from(tables).forEach(table => {
        const tableRows = table.getElementsByTagName("tbody")[0].getElementsByTagName("tr")
        Array.from(tableRows).forEach(row => updateRow(row, data, tableHeaderText))
    })
}

function findTableElements(tableData) {
    const tables = tableData.getElementsByTagName("table")
    const tableHeader = tables[0].getElementsByTagName("thead")[0]
    const tableHeaderText = tableHeader.getElementsByTagName("th")[0].innerText
    return { tables, tableHeaderText }
}

function updateRow(row, data, tableHeaderText) {
    const [checkBoxCell, titleCell, chapterCell, openCurrentButton, openNextButton] = row.cells
    const title = titleCell.getElementsByTagName("input")[0].value

    if (data[tableHeaderText] && data[tableHeaderText][title]) {
        const entry = data[tableHeaderText][title]
        const { currentChapter, currentChapterURL, nextChapterURL, completed } = entry

        chapterCell.getElementsByTagName("input")[0].value = currentChapter
        openCurrentButton.getElementsByTagName("button")[0].onclick = () => openURL(currentChapterURL)
        openNextButton.getElementsByTagName("button")[0].onclick = () => openURL(nextChapterURL)
        checkBoxCell.getElementsByTagName("input")[0].onclick = () => toggleCompleted(entry, data)
        checkBoxCell.getElementsByTagName("input")[0].checked = completed
    }
}

function openURL(url) {
    chrome.tabs.create({ url })
}

function toggleCompleted(entry, data) {
    entry.completed = !entry.completed
    writeStorage(MAIN_STORAGE_KEY, data)
}

const textInfo =
    '<b>How to use this extension:</b><br>1. Click the "Add Row" button to add a new row to the table.' +
    "<br>2. Enter the name of the webtoon/manga/anime you want to track in the first cell of the row." +
    "<br>3. Enter the number of chapters you'r currently at in the second cell of the row." +
    "<br>4. Press Ctrl + s to save the changes." +
    "<br><b>Thats it!</b> The next time you navigate to a webtoon/manga/anime page, the extension will automatically update the table with the number of chapters you're currently at. (if it's greater than the number you entered)" +
    "<br><br>Made by: <a href='https://kiralyzoltan.com'>Zoltan Kiraly</a>"

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
    // style the button
    exportButton.style.position = "fixed"
    exportButton.style.top = "10px"
    exportButton.style.right = "10px"

    exportButton.onclick = function () {
        chrome.storage.sync.get([MAIN_STORAGE_KEY], function (data) {
            let json = JSON.stringify(data[MAIN_STORAGE_KEY])
            let blob = new Blob([json], { type: "application/json" })
            let url = URL.createObjectURL(blob)
            let a = document.createElement("a")
            a.href = url
            a.download = MAIN_STORAGE_KEY + ".json"
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

    // style the button
    importButton.style.position = "fixed"
    importButton.style.top = "10px"
    importButton.style.right = "80px"

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
                writeStorage(MAIN_STORAGE_KEY, convertedData)
            }
            reader.readAsText(file)
            // refresh the table with a reload.
            window.location.reload()
        }
        input.click()
    }
    document.body.appendChild(importButton)
}

// create a "Hide Completed" button that will hide all the rows that have the completed checkbox checked.
function createHideCompletedButton() {
    let hideCompletedButton = document.createElement("button")
    hideCompletedButton.id = "hideCompleted"
    hideCompletedButton.innerHTML = "Hide Completed 🫥"
    hideCompletedButton.style.position = "fixed"
    hideCompletedButton.style.top = "10px"
    hideCompletedButton.style.left = "10px"
    hideCompletedButton.onclick = hideCompletedRows
    document.body.appendChild(hideCompletedButton)
}

//extract the hideCompletedButton.onclick function to a toggle function that will toggle the hide/show of the completed rows.
//add a class to the hidden rows so we can easily show them again.

// Function to toggle the visibility of completed rows
function hideCompletedRows() {
    let tables = document.getElementById("container").getElementsByTagName("table")
    for (let i = 0; i < tables.length; i++) {
        let table = tables[i]
        let tableBody = table.getElementsByTagName("tbody")[0]
        let tableRows = tableBody.getElementsByTagName("tr")
        for (let j = 0; j < tableRows.length; j++) {
            let row = tableRows[j]
            let checkBoxCell = row.cells[0].getElementsByTagName("input")[0]
            if (checkBoxCell.checked) {
                row.style.display = "none"
            }
        }
    }
    // Change the button text to "Show Completed"
    let hideCompletedButton = document.getElementById("hideCompleted")
    hideCompletedButton.innerHTML = "Show Completed 👁️"
    hideCompletedButton.onclick = showCompletedRows

    // set Preference HideCompleted to true
    chrome.storage.sync.get([MAIN_STORAGE_KEY], function (data) {
        let tableData = data[MAIN_STORAGE_KEY]
        tableData.Preferences.HideCompleted = true
        writeStorage(MAIN_STORAGE_KEY, tableData)
    })
}

function showCompletedRows() {
    let tables = document.getElementById("container").getElementsByTagName("table")
    for (let i = 0; i < tables.length; i++) {
        let table = tables[i]
        let tableBody = table.getElementsByTagName("tbody")[0]
        let tableRows = tableBody.getElementsByTagName("tr")
        for (let j = 0; j < tableRows.length; j++) {
            let row = tableRows[j]
            row.style.display = "table-row"
        }
    }
    // Change the button text back to "Hide Completed"
    let hideCompletedButton = document.getElementById("hideCompleted")
    hideCompletedButton.innerHTML = "Hide Completed 🫥"
    hideCompletedButton.onclick = hideCompletedRows

    // set Preference HideCompleted to false
    chrome.storage.sync.get([MAIN_STORAGE_KEY], function (data) {
        let tableData = data[MAIN_STORAGE_KEY]
        tableData.Preferences.HideCompleted = false
        writeStorage(MAIN_STORAGE_KEY, tableData)
    })
}

// create a button that will do the checkChapter on click and enable the button if the response has a html element with the id of "TopPage".
// add a class to the disabled buttons so we can easily enable them again.

function createRefreshButton() {
    let refreshButton = document.createElement("button")
    refreshButton.id = "refresh"
    refreshButton.innerHTML = "fetch<br>🔄"
    refreshButton.style.position = "fixed"
    refreshButton.style.top = "50px"
    refreshButton.style.left = "10px"
    refreshButton.style.fontSize = "1.2rem"
    refreshButton.title = "This button is not supposed to be clicked too often. Please be considerate."
    // on click call the checkChapter function and enable the button if the response has a html element with the id of "TopPage"
    refreshButton.onclick = handleRefreshButton

    document.body.appendChild(refreshButton)
}

// This function is used on the click of the refresh button to check if the next chapter is available and enable the button if it is.
// Using the checkChapter function. The nextChapterURL is not stored in the table, so we have to look it up in the storage.
function handleRefreshButton() {
    chrome.storage.sync.get([MAIN_STORAGE_KEY], async function (data) {
        tableData = data[MAIN_STORAGE_KEY]

        let tables = document.getElementById("container").getElementsByTagName("table")
        for (let i = 0; i < tables.length; i++) {
            let table = tables[i]
            let tableBody = table.getElementsByTagName("tbody")[0]
            let tableRows = tableBody.getElementsByTagName("tr")
            for (let j = 0; j < tableRows.length; j++) {
                let row = tableRows[j]
                let openNextButton = row.cells[4].getElementsByTagName("button")[0]
                let title = row.cells[1].getElementsByTagName("input")[0].value

                for (let category in tableData) {
                    let entry = tableData[category][title]
                    if (entry && entry.nextChapterURL) {
                        let shouldEnableButton = await checkChapter(entry.nextChapterURL, openNextButton)
                        console.log(title, shouldEnableButton)
                        tableData[category][title].nextChapterAvailable = shouldEnableButton
                    }
                }
            }
        }

        // Save the updated data to Chrome storage
        if (tableData) {
            tableData.Preferences.LastFetchDate = Date.now()
            console.log("Table updated")
            writeStorage(MAIN_STORAGE_KEY, tableData)
        }
    })

    // disable the button after the check for 15 seconds and show a countdown on the button.
    let refreshButton = document.getElementById("refresh")
    refreshButton.disabled = true
    let count = 15
    refreshButton.innerHTML = count
    let interval = setInterval(() => {
        count--
        refreshButton.innerHTML = count
        if (count === 0) {
            clearInterval(interval)
            refreshButton.disabled = false
            refreshButton.innerHTML = "fetch<br>🔄"
        }
    }, 1000)
}

// Function to check and convert data from old format
function convertDataFormat(data) {
    Object.keys(data).forEach(category => {
        Object.keys(data[category]).forEach(title => {
            // If the value is a string, it's in the old format
            if (typeof data[category][title] === "string") {
                data[category][title] = {
                    currentChapter: data[category][title],
                    currentChapterURL: "", // Leaving URL fields empty
                    nextChapterURL: "",
                    nextChapterAvailable: false,
                    completed: false,
                }
            }
            if (!data.Preferences) {
                data.Preferences = defaultPreferences
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

    let checkboxCell = newRow.insertCell(0)
    let checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.classList.add("complete-check") // Add class for styling or functionality
    checkboxCell.appendChild(checkbox)

    // Add two cells with input fields (as in your existing code)
    for (let i = 1; i <= 2; i++) {
        let cell = newRow.insertCell(i)
        let input = createInput("text", "left", "100%")
        cell.appendChild(input)

        // Consistent styling
        cell.style.width = i === 1 ? "85%" : "15%"

        // Add event listener for dynamic addition if needed
        input.addEventListener("input", addRowIfNeeded)
    }

    //place the open buttons in a for loop as well.
    for (let i = 3; i <= 4; i++) {
        let cell = newRow.insertCell(i)
        let openButton = document.createElement("button")
        openButton.textContent = i === 3 ? "Current" : "Next"
        openButton.classList.add("disabled") // Add class for styling
        openButton.disabled = true // Disable the button by default
        cell.appendChild(openButton)
    }

    // Adjust the column span for headers if needed
    let tableHeader = table.getElementsByTagName("thead")[0]
    if (tableHeader) {
        let headerCells = tableHeader.getElementsByTagName("th")
        for (let cell of headerCells) {
            cell.colSpan = 4
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("infoText") === null) {
        createInfoElement()
    }
    if (document.getElementById("export") === null) {
        createExportButton()
    }
    if (document.getElementById("import") === null) {
        createImportButton()
    }
    if (document.getElementById("hideCompleted") === null) {
        createHideCompletedButton()
    }
    if (document.getElementById("refresh") === null) {
        createRefreshButton()
    }
    addRowButtonListeners()
    populateTableOnPageLoad()
    setHideCompletedButton()
})

function addRowButtonListeners() {
    if (!document.getElementById("add0")) {
        return
    }
    document.getElementById("add0").addEventListener("click", () => addRow("Webtoon"))
    document.getElementById("add1").addEventListener("click", () => addRow("Manga"))
    document.getElementById("add2").addEventListener("click", () => addRow("Anime"))
}

// get Preferences.HideCompleted from the storage and set the button text and onclick function accordingly.
function setHideCompletedButton() {
    chrome.storage.sync.get([MAIN_STORAGE_KEY], function (data) {
        let tableData = data[MAIN_STORAGE_KEY]
        let hideCompletedButton = document.getElementById("hideCompleted")
        if (!hideCompletedButton) {
            return
        }
        if (tableData.Preferences.HideCompleted) {
            hideCompletedButton.innerHTML = "Show Completed 👁️"
            hideCompletedButton.onclick = showCompletedRows
        } else {
            hideCompletedButton.innerHTML = "Hide Completed 🫥"
            hideCompletedButton.onclick = hideCompletedRows
        }
    })
}

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

function populateTableOnPageLoad() {
    // Load the data from storage and populate the table on page load
    chrome.storage.sync.get([MAIN_STORAGE_KEY], function (data) {
        let tableData = data[MAIN_STORAGE_KEY]
        console.log({ tableData })

        // Check if data exists
        if (!tableData) {
            console.log("No data found.")
            return
        }

        // Check if the object has "Preferences" key and add it if it doesn't add a default to it.
        if (!tableData.Preferences) {
            tableData.Preferences = defaultPreferences
            // Save the updated data to Chrome storage
            writeStorage(MAIN_STORAGE_KEY, tableData)
        }

        const checkChaptersPromises = [] // Collect all promises from checkChapter calls

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

            tableHeader.innerHTML = `<tr><th colspan="4">${category}</th></tr>`

            let entries = Object.entries(tableData[category])
            if (entries.length === 0) {
                // Add an empty row if no entries
                addRowToTable(table, () => {})
            } else {
                entries.forEach(([title, entry], index) => {
                    let row = tableBody.insertRow()

                    let checkboxCell = row.insertCell(0)
                    let checkbox = document.createElement("input")
                    checkbox.type = "checkbox"
                    checkbox.checked = entry.completed || false
                    checkboxCell.appendChild(checkbox)

                    addCell(row, title, index % 2 === 0)
                    addCell(row, entry.currentChapter, index % 2 === 0, "right")

                    // Add Open button cell
                    let openCell = row.insertCell(3)
                    let openCurrentButton = document.createElement("button")
                    openCurrentButton.textContent = "Current"
                    openCurrentButton.classList.add("open-button")

                    // Add Open Next button cell
                    let openNextCell = row.insertCell(4)
                    let openNextButton = document.createElement("button")
                    openNextButton.textContent = "Next"
                    openNextButton.classList.add("open-button")
                    openCurrentButton.onclick = () => chrome.tabs.create({ url: entry.currentChapterURL })
                    openNextButton.onclick = () => chrome.tabs.create({ url: entry.nextChapterURL })

                    openCell.appendChild(openCurrentButton)
                    openNextCell.appendChild(openNextButton)

                    //Try to make a get request to the url and if the response has a html element with the id of "TopPage" then enable the button
                    //otherwise disable the button                     // 15 minutes
                    if (Date.now() - tableData.Preferences.LastFetchDate > 900000) {
                        let promise = checkChapter(entry.nextChapterURL, openNextButton).then(shouldEnableButton => {
                            entry.nextChapterAvailable = shouldEnableButton
                        })
                        checkChaptersPromises.push(promise)
                    } else {
                        console.log(title, entry.nextChapterAvailable)
                        if (entry.nextChapterAvailable) {
                            openNextButton.classList.remove("disabled")
                            openNextButton.disabled = false
                        } else {
                            openNextButton.classList.add("disabled")
                            openNextButton.disabled = true
                        }
                    }

                    if (tableData.Preferences.HideCompleted && entry.completed) {
                        row.style.display = "none"
                    }
                })
            }
        })

        Promise.all(checkChaptersPromises).then(() => {
            if (Date.now() - tableData.Preferences.LastFetchDate > 900000) {
                tableData.Preferences.LastFetchDate = Date.now()
                tableData.Preferences.TableUpdateNeeded = false
                writeStorage(MAIN_STORAGE_KEY, tableData)
            }
        })
    })
}
// function to fetch the url and check if the response has a html element with the id of "TopPage" use the code above to enable/disable the button.
function checkChapter(url, openNextButton) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "checkChapter", url: url }, function (response) {
            if (response.success) {
                // Now parse the HTML text with DOMParser
                let parser = new DOMParser()
                let doc = parser.parseFromString(response.html, "text/html")
                let topPage = doc.getElementById("TopPage")

                // Logic for when topPage exists
                if (topPage) {
                    openNextButton.classList.remove("disabled")
                    openNextButton.disabled = false
                    resolve(true)
                } else {
                    openNextButton.classList.add("disabled")
                    openNextButton.disabled = true
                    resolve(false)
                }
            } else {
                console.error(response.error)
                reject(response.error)
            }
        })
    })
}

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
}

//ctrl+s call saveData function prevent default action of ctrl+s
document.addEventListener("keydown", function (e) {
    if (e.keyCode === 83 && e.ctrlKey) {
        e.preventDefault()
        saveData()
    }
})

/*
//function to save the current table data to the storage.
    String text: The text to display in the toast
    String color: The color of the toast background. You can use the TOAST_LEVEL object to get a basic color.

    Duration could be implemented as a third parameter, but the CSS fadeout has to be refactored to work with it.
*/
function toast(text, color = TOAST_LEVEL.info) {
    const element = document.getElementById("snackbar")
    element.style.backgroundColor = color
    element.innerHTML = text
    element.className = "show"
    setTimeout(function () {
        element.className = element.className.replace("show", "")
    }, 3000)
}

//function to save the current table data to the storage.
async function saveData() {
    toast("Saved", TOAST_LEVEL.success) // Display the "Saved" toast message

    //get the current data from the storage
    const currentData = await new Promise((resolve, reject) => {
        chrome.storage.sync.get([MAIN_STORAGE_KEY], function (result) {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError))
            } else {
                resolve(result[MAIN_STORAGE_KEY])
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
            let title = row.cells[1].getElementsByTagName("input")[0].value
            let currentChapter = row.cells[2].getElementsByTagName("input")[0].value

            // Skip empty rows
            if (!title || !currentChapter) continue

            // Check if the title already exists in the storage data
            if (currentData[category] && currentData[category][title]) {
                // If it exists, use the existing nextChapterURL
                data[category][title] = {
                    currentChapter: currentChapter,
                    currentChapterURL: currentData[category][title].currentChapterURL,
                    nextChapterURL: currentData[category][title].nextChapterURL,
                    nextChapterAvailable: currentData[category][title].nextChapterAvailable,
                    completed: currentData[category][title].completed,
                }
            } else {
                // If it's a new title, initialize nextChapterURL with an empty string or default URL
                data[category][title] = {
                    currentChapter: currentChapter,
                    currentChapterURL: defaultMangaSeeURL, // Or a default URL if you have one
                    nextChapterURL: defaultMangaSeeURL, // Or a default URL if you have one
                    nextChapterAvailable: false,
                    completed: false,
                }
            }
        }
    }

    if (currentData.Preferences.HideCompleted) {
        // also save the ones that are completed but hidden
        for (let category in currentData) {
            for (let title in currentData[category]) {
                if (currentData[category][title].completed) {
                    data[category][title] = currentData[category][title]
                }
            }
        }
    }

    data.Preferences = currentData.Preferences // Copy the preferences from the current data

    // Save the updated data to Chrome storage
    writeStorage(MAIN_STORAGE_KEY, data)
}

//function to write/save the data to the storage
function writeStorage(key, value) {
    chrome.storage.sync.set({ [key]: value }, function () {
        console.log("Data saved:", value) // TODO: remove before production
    })
}

document.addEventListener("visibilitychange", function () {
    console.log("Visibility changed to:", document.visibilityState, refreshTable)
    chrome.storage.sync.get([MAIN_STORAGE_KEY], function (data) {
        let tableData = data[MAIN_STORAGE_KEY]
        if (document.visibilityState === "visible" && tableData.Preferences.TableUpdateNeeded) {
            tableData.Preferences.TableUpdateNeeded = false
            writeStorage(MAIN_STORAGE_KEY, tableData)
            window.location.reload()
        }
    })
})
