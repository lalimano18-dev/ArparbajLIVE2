// Headless Edge-ben futó, a tényleges admin DOM-gombokat kattintó smoke teszt.
const http=require("http"),WebSocket=require("ws");
function getJson(url){return new Promise((resolve,reject)=>http.get(url,response=>{let body="";response.on("data",chunk=>body+=chunk);response.on("end",()=>resolve(JSON.parse(body)))}).on("error",reject))}
async function main(){const pages=await getJson("http://127.0.0.1:9222/json"),page=pages.find(item=>item.type==="page"&&item.url.includes("/admin"));if(!page)throw new Error("Az admin oldal nincs megnyitva az Edge-ben.");const ws=new WebSocket(page.webSocketDebuggerUrl),pending=new Map();let id=0;ws.on("message",raw=>{const message=JSON.parse(raw);if(message.id)pending.get(message.id)?.(message)});await new Promise(resolve=>ws.once("open",resolve));const evaluate=expression=>new Promise((resolve,reject)=>{const requestId=++id;pending.set(requestId,message=>{pending.delete(requestId);message.error?reject(new Error(message.error.message)):resolve(message.result.result.value)});ws.send(JSON.stringify({id:requestId,method:"Runtime.evaluate",params:{expression,returnByValue:true,awaitPromise:true}}))});
  const waitFor=async(expression)=>{for(let attempt=0;attempt<60;attempt++){if(await evaluate(expression))return;await new Promise(resolve=>setTimeout(resolve,250))}throw new Error(`Időtúllépés: ${expression}`)};
  await evaluate(`document.querySelector('#maxQuestions').value=1;document.querySelector('#countdown').value=20;document.querySelector('#between').value=1;document.querySelector('#testName').value='Browser_CVPB_20260720';document.querySelector('#createTestPlayer').click();document.querySelector('#start').click();true`);
  await waitFor(`document.querySelectorAll('#testAnswers button').length===4`);
  const ids=await evaluate(`[...document.querySelectorAll('#testAnswers button')].map(button=>button.dataset.answerId)`);
  const clicked=await evaluate(`document.querySelector('#testAnswers button').dataset.answerId`);
  await evaluate(`document.querySelector('#testAnswers button').click();true`);
  await waitFor(`document.querySelector('#testStatus').textContent.includes('elfogadva')`);
  const accepted=await evaluate(`document.querySelector('#testStatus').textContent`);
  await evaluate(`document.querySelector('#testAnswers button').click();true`);
  await waitFor(`document.querySelector('#testStatus').textContent.includes('már válaszolt')`);
  console.log(JSON.stringify({ok:true,actualButtonIds:ids,clickedAnswerId:clicked,acceptedStatus:accepted,duplicateStatus:await evaluate("document.querySelector('#testStatus').textContent")},null,2));ws.close();
}
main().catch(error=>{console.error(error.stack);process.exit(1)});
