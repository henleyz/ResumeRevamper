// Assing buttons to function
document.getElementById("ResumeStoreButton").addEventListener("click", storeResume);
document.getElementById("GenerateSuggestions").addEventListener("click", generateSuggestions);

//scrape job description on open
var jobDescription;
(async () => {
    let url;
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });
    let result;
    try {
        url = new URL(tab.url);

        if (url.hostname == 'www.glassdoor.com') {

            [{result}] = await chrome.scripting.executeScript({
                target: {
                    tabId: tab.id
                },
                func: () => document.getElementById("JobDescriptionContainer").innerText,
            });

        } else if (url.hostname == 'www.linkedin.com') {

            [{result}] = await chrome.scripting.executeScript({
                target: {
                    tabId: tab.id
                },
                func: () => document.getElementsByClassName("jobs-description__content")[0].innerText,
            });

        } else if (url.hostname == 'www.indeed.com') { //indeed framed html workaround

            const jki = tab.url.search('jk=[A-Za-z0-9]{16}')
            const jk = tab.url.substring(jki + 3, jki + 19)
            fetch('https://www.indeed.com/viewjob?viewtype=embedded&jk=' + jk)
                .then((resp) => resp.text())
                .then(function(data) {
                    data = data.split("\n").slice(51)
                    data = data.slice(0, data.indexOf('        <script>') - 1).join("\n")
                    result = stripHtml(data)
                    console.log(stripHtml(data))
                    jobDescription = result;
                    document.getElementById('scrapedDesc').textContent = result;
                    return;
                })
        } else {
            document.getElementById('descTitle').textContent = 'WebsiteNotSupported';
        }
    } catch (e) {
        document.getElementById('descTitle').textContent = 'Cannot access page';
        return;
    }
    // process the result
    jobDescription = result;
    document.getElementById('scrapedDesc').textContent = result;
    if (result === null) {
        document.getElementById('descTitle').textContent = "not a job description page"
    }
})();


function storeResume() {
    const resumeText = document.getElementById('resumeBox')
    chrome.storage.local.set({
        'resume': ''
    }).then(() => {
        console.log("Resume Cleared");
    });
    chrome.storage.local.set({
        'resume': resumeText.value
    }).then(() => {
        console.log("Resume Stored");
    });
    resumeText.value = "";
}

async function generateSuggestions() {
    let result = await chrome.storage.local.get('resume')
    console.log(result.resume)
}

function stripHtml(html) {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}