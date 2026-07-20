const s=io(),$=id=>document.getElementById(id);
const testPlayers=[];let currentAnswers=[];
let autoRotateTimer=null;let autoRotateShowingRound=false;

function showRoundView(){autoRotateShowingRound=true;const tourn=$("view-tournament");if(tourn)tourn.style.display="none";const rnd=$("view-round");if(rnd)rnd.style.display="";}
function showTournamentView(){autoRotateShowingRound=false;const rnd=$("view-round");if(rnd)rnd.style.display="none";const tourn=$("view-tournament");if(tourn)tourn.style.display="";}
function resetAutoRotate(){clearTimeout(autoRotateTimer);autoRotateTimer=setTimeout(()=>{autoRotateShowingRound?showTournamentView():showRoundView();autoRotateTimer=setTimeout(resetAutoRotate,5000)},5000);autoRotateShowingRound=true;showRoundView();}
function status(message,ok=true){const el=$("testStatus");if(el){el.textContent=message;el.className=ok?"test-status ok":"test-status error"}}
function renderTestPlayers(){const select=$("testPlayer");if(!select)return;select.innerHTML=testPlayers.length?testPlayers.map(name=>`<option value="${name}">${name}</option>`).join(""):'<option value="">Előbb hozz létre játékost</option>'}
function renderAnswerButtons(){const box=$("testAnswers");if(!box)return;box.innerHTML=currentAnswers.length?currentAnswers.map(answer=>{const answerId=String(answer.answerId??answer.letter??"").trim().toUpperCase();return `<button type="button" data-answer-id="${answerId}"><b>${answerId}</b> — ${Number(answer.price).toLocaleString("hu-HU")} Ft</button>`}).join(""):'<span>Indíts játékot az aktuális válaszokhoz.</span>';box.querySelectorAll("button").forEach(button=>button.onclick=()=>submitTestAnswer(button.dataset.answerId));}
function submitTestAnswer(answerId){const name=$("testPlayer")?.value;if(!name)return status("Előbb hozz létre és válassz tesztjátékost.",false);const payload={name,answerId,letter:answerId};console.debug("[testAnswer] kattintott answerId:",answerId,"| payload:",payload);s.emit("testAnswer",payload,reply=>{console.debug("[testAnswer] szerver válasza:",reply);status(reply?.message||"Nincs válasz a szervertől.",!!reply?.ok)})}
$("createTestPlayer")?.addEventListener("click",()=>{const input=$("testName"),name=input?.value.trim();if(!name)return status("Adj meg egy egyedi tesztjátékos-nevet.",false);if(testPlayers.some(p=>p.localeCompare(name,"hu",{sensitivity:"accent"})===0))return status("Ez a tesztjátékos már létezik.",false);testPlayers.push(name);renderTestPlayers();$("testPlayer").value=name;input.value="";status(`${name} létrehozva.`)});

$("image").onchange=()=>$("fileName").textContent=$("image").files[0]?.name||"Kép kiválasztása…";
$("start").onclick=()=>s.emit("startGame",{countdown:+$("countdown").value,between:+$("between").value,maxQuestions:+$("maxQuestions").value,autoMode:$("autoMode").checked});
$("pause").onclick=()=>s.emit("pauseGame");$("resume").onclick=()=>s.emit("resumeGame");$("next").onclick=()=>s.emit("nextQuestion");$("stop").onclick=()=>s.emit("stopGame");
$("mentes").onclick=async()=>{const file=$("image").files[0];if(!file)return alert("Válassz képet!");const fd=new FormData;fd.append("image",file);const response=await fetch("/api/upload",{method:"POST",body:fd}),data=await response.json();if(data.ok)s.emit("saveQuestion",{termek:$("termek").value.trim(),helyesAr:+$("helyesAr").value,kep:data.path,nehezseg:+$("nehezseg").value,kategoria:$("kategoria").value.trim()})};
s.on("adminMessage",d=>{$("status").textContent=d.message;if(d.ok)s.emit("getQuestions")});
s.on("questionsUpdated",questions=>{$("tbody").innerHTML="";questions.forEach(q=>{const tr=document.createElement("tr");tr.innerHTML=`<td><img src="${q.kep}"></td><td>${q.termek}</td><td>${q.helyesAr.toLocaleString("hu-HU")} Ft</td><td>${q.kategoria||"-"}</td><td><button>🗑️</button></td>`;tr.querySelector("button").onclick=()=>confirm("Törlöd?")&&s.emit("deleteQuestion",q.id);$("tbody").appendChild(tr)})});s.emit("getQuestions");

function renderRanking(id,players=[]){const el=$(id);if(el)el.innerHTML=players.length?players.slice(0,25).map((p,i)=>`<div class="admin-rank-row"><span>${i+1}. ${p.name||"—"}</span><b>${Number(p.score)||0} pont</b></div>`).join(""):'<div class="admin-rank-empty">Még nincs eredmény</div>'}
s.on("questionStarted",d=>{currentAnswers=d.question?.answers||[];console.debug("[testAnswer] aktuális answerOptions:",currentAnswers.map(a=>a.answerId??a.letter));renderAnswerButtons();status(`Aktuális kérdés: ${currentAnswers.map(a=>a.answerId??a.letter).join(", ")}.`);showRoundView();resetAutoRotate()});
s.on("answerAccepted",d=>status(`${d.name}: ${d.letter} elfogadva (${d.activePlayerCount} aktív játékos).`));
s.on("roundEnded",d=>{renderRanking("adminRoundRanking",d.roundRanking);renderRanking("adminTournamentRanking",d.tournamentRanking);const details=(d.answerResults||[]).map(r=>`${r.name}: ${r.correct?"helyes":"helytelen"}, ${r.score} pont (${r.multiplier}×)`).join(" | ");if(details)status(details);showRoundView();resetAutoRotate()});
s.on("leaderboardUpdated",d=>{renderRanking("adminTournamentRanking",d.players);renderRanking("adminRoundRanking")});
s.on("tournamentStarted",()=>{renderRanking("adminRoundRanking");renderRanking("adminTournamentRanking");currentAnswers=[];renderAnswerButtons();showRoundView();resetAutoRotate()});

$("connectTikTokBtn")?.addEventListener("click",()=>s.emit("connectTikTok",{username:$("tiktokUsername")?.value||""}));$("disconnectTikTokBtn")?.addEventListener("click",()=>s.emit("disconnectTikTok"));
s.on("tiktokStatus",d=>{const el=$("tiktokStatus");if(el)el.textContent=`${d.status==="connected"?"🟢":d.status==="connecting"?"🟡":"🔴"} ${d.message||d.status}${d.username?" @"+d.username:""}`});
$("showPodium").onclick=()=>s.emit("showPodium");$("hidePodium").onclick=()=>s.emit("hidePodium");

let persistentRanks={daily:[],weekly:[],monthly:[],allTime:[]},activeRankTab="daily";
function renderPersistent(){const el=$("persistentRankingList"),rows=persistentRanks[activeRankTab]||[];if(el)el.innerHTML=rows.length?rows.slice(0,100).map((p,i)=>`<div class="admin-rank-row"><span>${i+1}.</span><b>${p.name||"—"}</b><strong>${Number(p.score)||0}</strong></div>`).join(""):'<div class="admin-rank-empty">Még nincs eredmény</div>'}
document.querySelectorAll("#rankingTabs button").forEach(button=>button.addEventListener("click",()=>{document.querySelectorAll("#rankingTabs button").forEach(b=>b.classList.remove("active"));button.classList.add("active");activeRankTab=button.dataset.tab;renderPersistent()}));
s.on("persistentRankings",d=>{persistentRanks=d||persistentRanks;renderPersistent()});s.emit("getPersistentRankings");
s.on("gameState",d=>{$("status").textContent=`${d.running?"🟢 Fut":"⏹ Leáll"}`+(d.paused?" | szünetel":"")});
