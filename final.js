// ==================================================
// === CONFIG =======================================
// ==================================================

// 70-character roster
const fullRoster = [
    "Naruto Uzumaki","Sasuke Uchiha","Sakura Haruno","Kakashi Hatake","Hinata Hyuga",
    "Shikamaru Nara","Ino Yamanaka","Choji Akimichi","Neji Hyuga","Rock Lee","Tenten","Might Guy",
    "Gaara","Temari","Kankuro","Jiraiya","Tsunade","Orochimaru","Hiruzen Sarutobi","Minato Namikaze",
    "Hashirama Senju","Tobirama Senju","Itachi Uchiha","Pain","Nagato","Konan","Kisame Hoshigaki",
    "Deidara","Sasori","Hidan","Kakuzu","Madara Uchiha","Obito Uchiha","Zetsu","Yahiko","Boruto Uzumaki",
    "Sarada Uchiha","Mitsuki","Kawaki","Sumire Kakei","Shikadai Nara","Inojin Yamanaka","Chocho Akimichi",
    "Momoshiki Otsutsuki","Kinshiki Otsutsuki","Isshiki Otsutsuki","Eida","Daemon","Code","Sai","Yamato",
    "Killer Bee","Darui","Onoki","Zabuza Momochi","Haku","Asuma Sarutobi","Shibai Otsutsuki","Shino Aburame",
    "Anko Mitarashi","Moegi Kazamatsuri","Konohamaru Sarutobi","Toneri Otsutsuki","Hamura Otsutsuki",
    "Hanabi Hyuga","Hiashi Hyuga","Kaguya Otsutsuki","Indra Otsutsuki","Ashura Otsutsuki","Hagoromo Otsutsuki"
];

// 8 roles (Option 2 internal format)
const roleKeys = [
    "Captain",
    "Vice_Captain",
    "Damage_Dealer",
    "Tank",
    "Supporter_1",
    "Supporter_2",
    "Strategist",
    "Healer"
];

// ==================================================
// === STATE ========================================
// ==================================================

let team = "A"; // current team = "A" or "B"
let teamA = {};
let teamB = {};

let remaining = [...fullRoster]; // pool per team
let usedSkipA = false;
let usedSkipB = false;

let currentCharacter = null;
let spinning = false;

const rolesAssignedA = new Set();
const rolesAssignedB = new Set();

// Track remaining roles per team
let rolesLeftA = new Set(roleKeys);
let rolesLeftB = new Set(roleKeys);
// ==================================================
// === DOM ELEMENTS =================================
// ==================================================

const spinBtn = document.getElementById("spinBtn");
const turnLabel = document.getElementById("turnLabel");
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const kunai = document.getElementById("kunai");

const cardModal = document.getElementById("cardModal");
const charName = document.getElementById("charName");
const charPortrait = document.getElementById("charPortrait");
const roleSelect = document.getElementById("roleSelect");
const assignBtn = document.getElementById("assignBtn");
const skipBtn = document.getElementById("skipBtn");

// ==================================================
// === WHEEL RENDER =================================
// ==================================================

let rotation = 0;

function drawWheel() {
    const radius = canvas.width/2;
    const slice = 2*Math.PI/remaining.length;

    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(rotation);

    for (let i=0; i<remaining.length; i++) {
        const start = i*slice - slice/2;
        ctx.beginPath();
        const grad = ctx.createLinearGradient(0,0,400,400);
        grad.addColorStop(0, "#3fa9f5");
        grad.addColorStop(1, "#ff7f0e");
        ctx.fillStyle = grad;
        ctx.moveTo(0,0);
        ctx.arc(0,0,radius,start,start+slice);
        ctx.fill();

        ctx.save();
        ctx.rotate(start + slice/2);
        ctx.textAlign="center";
        ctx.fillStyle="#fff";
        ctx.font="10px Arial";
        ctx.fillText(remaining[i], radius-60, 4);
        ctx.restore();
    }
    ctx.restore();
}

drawWheel();

// ==================================================
// === KUNAI POSITION =================================
// ==================================================

function positionKunai() {
    const rect = canvas.getBoundingClientRect();
    const radius = rect.width/2;
    const kunaiWidth = 45;

    const cx = rect.left + radius;
    const cy = rect.top + radius;

    const angle = 0; // right side
    const tipX = cx + radius * Math.cos(angle);
    const tipY = cy + radius * Math.sin(angle);

    kunai.style.left = (tipX - 17) + "px";
    kunai.style.top = (tipY - kunaiWidth/0.4) + "px"; 
}

window.addEventListener("resize", positionKunai);
window.addEventListener("load", positionKunai);

// ==================================================
// === SPIN LOGIC ====================================
// ==================================================

canvas.onclick = spinBtn.onclick = () => {
    if (spinning || remaining.length===0) return;
    spinning = true;
    spinBtn.disabled = true;

    const spinDuration = 2000;
    const start = performance.now();
    const randomTurns = (Math.random()*3+2)*2*Math.PI;
    const initialRotation = rotation;

    function animate(time) {
        const progress = Math.min((time-start)/spinDuration,1);
        const easeOut = 1 - Math.pow(1-progress,3);
        rotation = initialRotation + randomTurns*easeOut;
        drawWheel();
        positionKunai();
        if (progress<1) {
            requestAnimationFrame(animate);
        } else {
            rotation = rotation%(2*Math.PI);
            selectWinner();
            spinBtn.disabled = false;
        }
    }
    requestAnimationFrame(animate);
};

// ==================================================
// === WINNER SELECTION ==============================
// ==================================================

function selectWinner() {
    const slice = 2*Math.PI/remaining.length;
    const hit = 0; // right side
    let adjusted = (hit - rotation + slice/2)%(2*Math.PI);
    if (adjusted<0) adjusted+=2*Math.PI;
    const index = Math.floor(adjusted/slice)%remaining.length;
    currentCharacter = remaining[index];
    openCard(currentCharacter);
}

// ==================================================
// === CARD HANDLING =================================
// ==================================================

function imgFile(name) {
    return "Images/Characters/" + name.replace(/ /g,"_") + ".png";
}

function openCard(name) {
    charName.textContent = name;
    charPortrait.src = imgFile(name);
    charPortrait.onerror = () => { charPortrait.src=""; charPortrait.style.background="#333"; };

    // populate dropdown with remaining roles
    roleSelect.innerHTML = "";
    const assignedSet = (team==="A") ? rolesAssignedA : rolesAssignedB;

    for (let r of roleKeys) {
        if (!assignedSet.has(r)) {
            const opt = document.createElement("option");
            opt.value = r;
            opt.textContent = r.replace(/_/g," ");
            roleSelect.appendChild(opt);
        }
    }

    // configure skip button
    if ((team==="A" && usedSkipA) || (team==="B" && usedSkipB)) {
        skipBtn.style.display = "none";
    } else {
        skipBtn.style.display = "block";
    }

    cardModal.style.display = "flex";
    const card = document.getElementById("cardContent");
    card.classList.remove("revealAnimation");
    void card.offsetWidth;
    card.classList.add("revealAnimation");
}

// ==================================================
// === ASSIGN / SKIP =================================
// ==================================================

assignBtn.onclick = () => {
    const role = roleSelect.value;
    if (team==="A") {
        teamA[role] = currentCharacter;
        rolesAssignedA.add(role);
    } else {
        teamB[role] = currentCharacter;
        rolesAssignedB.add(role);
    }
    removeCharacter(currentCharacter);
    closeCard();
    checkEndOrContinue();
};

skipBtn.onclick = () => {
    if (team==="A") usedSkipA = true;
    else usedSkipB = true;

    removeCharacter(currentCharacter);
    closeCard();
    checkEndOrContinue();
};

function removeCharacter(c) {
    remaining = remaining.filter(x=>x!==c);
}

// ==================================================
// === TURN FLOW =====================================
// ==================================================

function checkEndOrContinue() {
    spinning = false;

    if (team==="A" && rolesAssignedA.size===8) {
        startTeamB();
        return;
    }
    if (team==="B" && rolesAssignedB.size===8) {
        endGame();
        return;
    }
    drawWheel();
}

function startTeamB() {
    team = "B";
    turnLabel.textContent = "Team B's Turn";
    remaining = [...fullRoster];
    usedSkipB = false;
    drawWheel();
}
function buildFinalOutput() {
    let text = "";

    text += "Team A:\n";
    for (let r of roleKeys) {
        text += `- ${r.replace(/_/g," ")} - ${teamA[r] || ""}\n`;
    }

    text += "\nTeam B:\n";
    for (let r of roleKeys) {
        text += `- ${r.replace(/_/g," ")} - ${teamB[r] || ""}\n`;
    }

    text += `

Roles definitions:
Captain: leads team strategy and coordination
Vice Captain: assists captain and is his right hand man
Tank: absorbs damage and protects allies
Damage Dealer: highest offensive output low defense
Supporter_1 and Supporter_2: provide intel, battle support or assassinations
Strategist: creates war strategies and directs team
Healer: heals team members during war; stronger on small units

Rules for analysis:
- Respect canon abilities only (from Anime-Naruto, Naruto Shippuden, Boruto Naruto's Next Generation Movie-Naruto The Last: Naruto the Movie and Manga-Boruto: Two Blue Vortex )
- Penalize roles that do not suit the character
- Consider team synergy, battle IQ, and power scaling
- No fan speculation or invented abilities

Question:
Which team would win in a serious battle and why?
(Consider peak versions Not the current Anime/Manga/Movie)
`;

    return text;
}

// ==================================================
// === END OF GAME ===================================
// ==================================================

function endGame() {
    turnLabel.textContent = "Draft Complete";
    spinBtn.disabled = true;

    const finalText = buildFinalOutput();
    showResultsModal(finalText);
}


// ==================================================
// === CLOSE CARD ====================================
// ==================================================

function closeCard() {
    cardModal.style.display = "none";
    spinning = false;
    spinBtn.disabled = false;
    drawWheel();
}
// ===================== VIEW LINEUP ===================== //

const viewLineupBtn = document.getElementById("viewLineupBtn");
const lineupModal = document.getElementById("lineupModal");
const lineupBody = document.getElementById("lineupBody");
const lineupCloseBtn = document.getElementById("lineupCloseBtn");

viewLineupBtn.onclick = () => {
    buildLineupTable();
    lineupModal.style.display = "flex";
};

lineupCloseBtn.onclick = () => {
    lineupModal.style.display = "none";
};

function buildLineupTable() {
    lineupBody.innerHTML = "";

    roleKeys.forEach(role => {
        const row = document.createElement("tr");

        const roleCell = document.createElement("td");
        roleCell.textContent = role.replace(/_/g," ");
        row.appendChild(roleCell);

        const teamACell = document.createElement("td");
        teamACell.textContent = teamA[role] || "To be Selected";
        if (!teamA[role]) teamACell.classList.add("toBeSelected");
        row.appendChild(teamACell);

        const teamBCell = document.createElement("td");
        teamBCell.textContent = teamB[role] || "To be Selected";
        if (!teamB[role]) teamBCell.classList.add("toBeSelected");
        row.appendChild(teamBCell);

        lineupBody.appendChild(row);
    });
}




// ================================================
// === RESULTS MODAL FUNCTIONS ====================
// ================================================

function showResultsModal(text) {
    document.getElementById("resultText").textContent = text;
    document.getElementById("resultModal").style.display = "flex";
}

// COPY TO CLIPBOARD
document.getElementById("copyResultsBtn").onclick = () => {
    const text = document.getElementById("resultText").textContent;
    navigator.clipboard.writeText(text).then(() => {
        alert("Copied to clipboard!");
    });
};

// RESTART DRAFT (simple refresh reset)
document.getElementById("restartBtn").onclick = () => {
    location.reload();
    // ==========================================
// === VIEW LINEUP FUNCTIONS ===============
// ==========================================

const viewLineupBtn = document.getElementById("viewLineupBtn");
const lineupModal = document.getElementById("lineupModal");
const lineupBody = document.getElementById("lineupBody");
const lineupCloseBtn = document.getElementById("lineupCloseBtn");

viewLineupBtn.onclick = () => {
    buildLineupTable();
    lineupModal.style.display = "flex";
};

lineupCloseBtn.onclick = () => {
    lineupModal.style.display = "none";
};

function buildLineupTable() {
    lineupBody.innerHTML = "";

    roleKeys.forEach(role => {
        const row = document.createElement("tr");

        const roleCell = document.createElement("td");
        roleCell.textContent = role.replace(/_/g," ");
        row.appendChild(roleCell);

        const teamACell = document.createElement("td");
        teamACell.textContent = teamA[role] || "To be Selected";
        if (!teamA[role]) teamACell.classList.add("toBeSelected");
        row.appendChild(teamACell);

        const teamBCell = document.createElement("td");
        teamBCell.textContent = teamB[role] || "To be Selected";
        if (!teamB[role]) teamBCell.classList.add("toBeSelected");
        row.appendChild(teamBCell);

        lineupBody.appendChild(row);
    });
}

};
