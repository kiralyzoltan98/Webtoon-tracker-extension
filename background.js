
let color = '#3aa757';

//let json = fetch('./template.json').then(results => results.json()).then(console.log);
let json = {
    "webtoon": {
        "some": "value"
    },
    "manga": {
        "some": "value"
    },
    "anime": {
        "some": "value"
    }
}


chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ color });
    //console.log('Default background color set to %cgreen', `color: ${color}`);
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        let data;
        //console.log(isEmptyObj());
        console.log("json: ", json);
        if (chrome.storage.sync.get(["webtoonTracker"]).then()){
            console.log(chrome.storage.sync.get(["webtoonTracker"]).then());
            data = JSON.parse(chrome.storage.sync.get(["webtoonTracker"]).then());
        } else {
            chrome.storage.sync.set({webtoonTracker: json}).then();
            data = json;
        }

        if (changeInfo.url) {
            console.log("Changinfo data: ", changeInfo.url);
        }
    }
);

function isEmptyObj() {
    Object.values(json).every(value => {
        if (value === null) {
            return true;
        }
        return false;
    });
}