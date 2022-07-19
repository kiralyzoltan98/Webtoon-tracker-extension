
let color = '#3aa757';

let json = fetch('./template.json').then(results => results.json()).then(console.log);

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ color });
    //console.log('Default background color set to %cgreen', `color: ${color}`);
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        let data;
        if ("webtoonTracker" in localStorage){
            data = JSON.parse(localStorage.getItem("webtoonTracker"));
        } else {
            localStorage.setItem('webtoonTracker', json);
            data = json;
        }

        if (changeInfo.url) {
            console.log("Changinfo data: ", changeInfo.url);
        }
    }
);