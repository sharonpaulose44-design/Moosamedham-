
// ---------------- GAME STATE ----------------

let secretPerson;
let questionsLeft = 20;

// ---------------- ELEMENTS ----------------

const questionInput = document.getElementById("questionInput");
const guessInput = document.getElementById("guessInput");

const answer = document.getElementById("answer");
const questions = document.getElementById("questionsLeft");

const askBtn = document.getElementById("askBtn");
const guessBtn = document.getElementById("guessBtn");
const revealBtn = document.getElementById("revealBtn");
const newGameBtn = document.getElementById("newGameBtn");


// ---------------- CUSTOM POPUP ----------------

function showPopup(message) {

    let popup = document.getElementById("customPopup");

    if (!popup) {

        popup = document.createElement("div");
        popup.id = "customPopup";

        popup.innerHTML = `
            <div id="popupBox">
                <p id="popupMessage"></p>
                <button id="popupClose">ok</button>
            </div>
        `;

        document.body.appendChild(popup);

        document.getElementById("popupClose").onclick = function () {
            popup.style.display = "none";
        };

        popup.onclick = function (event) {
            if (event.target === popup) {
                popup.style.display = "none";
            }
        };
    }

    document.getElementById("popupMessage").innerText = message;

    popup.style.display = "flex";
}


// ---------------- START GAME ----------------

function startGame(){

    questionsLeft = 20;

    secretPerson =
        people[Math.floor(Math.random() * people.length)];

    questions.innerText = questionsLeft;

    // Clear old history
    document.getElementById("historyList").innerHTML = "";

    // Clear inputs
    questionInput.value = "";
    guessInput.value = "";

    // Enable buttons
    askBtn.disabled = false;
    guessBtn.disabled = false;
    revealBtn.disabled = false;

    // New game indication
    answer.innerText = "Arambikalama ?";

    // After 2 seconds, show normal message
    setTimeout(function(){

        answer.innerText =
            "Ask your first question !";

    }, 1500);
}


// ---------------- GET ANSWER ----------------

function getAnswer(q){

    // Alive
    if(q.includes("alive")){
        return secretPerson.alive ? "Yes" : "No";
    }

    // Gender
    if (/\bfemale\b|\bwoman\b/.test(q)) {
        return secretPerson.gender === "female" ? "Yes" : "No";
    }

    if (/\bmale\b|\bman\b/.test(q)) {
        return secretPerson.gender === "male" ? "Yes" : "No";
    }

    // Nationality
    const countries = [
        "indian",
        "german",
        "american",
        "french",
        "portuguese",
        "argentine",
        "hong kong"
    ];

    for(const country of countries){
        if(q.includes(country)){
            return secretPerson.nationality === country
                ? "Yes"
                : "No";
        }
    }

    // Awards
    for(const award of secretPerson.awards){
        if(q.includes(award.toLowerCase()) ||
           award.toLowerCase().includes(q)){
            return "Yes";
        }
    }

    // Known For
    for(const item of secretPerson.knownFor){
        if(q.includes(item.toLowerCase()) ||
           item.toLowerCase().includes(q)){
            return "Yes";
        }
    }

    // Facts
    for(const fact of secretPerson.facts){
        if(q.includes(fact.toLowerCase()) ||
           fact.toLowerCase().includes(q)){
            return "Yes";
        }
    }

    return "Unknown";
}


// ---------------- GEMINI API ----------------

async function askGemini(question){

    const prompt = `
You are playing Reverse Aswamedham.

The data below describes the person.

Use it as the primary source.

If the answer is not in the data but is a well-known public fact, use your own knowledge.

If you are genuinely unsure, answer Unknown.

Person:
${JSON.stringify(secretPerson, null, 2)}

Question:
${question}

Reply with ONLY one word:

Yes
No
Probably
Unknown
`;
    try{

        const res = await fetch("/api/ask", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                prompt: prompt
            })

        });

        const data = await res.json();

        return data.answer || "Unknown";

    }catch(err){

        console.error(err);

        return "Unknown";

    }

}


// ---------------- ASK QUESTION ----------------

async function askQuestion(){

    if(questionsLeft <= 0){
        answer.innerText = "No questions left!";
        return;
    }

    const q = questionInput.value.trim().toLowerCase();

    if(q === ""){
        answer.innerText = "Enter a question.";
        return;
    }

    let result = getAnswer(q);

    if(result === "Unknown"){

        answer.innerText = "Thinking...";

        result = await askGemini(q);

    }

    answer.innerText = result;

    addToHistory(q, result);

    questionsLeft--;

    questions.innerText = questionsLeft;

    questionInput.value = "";
}


// ---------------- CHECK GUESS ----------------

function checkGuess(){

    const guess = guessInput.value
        .trim()
        .toLowerCase();

    if(guess === ""){
        showPopup("Please enter a person's name.");
        return;
    }

    if(guess === secretPerson.name.toLowerCase()){

        answer.innerText = "You Won !";

        showPopup("🎉 Congratulations! You guessed the correct person.");

        askBtn.disabled = true;
        guessBtn.disabled = true;

    }else{

        answer.innerText = "❌ Wrong Guess!";

        showPopup("Try Again!");

    }

    guessInput.value = "";
}


// ---------------- QUESTION HISTORY ----------------

function addToHistory(question, answer) {

    const historyList = document.getElementById("historyList");

    const item = document.createElement("div");
    item.className = "historyItem";

    let answerClass = "answer-unknown";

    if (answer.toLowerCase() === "yes") {
        answerClass = "answer-yes";
    }
    else if (answer.toLowerCase() === "no") {
        answerClass = "answer-no";
    }
    else if (answer.toLowerCase().includes("probably")) {
        answerClass = "answer-probably";
    }

    item.innerHTML = `
        <span class="historyQuestion">${question}</span>
        <span class="historyAnswer ${answerClass}">
            ${answer}
        </span>
    `;

    historyList.appendChild(item);

}


// ---------------- REVEAL ANSWER ----------------

function revealAnswer(){
    showPopup(secretPerson.name);
}


// ---------------- SHOW SUMMARY ----------------

function showSummary(){
    showPopup(secretPerson.knownFor.join(", "));
}


// ---------------- BUTTON EVENTS ----------------

askBtn.onclick = askQuestion;
guessBtn.onclick = checkGuess;
revealBtn.onclick = revealAnswer;
newGameBtn.onclick = startGame;


// ---------------- START ----------------

startGame();
