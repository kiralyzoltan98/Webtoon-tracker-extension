const MAIN_STORAGE_KEY = "webtoonTracker"

document.addEventListener("DOMContentLoaded", function () {
    let open = document.getElementById("open")
    let addCurrWebtoon = document.getElementById("add_current_webtoon")
    let addCurrManga = document.getElementById("add_current_manga")
    let addCurrAnime = document.getElementById("add_current_anime")

    if (open) {
        open.onclick = function () {
            openList()
        }
    }

    if (addCurrWebtoon) {
        addCurrWebtoon.onclick = function () {
            addCurrentChapterToData(addCurrWebtoon.innerHTML)
        }
    }

    if (addCurrManga) {
        addCurrManga.onclick = function () {
            addCurrentChapterToData(addCurrManga.innerHTML)
        }
    }

    if (addCurrAnime) {
        addCurrAnime.onclick = function () {
            addCurrentChapterToData(addCurrAnime.innerHTML)
        }
    }
})

function openList() {
    chrome.tabs.create({ url: "options.html" })
}

//data[MAIN_STORAGE_KEY][category][title]
function addCurrentChapterToData(category = "Webtoon") {
    // get the current tab url
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        let url = tabs[0].url
        let title = extractTitleFromUrl(url)

        if (!title) {
            console.log("Could not extract title: '" + title + "' from URL:\n'" + url + "'")
            return
        }

        chrome.storage.sync.get([MAIN_STORAGE_KEY], function (data) {
            if (!data[MAIN_STORAGE_KEY]) {
                data[MAIN_STORAGE_KEY] = {}
            }

            if (!data[MAIN_STORAGE_KEY][category]) {
                data[MAIN_STORAGE_KEY][category] = {}
            }

            if (!data[MAIN_STORAGE_KEY][category][title]) {
                data[MAIN_STORAGE_KEY][category][title] = {}
            }

            let titleRegex = title.replace(/\s/g, "-")
            let regex = new RegExp(titleRegex + ".*chapter-(\\d+)", "gi")
            let chapterMatch = url.match(regex)
            if (!chapterMatch) {
                console.log("Could not extract chapter number from URL")
                return
            }

            let chapterNumberMatch = chapterMatch[0].match(/(\d+)(?!.*\d)/)
            if (!chapterNumberMatch) {
                console.log("Could not extract chapter number from URL")
                return
            }

            let currentChapter = parseInt(chapterNumberMatch[0])

            let nextChapter = currentChapter + 1
            let nextChapterURL = url.replace(/chapter-\d+/, `chapter-${nextChapter}`)
            let completed = false

            data[MAIN_STORAGE_KEY][category][title] = {
                currentChapter: currentChapter.toString(),
                currentChapterURL: url,
                nextChapterURL: nextChapterURL,
                completed: completed,
            }

            data[MAIN_STORAGE_KEY].Preferences.TableUpdateNeeded = true

            console.log(data[MAIN_STORAGE_KEY])
            chrome.storage.sync.set({
                webtoonTracker: data[MAIN_STORAGE_KEY],
            })
        })
    })
}

function extractTitleFromUrl(url) {
    // This regex looks for a forward slash followed by any character except a dash or slash (captured in a group)
    // followed by the literal string '-chapter'
    console.log(url)
    const regex = /\/([^\/]+?)-chapter/
    const match = url.match(regex)
    if (match && match[1]) {
        // Replace dashes with spaces and decode URI component to handle any URL encoded characters
        return decodeURIComponent(match[1].replace(/-/g, " "))
    }
    return null
}
