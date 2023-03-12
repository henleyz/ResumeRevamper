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
                func: () => document.getElementById("JobDescriptionContainer").innerHTML,
            });

        } else if (url.hostname == 'www.linkedin.com') {

            [{result}] = await chrome.scripting.executeScript({
                target: {
                    tabId: tab.id
                },
                func: () => document.getElementsByClassName("jobs-description__content")[0].innerHTML,
            });

        } else if (url.hostname == 'www.indeed.com') { //indeed framed html workaround

            const jki = tab.url.search('jk=[A-Za-z0-9]{16}')
            const jk = tab.url.substring(jki + 3, jki + 19)
            fetch('https://www.indeed.com/viewjob?viewtype=embedded&jk=' + jk)
                .then((resp) => resp.text())
                .then(function(data) {
                    data = data.split("\n").slice(51)
                    data = data.slice(0, data.indexOf('        <script>') - 1).join("\n")
                    jobDescription = result;
                    document.getElementById('scrapedDesc').innerHTML = data;
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
    jobDescription = stripHtml(result);
    console.log(result)
    document.getElementById('scrapedDesc').innerHTML = result;
    if (result === null) {
        document.getElementById('descTitle').textContent = "Not a job description page"
    }
})();

var addMode = false;

async function storeResume() {
    const storeButton = document.getElementById('ResumeStoreButton')
    const inputField = document.getElementById('resumeBox')
    const confirm = document.getElementById('confirmation')
    if(!addMode) {
        addMode = true;
        storeButton.innerText = "Submit Resume"
        inputField.style.display = 'block';
        inputField.style.height = '1.5rem';
        return;
    } 
    if (inputField.value === ""){
        return;
    }
    inputField.style.display = 'none';
    inputField.style.height = '0';
    addMode = false;
    storeButton.innerText = "Add Resume"

    chrome.storage.local.set({
        'resume': ''
    }).then(() => {
        console.log("Resume Cleared");
    });
    chrome.storage.local.set({
        'resume': inputField.value
    }).then(() => {
        console.log("Resume Stored");
        storeButton.textContent == "green"
    });
    inputField.value = "";
    
   

}

async function generateSuggestions() {
    let result = await chrome.storage.local.get('resume')
    const prompt = `Can you make suggestions for this resume to better match this job description. Job Description:${jobDescription} Resume:${resume.result}`
    document.getElementById('scrapedDesc').innerHTML = prompt;
    console.log(result.resume)
}

function stripHtml(html) {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}



async function makeAPICall(desc, resume){

  const prompt = `Can you make suggestions for this resume to better match this job description. Job Description:${desc} Resume:${resume}`



  await fetch(
    `https://api.openai.com/v1/completions`,
    {
        body: JSON.stringify({"model": "text-davinci-003", "prompt": prompt, "temperature": 0, "max_tokens": 1500}),
        method: "POST",
        headers: {
            "content-type": "application/json",
            Authorization: "Bearer  API_KEY_HERE",
        },
            }
).then((response) => {
    if (response.ok) {
        response.json().then((json) => {
            console.log(json);
        });
    }
});
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }