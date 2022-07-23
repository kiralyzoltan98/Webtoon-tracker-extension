let json = {
    Webtoon: {
        write: "1"
    },
    Manga: {
        your: "2"
    },
    Anime: {
        titles: "3"
    }
}

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
        if (changeInfo.url) {
            let data = await chrome.storage.sync.get(["webtoonTracker"])

            if (data){
                console.log("data: ", data.webtoonTracker);
            } else {
                await chrome.storage.sync.set({webtoonTracker: json});
                data = json;
            }
            console.log("Changinfo data: ", changeInfo.url);
        }
    }
);