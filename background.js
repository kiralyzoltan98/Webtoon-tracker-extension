let json = {
    Webtoon: {
        write: {
            currentChapter: "1",
            currentChapterURL: "https://mangasee123.com/",
            nextChapterURL: "https://mangasee123.com/",
            completed: false,
            nextChapterAvailable: true,
        },
    },
    Manga: {
        your: {
            currentChapter: "2",
            currentChapterURL: "https://mangasee123.com/",
            nextChapterURL: "https://mangasee123.com/",
            completed: false,
            nextChapterAvailable: true,
        },
    },
    Anime: {
        titles: {
            currentChapter: "3",
            currentChapterURL: "https://mangasee123.com/",
            nextChapterURL: "https://mangasee123.com/",
            completed: false,
            nextChapterAvailable: true,
        },
    },
    Preferences: {
        HideCompleted: true,
        LastFetchDate: Date.now(),
        TableUpdateNeeded: false,
    },
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action == "checkChapter") {
        if (!request.url) {
            sendResponse({ success: false, error: "No URL provided" })
            return
        }
        fetch(request.url)
            .then(response => response.text())
            .then(text => {
                // Send the HTML text back to the sender (content script or popup)
                sendResponse({ success: true, html: text })
            })
            .catch(error => {
                console.error(error)
                sendResponse({ success: false, error: error.toString() })
            })
        return true // to indicate you wish to send a response asynchronously
    }
})

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
    if (changeInfo.url) {
        let data = await chrome.storage.sync.get(["webtoonTracker"])

        if (!data) {
            await chrome.storage.sync.set({ webtoonTracker: json })
            data = json
        }
        //if changeInfo.url contains any key from data.webtoonTracker then update its value
        for (let category in data.webtoonTracker) {
            for (let title in data.webtoonTracker[category]) {
                let titleRegex = title.replace(/\s/g, "-")
                let regex = new RegExp(titleRegex + ".*chapter-(\\d+)", "gi")
                let chapterMatch = changeInfo.url.match(regex)
                if (!chapterMatch) {
                    continue
                }
                let chapterNumberMatch = chapterMatch[0].match(/(\d+)(?!.*\d)/)
                if (!chapterNumberMatch) {
                    continue
                }
                let currentChapter = parseInt(chapterNumberMatch[0])
                // if the current chapter is greater than the stored chapter, update the stored chapter and nextChapterURL
                if (currentChapter > parseInt(data.webtoonTracker[category][title].currentChapter)) {
                    let nextChapter = currentChapter + 1
                    let nextChapterURL = changeInfo.url.replace(/chapter-\d+/, `chapter-${nextChapter}`)
                    let completed = data.webtoonTracker[category][title].completed
                    console.log({ nextChapterURL })
                    console.log("current", changeInfo.url)
                    data.webtoonTracker[category][title] = {
                        currentChapter: currentChapter.toString(),
                        currentChapterURL: changeInfo.url,
                        nextChapterURL: nextChapterURL,
                        completed: completed,
                    }

                    chrome.storage.sync.set({
                        webtoonTracker: data.webtoonTracker,
                    })
                }
            }
        }
    }
})
