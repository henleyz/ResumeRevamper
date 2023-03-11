
// Assing buttons to function

document.getElementById("ResumeStoreButton").addEventListener("click", storeResume);





function storeResume(){
  const resumeText = document.getElementById('resumeBox')
  chrome.storage.local.set({ 'resume': '' }).then(() => {
    console.log("Resume Cleared");
  });
  chrome.storage.local.set({ 'resume': resumeText.value }).then(() => {
      console.log("Resume Stored");
  });
  resumeText.value = "";
}


function scrapeJobDescription(){

}

function generateSuggestions(){

}
