// Valódi, böngésző nélküli Socket.IO E2E teszt. Indítsd külön terminálban:
// node admin-debug.js
const WebSocket=require("ws");
const names=["E2E_Aquila_R4_20260720","E2E_Boren_R4_20260720","E2E_Cifra_R4_20260720"];
const expected={ [names[0]]:29,[names[1]]:19,[names[2]]:39 };
const scores=board=>Object.fromEntries((board||[]).filter(p=>names.includes(p.name)).map(p=>[p.name,p.score]));
const hasExpected=board=>names.every(name=>scores(board)[name]===expected[name]);
const port=process.env.PORT||3000;
const ws=new WebSocket(`ws://localhost:${port}/socket.io/?EIO=4&transport=websocket`);
let packetId=0,round=0,accepted=0,duplicateRejected=false,finished=false,persistent=null,leaderboardUpdates=0;
const acks=new Map();
function send(event,data,ack=false){const id=ack?packetId++:"";ws.send(`42${id}[${JSON.stringify(event)},${JSON.stringify(data)}]`);if(!ack)return Promise.resolve();return new Promise((resolve,reject)=>{acks.set(id,resolve);setTimeout(()=>{if(acks.delete(id))reject(new Error(`${event} ACK időtúllépés`))},3000)})}
function assert(ok,message){if(!ok)throw new Error(message)}
async function answer(name,answerId){return send("testAnswer",{name,answerId},true)}
async function play(question){round++;const answers=question.question.answers,correct=answers.find(a=>a.price===question.question.helyesAr),wrong=answers.find(a=>a.letter!==correct.letter);assert(correct&&wrong,`Hiányzó válasz a ${round}. körben`);
  if(round===1){assert((await answer(names[0],correct.letter)).ok,"Aquila helyes válaszát elutasította");assert((await answer(names[1],wrong.letter)).ok,"Boren hibás válaszát elutasította");assert((await answer(names[2],correct.letter)).ok,"Cifra helyes válaszát elutasította");const duplicate=await answer(names[0],correct.letter);duplicateRejected=!duplicate.ok;assert(duplicateRejected,"Az ismételt választ nem utasította el");await send("giftReceived",{name:names[0],points:1});}
  if(round===2){assert((await answer(names[1],correct.letter)).ok,"Boren helyes válaszát elutasította");assert((await answer(names[2],wrong.letter)).ok,"Cifra hibás válaszát elutasította");assert((await answer(names[0],correct.letter)).ok,"Aquila helyes válaszát elutasította");}
  if(round===3){assert((await answer(names[2],correct.letter)).ok,"Cifra helyes válaszát elutasította");assert((await answer(names[1],correct.letter)).ok,"Boren helyes válaszát elutasította");assert((await answer(names[0],wrong.letter)).ok,"Aquila hibás válaszát elutasította");await send("giftReceived",{name:names[2],points:20});}
  await send("nextQuestion",{});
}
ws.on("open",()=>{});
ws.on("message",async raw=>{try{for(const text of raw.toString().split("\x1e")){if(text.startsWith("0")){ws.send("40");continue}if(text.startsWith("40")){await send("startGame",{countdown:5,between:1,maxQuestions:3,autoMode:false});continue}if(text.startsWith("43")){const id=Number(text.match(/^43(\d+)/)?.[1]);const payload=JSON.parse(text.slice(2+String(id).length));acks.get(id)?.(payload[0]);acks.delete(id);continue}if(!text.startsWith("42"))continue;const [event,data]=JSON.parse(text.slice(2));
  if(event==="questionStarted")await play(data);
  if(event==="answerAccepted")accepted++;
  if(event==="leaderboardUpdated")leaderboardUpdates++;
  if(event==="persistentRankings")persistent=data;
  if(event==="roundEnded"){assert(data.answerResults?.length===3,`A ${round}. körben nem három feldolgozott válasz van`);assert(data.answerResults.some(r=>r.correct===false),`A ${round}. körben nem látszik hibás válasz`);assert(data.roundRanking.length===2,`A ${round}. kör pontozása hibás`);}
  if(event==="tournamentEnded"&&!finished){finished=true;assert(round===3,"Nem három kérdés futott le");assert(accepted===9,`Elfogadott válaszok: ${accepted}, várt: 9`);assert(duplicateRejected,"Az ismételt válasz ellenőrzése hiányzik");assert(leaderboardUpdates>=7,`Kevés leaderboardUpdated esemény: ${leaderboardUpdates}`);assert(hasExpected(data.players),`Hibás végső pontszám: ${JSON.stringify(scores(data.players))}`);for(const key of ["daily","weekly","monthly","allTime"])assert(hasExpected(persistent?.[key]),`${key} tartós ranglista hibás`);console.log(JSON.stringify({ok:true,names,expected,leaderboardUpdates,final:scores(data.players),persistent:{daily:scores(persistent.daily),weekly:scores(persistent.weekly),monthly:scores(persistent.monthly),allTime:scores(persistent.allTime)}},null,2));setTimeout(()=>{ws.close();process.exit(0)},250)}}}catch(error){console.error(JSON.stringify(raw.toString()));console.error(error.stack);ws.close();process.exit(1)}});
ws.on("close",(code,reason)=>{if(!finished){console.error(`Socket bezárult: ${code} ${reason}`);process.exit(1)}});
ws.on("error",error=>{console.error(`Socket hiba: ${error.message||error}`);process.exit(1)});
