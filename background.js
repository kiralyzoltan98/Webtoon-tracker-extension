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

            //if changeInfo.url contains any key from data.webtoonTracker then update its value
            for (let key in data.webtoonTracker) {
                for (let key2 in data.webtoonTracker[key]) {
                    let title = key2.replace(/\s/g , "-") + "-chapter-";
                    let regex = new RegExp( "(?<=" + title + ")([0-9]*?)(?=\.html)", "g");
                    console.log("regex: ", regex);
                    let chapter = changeInfo.url.match(regex);
                    if (chapter) {
                        if (chapter[0]) {
                            console.log("chapter for: "+ key2 + ", ", chapter[0]);
                            if (chapter[0] > data.webtoonTracker[key][key2]) {
                                data.webtoonTracker[key][key2] = chapter[0];
                                chrome.storage.sync.set({webtoonTracker: data.webtoonTracker});
                                console.log("new data set from url change: ", data.webtoonTracker);
                            }
                        }
                    }
                }
            }
            console.log("Changinfo data: ", changeInfo.url);
        }
    }
);