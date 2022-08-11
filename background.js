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
                //console.log("data: ", data.webtoonTracker);
            } else {
                await chrome.storage.sync.set({webtoonTracker: json});
                data = json;
            }

            //if changeInfo.url contains any key from data.webtoonTracker then update its value
            for (let key in data.webtoonTracker) {
                for (let key2 in data.webtoonTracker[key]) {
                    let title = key2.replace(/\s/g , "-");
                    let regex = new RegExp( title + '.*chapter-(\\d+)', "gi");
                    let chapter = changeInfo.url.match(regex);
                    let secondRegex = new RegExp( '(\\d+)(?!.*\\d)', "gi");
                    if (chapter) {
                        if (chapter[0]) {
                            let accualChapter = chapter[0].match(secondRegex)[0];
                            if (parseInt(accualChapter) > parseInt(data.webtoonTracker[key][key2])) {
                                data.webtoonTracker[key][key2] = accualChapter;
                                chrome.storage.sync.set({webtoonTracker: data.webtoonTracker});
                            }
                        }
                    }
                }
            }
        }
    }
);