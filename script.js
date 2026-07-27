const s=io(),$=id=>document.getElementById(id);
let roundId=null,timer=null,roundRanking=[],tournamentRanking=[];
const audio={timer:new Audio("sounds/timer.wav"),crowd:new Audio("sounds/crowd.wav")};

let tickAudioCtx=null;
function clockTick(){
  try{
    tickAudioCtx=tickAudioCtx||new (window.AudioContext||window.webkitAudioContext)();
    const o=tickAudioCtx.createOscillator(),g=tickAudioCtx.createGain();
    o.frequency.value=900;g.gain.setValueAtTime(.055,tickAudioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,tickAudioCtx.currentTime+.035);
    o.connect(g);g.connect(tickAudioCtx.destination);o.start();o.stop(tickAudioCtx.currentTime+.04);
  }catch(e){}
}
function renderAllTimeTop3(players=[]){
  const box=$("allTimeTop3");if(!box)return;const medals=["🥇","🥈","🥉"],a=players.slice(0,3);
  while(a.length<3)a.push({name:"—",score:0});
  box.innerHTML=a.map((p,i)=>`<div class="alltime-row"><span>${medals[i]}</span><b>${p.name||"—"}</b><strong>${Number(p.score)||0}</strong></div>`).join("");
}
Object.values(audio).forEach(a=>{a.preload="auto";a.volume=.75});
function play(n){try{audio[n].currentTime=0;audio[n].play().catch(()=>{})}catch(e){}}
function diffKey(n){n=Number(n)||1;return n>=5?"hard":n>=3?"medium":"easy"}
function setGifts(rules){
  const box=$("giftRules");if(!box)return;
  if(!rules||!rules.length){box.innerHTML='<div class="gift-rule">Nincs ajándék</div>';return}
  box.innerHTML=rules.map(g=>`<div class="gift-rule"><div class="gift-points">${g.multiplier}× szorzó</div><div class="gift-mult">🪙 ${g.points}</div></div>`).join("");
}
function setDiff(n){const e=$("nehezseg"),k=diffKey(n);if(e)e.textContent=k==="hard"?"🔴 Nehéz":k==="medium"?"🟠 Közepes":"🟢 Könnyű"}
function renderQuestion(d){
  const q=d.question||{};
  roundId=d.roundId;
  $("kerdesSzam").textContent=`${d.questionNumber}/${d.maxQuestions}. KÉRDÉS`;
  $("termek").textContent=q.termek||"";
  const kat=$("kategoria");if(kat)kat.textContent=q.kategoria||"ÁrPárbaj";
  setDiff(q.nehezseg);setGifts(d.giftRules);
  const img=$("termekkep");
  if(q.kep){img.src=q.kep.startsWith("/")?q.kep:"/"+q.kep;img.style.display="block"}
  const box=$("valaszok");box.innerHTML="";
  (q.answers||[]).forEach(a=>{
    const b=document.createElement("div");b.className="answer-card";
    b.innerHTML=`<span class="answer-letter">${a.letter}</span><span class="answer-price">${Number(a.price).toLocaleString("hu-HU")} Ft</span>`;
    box.appendChild(b);
  });
  $("eredmeny").innerHTML="";
  clearInterval(timer);
  let left=Number(d.countdown)||20;
  $("ido").textContent=left;
  let ticked=false;
  timer=setInterval(()=>{
    left--;$("ido").textContent=Math.max(0,left);
    if(left<=5&&left>0)clockTick()
    if(left<=0){clearInterval(timer);s.emit("timeExpired",{roundId})}
  },1000);
}
function launchPodium(top3){
  clearInterval(timer);clearInterval(fixBoardTimer);
  const o=$("podiumOverlay");o.classList.add("show");
  [1,2,3].forEach((n,i)=>{
    const p=top3[i]||{name:"—",score:0,avatar:""},el=$("podium"+n);
    if(!el)return;
    el.querySelector(".pname").textContent=p.name||"—";
    el.querySelector(".pscore").textContent=(p.score||0)+" PONT";
    const img=el.querySelector(".avatar-img");
    const emoji=el.querySelector(".avatar-emoji");
    if(img&&p.avatar){img.src=p.avatar;img.style.display="block";if(emoji)emoji.style.display="none"}else if(img){img.style.display="none"}
    if(emoji&&!p.avatar){emoji.style.display="";emoji.textContent=n===1?"🥇":n===2?"🥈":"🥉"}
  });
  play("crowd");fireworks();
}
function fireworks(){
  const c=$("fireworks");if(!c)return;
  const x=c.getContext("2d");c.width=innerWidth;c.height=innerHeight;
  const palette=["#ffd226","#ff9d2a","#ff58b9","#c780ff","#5ce4ff","#ffffff"];
  const particles=Array.from({length:120},()=>({x:Math.random()*c.width,y:Math.random()*c.height*.5+20,vx:(Math.random()-.5)*3,vy:1+Math.random()*2.5,life:120+Math.random()*80,color:palette[Math.floor(Math.random()*palette.length)]}));
  let f=0;(function anim(){x.clearRect(0,0,c.width,c.height);particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.012;p.life--;x.fillStyle=p.color;x.globalAlpha=Math.max(0,p.life/180);x.fillRect(p.x,p.y,3,3)});x.globalAlpha=1;if(f++<220)requestAnimationFrame(anim)})()
}
s.on("connect",()=>console.log("Kapcsolódva:",s.id));
s.on("tournamentStarted",()=>{$("podiumOverlay").classList.remove("show");roundRanking=[];tournamentRanking=[];fixBoardIndex=0;fixStartBoardRotation()});
s.on("questionStarted",d=>renderQuestion(d));
s.on("roundEnded",d=>{clearInterval(timer);$("ido").textContent="0";roundRanking=d.roundRanking||[];tournamentRanking=d.tournamentRanking||tournamentRanking;fixBoardIndex=0;fixRenderBoard();const e=$("eredmeny");e.innerHTML=`<span class="correct-label">HELYES VÁLASZ</span><strong>${d.correctLetter}</strong><span>${Number(d.correctPrice).toLocaleString("hu-HU")} Ft</span>`});
s.on("leaderboardUpdated",d=>{tournamentRanking=d.players||[];const pc=$("playerCount");if(pc)pc.textContent=d.activePlayerCount||tournamentRanking.length;fixRenderBoard()});
s.on("tournamentEnded",d=>{tournamentRanking=(d.players&&d.players.length)?d.players:tournamentRanking;fixRenderBoard();const top3=(d.top3&&d.top3.length)?d.top3:(tournamentRanking.length?tournamentRanking:(d.players||[])).slice(0,3);setTimeout(()=>launchPodium(top3),1200)});
s.on("showRankingOverlay",d=>{const o=$("rankingOverlay");if(!o)return;const title=$("rankingTitle");const list=$("rankingList");const typeTitles={daily:"🏆 NAPI TOP 25",weekly:"🏆 HETI TOP 25",monthly:"🏆 HAVI TOP 25",allTime:"🏆 ÖRÖK TOP 25"};if(title)title.textContent=typeTitles[d?.type]||d?.title||"🏆 RANGLISTA";if(list){const rows=(d?.players||[]).slice(0,25);list.innerHTML=rows.length?rows.map((p,i)=>`<div class="ranking-row ${i<1?"gold":i===1?"silver":i===2?"bronze":""}"><span class="r-pos">${i+1}.</span><span class="r-name">${escapeHtml(p.name||"—")}</span><span class="r-score">${Number(p.score)||0}</span></div>`).join(""):'<div class="ranking-row"><span class="r-pos">—</span><span class="r-name">Még nincs eredmény</span><span class="r-score">0</span></div>'}o.classList.add("show")});
s.on("hideRankingOverlay",()=>{const o=$("rankingOverlay");if(o)o.classList.remove("show")});
$("closeRankingBtn")?.addEventListener("click",()=>s.emit("hideRanking"));
s.on("showPodiumManually",d=>launchPodium(d.top3||[]));
s.on("hidePodiumManually",()=>{$("podiumOverlay").classList.remove("show")});
s.on("gamePaused",()=>{$("pauseOverlay").classList.add("show")});s.on("gameResumed",()=>{$("pauseOverlay").classList.remove("show")});s.on("gameStopped",()=>{clearInterval(timer);$("kerdesSzam").textContent="VÁRAKOZÁS"});

s.on("viewerCount",()=>{const e=$("viewerStat");if(e)e.textContent="—"});

function escapeHtml(input){
  if(!input)return "";
  const s=String(input);
  const a=s.split("&");const b=a.join("&");
  const c=b.split("<");const d=c.join("<");
  const e=d.split(">");const f=e.join(">");
  const g=f.split('"');const h=g.join('"');
  return h;
}
function unlockAudio(){Object.values(audio).forEach(a=>{a.play().then(()=>{a.pause();a.currentTime=0}).catch(()=>{})});document.removeEventListener("click",unlockAudio)}document.addEventListener("click",unlockAudio);
s.on("persistentRankings",d=>renderAllTimeTop3(d?.allTime||[]));s.on("allTimeTop3",d=>renderAllTimeTop3(d?.players||[]));s.emit("getPersistentRankings");

let playerPersistentRanks={daily:[],weekly:[],monthly:[],allTime:[]},playerActiveRankTab="daily";
function renderPlayerPersistent(){const box=document.getElementById("playerPersistentRankingList");if(!box)return;const rows=(playerPersistentRanks[playerActiveRankTab]||[]).slice(0,10);box.innerHTML=rows.length?rows.map((p,i)=>`<div class="player-rank-row"><span>${i+1}.</span><b>${p.name||"—"}</b><strong>${Number(p.score)||0}</strong></div>`).join(""):`<div class="player-rank-row"><span>—</span><b>Még nincs eredmény</b><strong>0</strong></div>`}
document.addEventListener("click",e=>{const b=e.target.closest("#playerRankingTabs button");if(!b)return;document.querySelectorAll("#playerRankingTabs button").forEach(x=>x.classList.remove("active"));b.classList.add("active");playerActiveRankTab=b.dataset.tab;renderPlayerPersistent()});
s.on("persistentRankings",d=>{playerPersistentRanks=d||playerPersistentRanks;renderPlayerPersistent()});

let persistentBoards={daily:[],weekly:[],monthly:[],allTime:[]},fixBoardIndex=0,fixBoardTimer=null,fixBoardCountdown=5;
const fixModes=[
  {key:"round",title:"⚡ UTOLSÓ KÉRDÉS PONTSZÁMAI"},
  {key:"tournament",title:"👑 VERSENY ÁLLÁSA"}
];
function fixRenderBoard(){
  const m=fixModes[fixBoardIndex],title=$("rankTitle"),list=$("toplista");if(!list)return;
  if(title)title.textContent=m.title;
  const arr=(m.key==="round"?roundRanking:tournamentRanking).slice(0,25);
  list.style.transform="none";
  list.innerHTML=arr.length?arr.map((p,i)=>`<div class="rank-row ${i<3?"top-"+(i+1):""}><span class="rank-pos">${i+1}</span><span class="rank-name">${p.name||"—"}</span><span class="rank-score">${Number(p.score)||0}</span></div>`).join(""):'<div class="rank-row"><span class="rank-pos">—</span><span class="rank-name">Még nincs eredmény</span><span class="rank-score">0</span></div>';
  const cd=$("switchCountdown");if(cd)cd.textContent=fixBoardCountdown;
}
function fixStartBoardRotation(){clearInterval(fixBoardTimer);fixBoardCountdown=5;fixRenderBoard();fixBoardTimer=setInterval(()=>{fixBoardCountdown--;if(fixBoardCountdown<=0){fixBoardIndex=(fixBoardIndex+1)%fixModes.length;fixBoardCountdown=5;fixRenderBoard()}else{const cd=$("switchCountdown");if(cd)cd.textContent=fixBoardCountdown}},1000)}
s.on("persistentRankings",d=>{persistentBoards=d||persistentBoards;renderAllTimeTop3?.(persistentBoards.allTime||[]);fixRenderBoard()});
s.on("leaderboardUpdated",d=>{tournamentRanking=d.players||[];fixRenderBoard()});
s.on("roundEnded",d=>{roundRanking=d.roundRanking||[];tournamentRanking=d.tournamentRanking||tournamentRanking;fixBoardIndex=0;fixRenderBoard()});
s.on("tournamentStarted",()=>{roundRanking=[];tournamentRanking=[];fixBoardIndex=0;fixStartBoardRotation()});
s.on("questionStarted",d=>{clearInterval(timer);roundId=d.roundId;let left=Number(d.countdown)||20;$("ido").textContent=left;timer=setInterval(()=>{left--;$("ido").textContent=Math.max(0,left);if(left<=5&&left>0)clockTick();if(left<=0)clearInterval(timer)},1000)});
s.on("gamePaused",d=>{clearInterval(timer);$("pauseOverlay")?.classList.add("show");if($("ido")&&d?.remaining!=null)$("ido").textContent=d.remaining});
s.on("questionResumed",d=>{clearInterval(timer);let left=Number(d.remaining)||0;$("ido").textContent=left;timer=setInterval(()=>{left--;$("ido").textContent=Math.max(0,left);if(left<=5&&left>0)clockTick();if(left<=0)clearInterval(timer)},1000)});
s.on("gameResumed",()=>$("pauseOverlay")?.classList.remove("show"));
s.emit("getPersistentRankings");fixStartBoardRotation();