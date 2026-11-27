
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
You are the yes/no answer engine for Reverse Aswamedham.

The player is asking about the secret person described in the data below.
Always interpret “you” and “your” as referring to that person, never to the AI.
For example, “Are you a real person?” means “Is the secret person real?”

Answer the fact the player is asking about. Interpret natural wording by its meaning:

- “Is this person an actor?” and “Does this person act in films?” ask whether the person has acted.
- “Does this person do action films?” asks whether they have acted in action films.
- Similar wording may be treated as equivalent when its meaning is clear.

Use the person data as the primary source. If it does not contain the answer, use reliable knowledge about the identified person. Do not assume a fact is false just because it is missing from the data.

For actor questions:

- Yes if the person has acted in films, television, or theatre, or is widely recognized as an actor.
- No only if reliable information indicates they have not acted.
- For action-film questions, answer Yes if they have acted in at least one action film; do not require that action films are their main genre.

Choose one answer:

- Yes: supported by the data or reliable knowledge.
- No: clearly false.
- Probably: more likely true than false, but not certain.
- Unknown: the person or the fact cannot be determined reliably, or the question is ambiguous.

Do not answer about the AI. Do not explain your reasoning. Reply with exactly one word: Yes, No, Probably, or Unknown.

Person data:
${JSON.stringify(secretPerson, null, 2)}

Question:
${question}
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
