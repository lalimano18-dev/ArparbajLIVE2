// TikTok LIVE bridge for ÁrPárbaj LIVE
let WebcastPushConnection=null;
try { ({WebcastPushConnection}=require("tiktok-live-connector")); } catch(e) {}

class TikTokBridge {
  constructor(io,{onAnswer,onGift}={}){this.io=io;this.conn=null;this.username="";this.onAnswer=onAnswer;this.onGift=onGift}
  status(status,message=""){this.io.emit("tiktokStatus",{status,username:this.username,message})}
  async connect(username){
    await this.disconnect();
    this.username=String(username||"").replace(/^@/,"").trim();
    if(!this.username)throw new Error("Adj meg TikTok felhasználónevet.");
    if(!WebcastPushConnection)throw new Error("A tiktok-live-connector nincs telepítve. Futtasd: npm install");
    this.status("connecting","Csatlakozás...");
    this.conn=new WebcastPushConnection(this.username);
    this.conn.on("chat",d=>{
      const text=String(d.comment||"").trim().toUpperCase();
      const m=text.match(/^[A-ZÁÉÍÓÖŐÚÜŰ]$/i);
      if(m&&this.onAnswer)this.onAnswer({name:d.nickname||d.uniqueId||"Játékos",user:d.uniqueId||d.nickname,letter:m[0],avatar:d.profilePictureUrl||""});
      this.io.emit("tiktokChat",{name:d.nickname||d.uniqueId||"Játékos",comment:d.comment||""});
    });
    this.conn.on("gift",d=>{
      // Streak gifts are counted when the streak finishes.
      if(d.giftType===1 && !d.repeatEnd)return;
      const repeat=Number(d.repeatCount)||1;
      const diamonds=(Number(d.diamondCount)||0)*repeat;
      const ev={name:d.nickname||d.uniqueId||"Játékos",user:d.uniqueId||d.nickname,giftName:d.giftName||"Ajándék",points:diamonds,coins:diamonds,repeatCount:repeat,avatar:d.profilePictureUrl||""};
      if(this.onGift)this.onGift(ev);
      this.io.emit("tiktokGift",ev);
    });
    this.conn.on("streamEnd",()=>this.status("disconnected","A LIVE véget ért."));
    try{
      const state=await this.conn.connect();
      this.status("connected","Csatlakozva a TikTok LIVE-hoz.");
      return state;
    }catch(e){this.status("error",e?.message||String(e));this.conn=null;throw e}
  }
  async disconnect(){
    if(this.conn){try{this.conn.disconnect()}catch{}}
    this.conn=null;
    if(this.username)this.status("disconnected","Leválasztva.");
  }
}
module.exports={TikTokBridge};
