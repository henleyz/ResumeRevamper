
const API_KEY = "" //insert API KEY here!


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
        let theme = document.querySelector(':root')

        if (url.hostname == 'www.glassdoor.com') {
            theme.style.setProperty('--theme', 'lightgreen');

            [{result}] = await chrome.scripting.executeScript({
                target: {
                    tabId: tab.id
                },
                func: () => document.getElementsByClassName("jobDescriptionContent desc")[0].innerHTML,
            });

        } else if (url.hostname == 'www.linkedin.com') {
            theme.style.setProperty('--theme', '#0077B5');
            [{result}] = await chrome.scripting.executeScript({
                target: {
                    tabId: tab.id
                },
                func: () => document.getElementsByClassName("jobs-description__content")[0].innerHTML,
            });

        } else if (url.hostname == 'www.indeed.com') { //indeed framed html workaround
            theme.style.setProperty('--theme', '#003A9B');
            const jki = tab.url.search('jk=[A-Za-z0-9]{16}')
            const jk = tab.url.substring(jki + 3, jki + 19)
            fetch('https://www.indeed.com/viewjob?viewtype=embedded&jk=' + jk)
                .then((resp) => resp.text())
                .then(function(data) {
                    data = data.split("\n").slice(51)
                    data = data.slice(0, data.indexOf('        <script>') - 1)
                    if (data[0].includes('webkit')) {
                        data[0] = data[0].substring(1196)
                    }
                    data = data.join("\n")
                    document.getElementById('scrapedDesc').innerHTML = data;
                    jobDescription = stripHtml(data);
                    return;
                })
        } else {
            document.getElementById('descTitle').textContent = 'Website Not Supported';
            document.getElementById('scrapedDesc').innerHTML = "";
            jobDescription = ""
            return;
        }
    } catch (e) {
        document.getElementById('descTitle').textContent = 'Cannot access page';
        return;
    }

    jobDescription = stripHtml(result);
    console.log(result)
    document.getElementById('scrapedDesc').innerHTML = result;
    if (result === null) {
        document.getElementById('descTitle').textContent = "Not a job description page"
    }
})();

var addMode = false; //toggle for resume add and resume submit

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
        
    });
    confirm.textContent = "Resume Added!"

    inputField.value = "";
    
   

}

async function generateSuggestions() {
    let result = await chrome.storage.local.get('resume')
    const prompt = `Can you make suggestions for this resume to better match this job description. Job Description:${jobDescription} Resume:${result.resume}`
    const response =  await OpenaiFetchAPI(prompt)
    if (response !== undefined) {
        document.getElementById('suggestionsTitle').style.display = 'block';
        document.getElementById('suggestions').textContent = response
    }
}


async function OpenaiFetchAPI(prompt) {
    const confirm = document.getElementById('confirmation')
    console.log("Calling GPT3 with prompt: " + prompt)
    var url = "https://api.openai.com/v1/engines/davinci/completions";
    var bearer = 'Bearer ' + API_KEY
    confirm.textContent = "Loading..."
    return fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': bearer,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "prompt": prompt,
            "max_tokens": 150,
            "temperature": 1,
            "top_p": 1,
            "n": 1,
            "stream": false,
            "logprobs": null,
            "stop": "\n"
        })
    }).then(response => { 
        return response.json()  
    })    .catch(error => {
        console.log(error)
        confirm.textContent = "error!";
        confirm.style.color = "red";
        console.log('Something bad happened ' + error);
    })
    .then(data=>{
        confirm.textContent = data.error.message
        confirm.style.color = "red";
        console.log(typeof data)
        console.log(Object.keys(data))
        return data['choices'][0].text
    });


}




function stripHtml(html) {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}