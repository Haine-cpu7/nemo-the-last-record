
const $ = (q)=>document.querySelector(q);

const SAVE_KEY = "nemo_last_record_v03_save";
const CLEAR_KEY = "nemo_last_record_v03_clear";

const state = {
  scene: 0,
  unlocked: [],
  cleared: false,
  ending: null
};

const cinema = {
  skip: false,
  sound: true,
  titleTimer: null,
  audioReady: false,
  audio: null,
  fxMode: "idle",
  lastRec: null,
  holdUntil: 0,
  sceneToken: 0
};

const IMPORTANT_HOLDS = {
  17: 950,   // そこへ、わが子を送れるのか。
  26: 900,   // 定義する必要があるのか。
  28: 1100,  // どの子も、私の娘の続きだ。
  37: 900,   // 滅びた世界を背負わせる...
  38: 1200,  // それぞれに、自分自身の続きを...
  40: 700,   // 守れ。
  41: 700,   // 導くな。
  42: 850,   // 王女として扱うな。
  43: 1400,  // ただ、その子が...
  48: 800,   // 転送 start
  49: 450,   // world IDs
  50: 650,   // identity warning
  51: 1900,  // SIGNAL LOST
  56: 900    // それぞれがNEMO
};

const RECOVERY_RECORDS = new Set([
  "RECORD 001","RECORD 014","RECORD 028","RECORD 031",
  "RECORD 047","RECORD 052","RECORD 053"
]);

function delay(ms){
  return new Promise(resolve=>setTimeout(resolve, cinema.skip ? Math.min(ms,90) : ms));
}

function initAudio(){
  if(cinema.audioReady) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if(!Ctx) return;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = cinema.sound ? 0.11 : 0;
  master.connect(ctx.destination);

  const drone = ctx.createOscillator();
  const droneGain = ctx.createGain();
  drone.type = "sine";
  drone.frequency.value = 47;
  droneGain.gain.value = 0.12;
  drone.connect(droneGain).connect(master);
  drone.start();

  const hum = ctx.createOscillator();
  const humGain = ctx.createGain();
  hum.type = "triangle";
  hum.frequency.value = 94.3;
  humGain.gain.value = 0.025;
  hum.connect(humGain).connect(master);
  hum.start();

  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for(let i=0;i<bufferSize;i++) output[i] = Math.random()*2-1;
  const noise = ctx.createBufferSource();
  const noiseFilter = ctx.createBiquadFilter();
  const noiseGain = ctx.createGain();
  noise.buffer = noiseBuffer;
  noise.loop = true;
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 500;
  noiseGain.gain.value = 0.012;
  noise.connect(noiseFilter).connect(noiseGain).connect(master);
  noise.start();

  cinema.audio = {ctx,master,drone,droneGain,hum,humGain,noise,noiseGain};
  cinema.audioReady = true;
}

function setSound(on){
  cinema.sound = on;
  $("#soundBtn").textContent = `SOUND: ${on ? "ON":"OFF"}`;
  if(cinema.audioReady){
    const {ctx,master} = cinema.audio;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(on ? 0.11 : 0, ctx.currentTime + .16);
  }
}

function audioPulse(kind="soft"){
  if(!cinema.sound) return;
  initAudio();
  if(!cinema.audioReady) return;
  const {ctx,master} = cinema.audio;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = kind==="alert" ? "square" : "sine";
  osc.frequency.setValueAtTime(kind==="alert" ? 210 : 520, ctx.currentTime);
  if(kind==="branch") osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime+.18);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(kind==="alert" ? .05 : .025, ctx.currentTime+.015);
  gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime+(kind==="branch"?.24:.12));
  osc.connect(gain).connect(master);
  osc.start();
  osc.stop(ctx.currentTime+.3);
}

function audioMood(mode){
  if(!cinema.audioReady) return;
  const {ctx,droneGain,humGain,noiseGain} = cinema.audio;
  let d=.12,h=.025,n=.012;
  if(mode==="branch"){d=.17;h=.045;n=.020}
  if(mode==="lost"){d=.001;h=.001;n=.001}
  if(mode==="soft"){d=.055;h=.012;n=.004}
  for(const [node,val] of [[droneGain,d],[humGain,h],[noiseGain,n]]){
    node.gain.cancelScheduledValues(ctx.currentTime);
    node.gain.linearRampToValueAtTime(val,ctx.currentTime+.45);
  }
}

function setFxMode(mode){
  cinema.fxMode = mode;
}

function resizeFx(){
  const c = $("#fxCanvas");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  c.width = Math.floor(innerWidth*dpr);
  c.height = Math.floor(innerHeight*dpr);
  c.style.width = innerWidth+"px";
  c.style.height = innerHeight+"px";
  const ctx = c.getContext("2d");
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener("resize",resizeFx);

const fxNodes = Array.from({length:32},()=>({
  a:Math.random()*Math.PI*2,
  r:60+Math.random()*420,
  s:.0008+Math.random()*.0019,
  p:Math.random()*Math.PI*2
}));

function drawFx(t){
  const c=$("#fxCanvas");
  if(!c){requestAnimationFrame(drawFx);return}
  const ctx=c.getContext("2d");
  ctx.clearRect(0,0,innerWidth,innerHeight);

  if(cinema.fxMode!=="idle"){
    const cx=innerWidth/2, cy=innerHeight*.55;
    const branch = cinema.fxMode==="branch";
    const title = cinema.fxMode==="title";
    const alpha = branch ? .22 : title ? .09 : .06;
    ctx.lineWidth=.8;

    const count = branch ? 24 : title ? 13 : 8;
    for(let i=0;i<count;i++){
      const n=fxNodes[i];
      n.p += n.s*16;
      const angle=n.a+Math.sin(n.p)*.18;
      const len=(branch?Math.max(innerWidth,innerHeight)*.72:Math.max(innerWidth,innerHeight)*.48)*(0.65+(i%5)*.07);
      const x2=cx+Math.cos(angle)*len;
      const y2=cy+Math.sin(angle)*len*.55;
      const grad=ctx.createLinearGradient(cx,cy,x2,y2);
      grad.addColorStop(0,`rgba(210,232,255,${alpha*1.8})`);
      grad.addColorStop(1,"rgba(90,160,230,0)");
      ctx.strokeStyle=grad;
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      const mx=(cx+x2)/2 + Math.sin(n.p+i)*50;
      const my=(cy+y2)/2 + Math.cos(n.p*1.3+i)*28;
      ctx.quadraticCurveTo(mx,my,x2,y2);
      ctx.stroke();

      if(branch && i<14){
        ctx.fillStyle=`rgba(220,240,255,${.18+.12*Math.sin(n.p)})`;
        ctx.beginPath();
        ctx.arc(x2,y2,1.3,0,Math.PI*2);
        ctx.fill();
      }
    }
  }
  requestAnimationFrame(drawFx);
}

async function blackout(ms=900){
  const el=$("#blackout");
  el.classList.add("active");
  await delay(ms);
}
async function revealFromBlackout(ms=700){
  const el=$("#blackout");
  el.classList.remove("active");
  await delay(ms);
}
async function whiteFlash(){
  const el=$("#blackout");
  el.classList.remove("active");
  el.classList.add("flash");
  await delay(80);
  el.classList.remove("flash");
}

async function recoverySequence(rec,title){
  if(cinema.skip) return;
  const overlay=$("#recoveryOverlay");
  $("#recoveryRec").textContent=rec;
  $("#recoveryTitle").textContent=title || "RECOVERING";
  $("#recoveryFill").style.width="0%";
  $("#recoveryPercent").textContent="0%";
  overlay.classList.remove("hidden");
  audioPulse("soft");

  const points=[12,31,57,81,100];
  for(const p of points){
    $("#recoveryFill").style.width=p+"%";
    $("#recoveryPercent").textContent=p+"%";
    if(p===57) audioPulse("soft");
    await delay(p===100?180:120);
  }
  await delay(220);
  overlay.classList.add("hidden");
}

function sceneClasses(s){
  $("#visual").classList.remove("branching","signal-lost");
  $("#sceneTitle").classList.remove("impact");
  $("#text").classList.remove("impact-line","system-log","soft-world");
  $("#choices").classList.remove("final-choice");

  if(s.title==="MANY WORLDS" || s.title==="PROJECT N.E.M.O." || s.title==="BRANCH EVENT"){
    $("#visual").classList.add("branching");
    setFxMode("branch");
    audioMood("branch");
  }else if(s.title==="WORLD-0001" || s.title==="WORLD MAP"){
    setFxMode("soft");
    audioMood("soft");
    $("#text").classList.add("soft-world");
  }else{
    setFxMode("record");
    audioMood("record");
  }

  if(s.visual.includes("SIGNAL LOST")){
    $("#visual").classList.add("signal-lost");
  }

  if(s.speaker==="SYSTEM" || s.visual.includes("WORLD") || s.visual.includes("TRANSFER") || s.visual.includes("BRANCH")){
    $("#text").classList.add("system-log");
  }

  if(IMPORTANT_HOLDS[state.scene]){
    $("#text").classList.add("impact-line");
    $("#sceneTitle").classList.add("impact");
  }

  if(s.choices) $("#choices").classList.add("final-choice");
}

async function preSceneCinematic(prevScene,newScene){
  const s=scenes[newScene];
  if(!s) return;

  if(RECOVERY_RECORDS.has(s.rec) && cinema.lastRec!==s.rec){
    await recoverySequence(s.rec,s.title);
  }

  if(s.rec==="RECORD 053" && s.visual.includes("BRANCH SEQUENCE START")){
    await whiteFlash();
    $("#gameScreen").classList.add("cinematic-shake");
    setTimeout(()=>$("#gameScreen").classList.remove("cinematic-shake"),500);
    audioPulse("branch");
  }

  if(s.visual.includes("WORLD BRANCH MAP")){
    audioPulse("branch");
  }

  if(s.visual.includes("ORIGIN SIGNAL LOST")){
    audioMood("lost");
    await blackout(1150);
    await delay(550);
    await revealFromBlackout(1100);
  }

  cinema.lastRec=s.rec;
}

function scheduleTitleSecret(){
  clearTimeout(cinema.titleTimer);
  $("#hiddenSignal").classList.add("hidden");
  if(localStorage.getItem(CLEAR_KEY)==="1"){
    cinema.titleTimer=setTimeout(()=>{
      if($("#titleScreen").classList.contains("active")){
        $("#hiddenSignal").classList.remove("hidden");
        audioPulse("soft");
        setTimeout(()=>$("#hiddenSignal").classList.add("hidden"),5200);
      }
    },10000);
  }
}


const archives = [
  {id:"REC-000", title:"UNKNOWN FILE", body:"NEMO / RECORD 000。原世界から残された最後の基礎記録。", unlockAt:0},
  {id:"REC-001", title:"BIRTH", body:"王家第一子、無事誕生。継承順位第一位。のちにNEMOと呼ばれる存在の原点。", unlockAt:5},
  {id:"REC-014", title:"WORLD DECAY", body:"原世界そのものに寿命がある。崩壊は戦争でも災害でもなく、観測された終端現象だった。", unlockAt:11},
  {id:"REC-028", title:"MANY WORLDS", body:"世界は一つではない。観測装置は、原世界の外側に無数の並行世界が存在することを確認した。", unlockAt:16},
  {id:"REC-031", title:"PROJECT N.E.M.O.", body:"NEMOを単一世界へ移送する計画ではない。対象の存在を、接続可能な世界線へ分岐・継承させる計画。", unlockAt:22},
  {id:"REC-047", title:"MEMORY COST", body:"世界線分岐時、旧世界の長期記憶は維持できない。各NEMOは原世界を知らず、それぞれの人生を始める。", unlockAt:30},
  {id:"REC-052", title:"THE KING'S ORDER", body:"『守れ。導くな。王女として扱うな。ただ、この子が生きたことを記録してほしい。』命令は各世界線の記録者へ継承された。", unlockAt:38},
  {id:"REC-053", title:"BRANCH EVENT", body:"原世界消滅直前、NEMOの存在情報は複数の世界線へ分岐した。以後、どのNEMOも“複製”ではなく、それぞれが正当な続きを生きる。", unlockAt:46},
  {id:"REC-∞", title:"NEMO", body:"王女のコピーではない。原世界から枝分かれし、それぞれの世界で自分自身の続きを生きる者たち。", unlockAt:999}
];

const scenes = [
  {rec:"RECORD 000", title:"UNKNOWN FILE", icon:"◌", visual:"RECOVERY MODE / FILE FOUND",
   speaker:"SYSTEM", text:"未登録の記録媒体を検出しました。\n\n識別子：NEMO / RECORD 000\n状態：破損\n出所：WORLD-0000\n復元率：12%"},
  {rec:"RECORD 000", title:"UNKNOWN FILE", icon:"⌁", visual:"AUDIO FRAGMENT",
   speaker:"SYSTEM", text:"音声記録を再生します。"},
  {rec:"RECORD 000", title:"UNKNOWN FILE", icon:"◍", visual:"VOICE DATA / UNKNOWN MALE",
   speaker:"？？？", text:"……この記録を見つけた者へ。\n\nもし、どこかの世界で彼女が生きているのなら。\nどうか最後まで読んでほしい。"},
  {rec:"RECORD 000", title:"UNKNOWN FILE", icon:"◍", visual:"VOICE DATA / UNKNOWN MALE",
   speaker:"？？？", text:"これは、滅びた王国の歴史ではない。\n\nひとりの子供が、無数の未来へ続いていった記録だ。"},

  {rec:"RECORD 001", title:"BIRTH", icon:"✦", visual:"PALACE ARCHIVE / IMAGE CORRUPTED",
   speaker:"SYSTEM", text:"記録断片を復元しました。\n\nREC-001 / BIRTH"},
  {rec:"RECORD 001", title:"BIRTH", icon:"✦", visual:"DATE LOST / ROYAL MEDICAL LOG",
   speaker:"記録官", text:"王家第一子、無事誕生。\n\n性別：女性\n継承順位：第一位\n母：████████"},
  {rec:"RECORD 001", title:"BIRTH", icon:"□", visual:"PORTRAIT DATA / DAMAGED",
   speaker:"記録官", text:"出生時の名は記録損傷により判読不能。\n\nただし後世の全記録に、共通する識別名が残されている。"},
  {rec:"RECORD 001", title:"BIRTH", icon:"N", visual:"SUBJECT NAME RECOVERED",
   speaker:"SYSTEM", text:"NEMO"},

  {rec:"RECORD 009", title:"GARDEN", icon:"♨", visual:"PRIVATE PHOTO / ROYAL GARDEN", image:"royal-garden-photo.png", mobileImage:"royal-garden-photo-mobile.png",
   speaker:"侍女の日誌", text:"殿下は本日も庭園へ抜け出された。\n\n厨房から蒸し菓子を一つ持ち出し、池の横で召し上がっていた。"},
  {rec:"RECORD 009", title:"GARDEN", icon:"○", visual:"ANNOTATION", image:"royal-garden-photo.png", mobileImage:"royal-garden-photo-mobile.png",
   speaker:"侍女の日誌", text:"王女らしくない、と侍従長は嘆いていた。\n\nけれど私は、あの方が笑っているなら、それでよいと思う。"},

  {rec:"RECORD 014", title:"WORLD DECAY", icon:"△", visual:"OBSERVATORY LOG",
   speaker:"SYSTEM", text:"新規記録断片を復元しました。\n\nREC-014 / WORLD DECAY"},
  {rec:"RECORD 014", title:"WORLD DECAY", icon:"△", visual:"ASTROPHYSICAL TERMINAL",
   speaker:"主任観測官", text:"終端現象は確定した。\n\n原因は外敵でも、兵器でも、天災でもない。"},
  {rec:"RECORD 014", title:"WORLD DECAY", icon:"△", visual:"WORLD LIFE EXPECTANCY",
   speaker:"主任観測官", text:"この世界そのものが、寿命を迎える。"},
  {rec:"RECORD 014", title:"WORLD DECAY", icon:"…", visual:"CLASSIFIED",
   speaker:"記録官", text:"王家はこの事実を三百年以上秘匿してきた。\n\n民に知らせれば秩序は崩壊する。\n知らせなくても、WORLD-0000はいずれ消滅する。"},

  {rec:"RECORD 028", title:"MANY WORLDS", icon:"∞", visual:"DEEP OBSERVATION / ANOMALY",
   speaker:"SYSTEM", text:"未分類観測記録を復元しました。\n\nREC-028 / MANY WORLDS"},
  {rec:"RECORD 028", title:"MANY WORLDS", icon:"∞", visual:"PARALLEL SIGNATURES DETECTED",
   speaker:"主任観測官", text:"……一つではない。"},
  {rec:"RECORD 028", title:"MANY WORLDS", icon:"∞", visual:"WORLD BRANCH MAP / PARTIAL",
   speaker:"研究主任", text:"我々の世界の外に、極めて類似した宇宙が無数に存在しています。\n\n歴史、人物、出来事。\n少しずつ異なる世界が、枝のように並行して存在している。"},
  {rec:"RECORD 028", title:"MANY WORLDS", icon:"∞", visual:"DESTINATION COUNT / UNDEFINED",
   speaker:"王", text:"そこへ、わが子を送れるのか。"},
  {rec:"RECORD 028", title:"MANY WORLDS", icon:"∞", visual:"RESEARCH NOTE",
   speaker:"研究主任", text:"一つの世界を選んで送ることはできません。\n\n接続すると、対象の存在そのものが複数の到達可能世界へ分岐する可能性があります。"},
  {rec:"RECORD 028", title:"MANY WORLDS", icon:"∞", visual:"RESEARCH NOTE",
   speaker:"王", text:"……分岐。"},
  {rec:"RECORD 028", title:"MANY WORLDS", icon:"∞", visual:"RESEARCH NOTE",
   speaker:"研究主任", text:"はい。\n\n同じ過去を持ちながら、その瞬間から別々の未来を生きることになります。"},

  {rec:"RECORD 031", title:"PROJECT N.E.M.O.", icon:"N", visual:"CLASSIFIED PROJECT",
   speaker:"SYSTEM", text:"新規記録断片を復元しました。\n\nREC-031 / PROJECT N.E.M.O."},
  {rec:"RECORD 031", title:"PROJECT N.E.M.O.", icon:"N", visual:"NON-LOCAL EXISTENCE MIGRATION OPERATION",
   speaker:"研究主任", text:"計画名：N.E.M.O.\n\n目標：原世界消滅前に、対象者の存在を接続可能な世界線へ継承する。\n対象：王家第一子。"},
  {rec:"RECORD 031", title:"PROJECT N.E.M.O.", icon:"N", visual:"BRANCH THEORY",
   speaker:"記録官", text:"それは避難ではない。\n\n一つの命を、一つの場所へ運ぶ計画でもない。\n\nひとつだった未来を、失われないよう枝分かれさせる計画だった。"},
  {rec:"RECORD 031", title:"PROJECT N.E.M.O.", icon:"♔", visual:"ROYAL COUNCIL",
   speaker:"研究主任", text:"成功した場合、どの世界の彼女が『本物』なのか、定義できなくなります。"},
  {rec:"RECORD 031", title:"PROJECT N.E.M.O.", icon:"♔", visual:"ROYAL COUNCIL",
   speaker:"王", text:"定義する必要があるのか。"},
  {rec:"RECORD 031", title:"PROJECT N.E.M.O.", icon:"♔", visual:"ROYAL COUNCIL",
   speaker:"研究主任", text:"……。"},
  {rec:"RECORD 031", title:"PROJECT N.E.M.O.", icon:"♔", visual:"ROYAL COUNCIL",
   speaker:"王", text:"それぞれが目を覚まし、それぞれが生きるなら。\n\nどの子も、私の娘の続きだ。"},
  {rec:"RECORD 031", title:"PROJECT N.E.M.O.", icon:"○", visual:"PRIVATE NOTE",
   speaker:"王", text:"王女だから残すのではない。\n\n生きてほしいから、未来を残す。"},

  {rec:"RECORD 040", title:"LAST DAYS", icon:"⌛", visual:"COUNTDOWN / 3 DAYS",
   speaker:"侍女の日誌", text:"殿下は何も知らない。\n\n今日も『おやつは？』と聞かれた。"},
  {rec:"RECORD 040", title:"LAST DAYS", icon:"○", visual:"PRIVATE PHOTO",
   speaker:"侍女の日誌", text:"残り三日。\n\n私は笑って、いつも通りの菓子を差し出した。"},

  {rec:"RECORD 047", title:"MEMORY COST", icon:"!", visual:"TRANSFER RISK REPORT",
   speaker:"SYSTEM", text:"警告記録を復元しました。\n\nREC-047 / MEMORY COST"},
  {rec:"RECORD 047", title:"MEMORY COST", icon:"!", visual:"NEURAL RETENTION FAILURE",
   speaker:"研究主任", text:"世界線分岐時、旧世界の長期記憶は維持できません。\n\n各世界の彼女は、ここを知らないまま新しい人生を始める可能性が高い。"},
  {rec:"RECORD 047", title:"MEMORY COST", icon:"♔", visual:"VOICE LOG / KING",
   speaker:"？？？", text:"あの子たちは、私たちを忘れる。"},
  {rec:"RECORD 047", title:"MEMORY COST", icon:"♔", visual:"VOICE LOG / SECOND SPEAKER",
   speaker:"？？？", text:"それでいい。"},
  {rec:"RECORD 047", title:"MEMORY COST", icon:"♔", visual:"VOICE LOG",
   speaker:"？？？", text:"私たちが存在したことも？"},
  {rec:"RECORD 047", title:"MEMORY COST", icon:"♔", visual:"VOICE LOG",
   speaker:"王", text:"それでいい。"},
  {rec:"RECORD 047", title:"MEMORY COST", icon:"♔", visual:"VOICE LOG",
   speaker:"研究主任", text:"……なぜ。"},
  {rec:"RECORD 047", title:"MEMORY COST", icon:"♔", visual:"VOICE LOG / KING",
   speaker:"王", text:"滅びた世界を背負わせるために、生かすのではない。"},
  {rec:"RECORD 047", title:"MEMORY COST", icon:"♔", visual:"VOICE LOG / KING",
   speaker:"王", text:"あの子たちには、こちらの続きを生きてもらうのではない。\n\nそれぞれに、自分自身の続きを生きてもらう。"},

  {rec:"RECORD 052", title:"THE LAST ORDER", icon:"✧", visual:"FINAL DIRECTIVE",
   speaker:"SYSTEM", text:"最終命令記録を復元しました。\n\nREC-052 / THE KING'S ORDER"},
  {rec:"RECORD 052", title:"THE LAST ORDER", icon:"♔", visual:"FINAL DIRECTIVE / KING",
   speaker:"王", text:"世界線ごとに、記録を残せ。"},
  {rec:"RECORD 052", title:"THE LAST ORDER", icon:"♔", visual:"FINAL DIRECTIVE / KING",
   speaker:"王", text:"守れ。"},
  {rec:"RECORD 052", title:"THE LAST ORDER", icon:"♔", visual:"FINAL DIRECTIVE / KING",
   speaker:"王", text:"導くな。"},
  {rec:"RECORD 052", title:"THE LAST ORDER", icon:"♔", visual:"FINAL DIRECTIVE / KING",
   speaker:"王", text:"王女として扱うな。"},
  {rec:"RECORD 052", title:"THE LAST ORDER", icon:"♔", visual:"FINAL DIRECTIVE / KING",
   speaker:"王", text:"ただ、その子が生きたことを記録してほしい。"},

  {rec:"RECORD 053", title:"BRANCH EVENT", icon:"◉", visual:"COUNTDOWN / 00:14:00",
   speaker:"SYSTEM", text:"WORLD-0000 消滅まで、残り14分。"},
  {rec:"RECORD 053", title:"BRANCH EVENT", icon:"◉", visual:"TRANSFER CHAMBER",
   speaker:"ねも", text:"……ねむい。"},
  {rec:"RECORD 053", title:"BRANCH EVENT", icon:"◉", visual:"TRANSFER CHAMBER",
   speaker:"王", text:"眠っていればいいよ。"},
  {rec:"RECORD 053", title:"BRANCH EVENT", icon:"◉", visual:"TRANSFER CHAMBER",
   speaker:"ねも", text:"起きたら、おやつある？"},
  {rec:"RECORD 053", title:"BRANCH EVENT", icon:"◉", visual:"TRANSFER CHAMBER",
   speaker:"王", text:"……あるよ。"},
  {rec:"RECORD 053", title:"BRANCH EVENT", icon:"◉", visual:"BRANCH SEQUENCE START",
   speaker:"SYSTEM", text:"PROJECT N.E.M.O. START.\n\nORIGIN SUBJECT : NEMO\nORIGIN WORLD : 0000\nBRANCH STATUS : CONNECTING"},
  {rec:"RECORD 053", title:"BRANCH EVENT", icon:"∞", visual:"WORLD BRANCH MAP",
   speaker:"SYSTEM", text:"WORLD-0001 : CONNECTION ESTABLISHED\nWORLD-0002 : CONNECTION ESTABLISHED\nWORLD-0003 : SIGNAL UNSTABLE\nWORLD-0004 : CONNECTION ESTABLISHED\nWORLD-████ : SCAN CONTINUES"},
  {rec:"RECORD 053", title:"BRANCH EVENT", icon:"∞", visual:"IDENTITY WARNING",
   speaker:"SYSTEM", text:"警告。\n\n分岐成立後、各NEMOを原個体／複製個体として区別することはできません。\n\nすべての分岐個体は、同一の過去から連続する独立存在として確定します。"},
  {rec:"RECORD 053", title:"BRANCH EVENT", icon:"·", visual:"ORIGIN SIGNAL LOST",
   speaker:"SYSTEM", text:"WORLD-0000 消滅。\n\n原世界との通信を喪失しました。\n\nPROJECT N.E.M.O. : COMPLETE"},

  {rec:"RECORD 18472", title:"WORLD-0001", icon:"☁", visual:"CURRENT WORLD / STREET",
   speaker:"記録者", text:"――そして、これは数ある世界線のひとつ。"},
  {rec:"RECORD 18472", title:"WORLD-0001", icon:"○", visual:"SUBJECT OBSERVATION",
   speaker:"記録者", text:"WORLD ID : 0001\nSUBJECT : NEMO\nSTATUS : HEALTHY"},
  {rec:"RECORD 18472", title:"WORLD-0001", icon:"○", visual:"DISTANT OBSERVATION",
   speaker:"ねも", text:"肉まんないかな。"},
  {rec:"RECORD 18472", title:"WORLD-0001", icon:"◍", visual:"RECORDER TERMINAL",
   speaker:"記録者", text:"このねもは、自分が王女だったことを知らない。\n\n自分と同じ過去から始まった『ねも』が、別の世界にもいることも知らない。"},
  {rec:"RECORD 18472", title:"WORLD MAP", icon:"∞", visual:"REMOTE RECORD STATUS",
   speaker:"SYSTEM", text:"WORLD ID : 0002\nSUBJECT : NEMO\nSTATUS : UNKNOWN\n\nWORLD ID : 0137\nSUBJECT : NEMO\nSTATUS : ACTIVE\n\nWORLD ID : ████\nSUBJECT : NEMO\nSTATUS : RECORD UNAVAILABLE"},
  {rec:"RECORD 18472", title:"WORLD MAP", icon:"∞", visual:"BRANCH RECORD",
   speaker:"記録者", text:"誰が本物なのか、という問いに意味はない。\n\nどの世界でも、ねもはその世界を生きている。\n\nそれぞれが、NEMOだ。"},
  {rec:"RECORD 18472", title:"WORLD-0001", icon:"?", visual:"PLAYER DECISION",
   speaker:"SYSTEM", text:"WORLD-0001の出生記録を復元しました。\n\nこの記録を、この世界のねも本人に渡しますか？", choices:[
      {label:"記録を渡す", ending:"give"},
      {label:"記録を渡さない", ending:"keep"}
   ]}
];

const recordNemo = [
  ["WORLD-0000 / RECORD 000","ORIGIN","すべてのNEMOが共有する、滅びた原世界の最後の記録。"],
  ["WORLD-0001 / RECORD 00001","はじまり","この世界のねもが目を覚ました日。"],
  ["WORLD-0001 / RECORD 00411","はじめての肉まん","記録者注記：非常に気に入った様子。"],
  ["WORLD-0001 / RECORD 03902","旅","知らない町を歩き、知らない人と出会った。"],
  ["WORLD-0001 / RECORD 10214","星待館","温泉宿で過ごした八日間。"],
  ["WORLD-0001 / RECORD 18472","今日","対象：ねも。状態：元気。"],
  ["WORLD-0002 / RECORD ----","PARALLEL NEMO","状態：UNKNOWN。記録へのアクセス権なし。"],
  ["WORLD-0137 / RECORD ----","PARALLEL NEMO","状態：ACTIVE。詳細記録は別系統。"]
];

let typingTimer = null;
let shownText = "";
let fullText = "";

function setScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  $(id).classList.add("active");
}

function syncUnlocks(){
  archives.forEach(a=>{
    if(state.scene >= a.unlockAt && !state.unlocked.includes(a.id)) state.unlocked.push(a.id);
  });
  if(state.cleared && !state.unlocked.includes("REC-∞")) state.unlocked.push("REC-∞");
}

async function renderScene(){
  syncUnlocks();
  const s = scenes[state.scene];
  if(!s){ return; }

  const token=++cinema.sceneToken;
  await preSceneCinematic(state.scene-1,state.scene);
  if(token!==cinema.sceneToken) return;

  $("#chapterLabel").textContent = s.rec;
  $("#recordStatus").textContent = s.rec;
  const clearedForDisplay = localStorage.getItem(CLEAR_KEY)==="1";
  const displayTitle = (clearedForDisplay && s.rec==="RECORD 000" && s.title==="UNKNOWN FILE")
    ? "ORIGIN RECORD"
    : s.title;
  $("#sceneTitle").textContent = displayTitle;
  $("#visualIcon").textContent = s.icon;
  $("#visualText").textContent = s.visual;
  const visualEl = $("#visual");
  if(s.image){
    const imgPath = (s.mobileImage && window.innerWidth <= 640) ? s.mobileImage : s.image;
    visualEl.classList.add("has-image");
    visualEl.style.backgroundImage = `url("${imgPath}")`;
  }else{
    visualEl.classList.remove("has-image");
    visualEl.style.backgroundImage = "";
  }
  $("#speaker").textContent = s.speaker || "";
  $("#choices").innerHTML = "";
  $("#nextBtn").classList.remove("hidden","waiting");

  sceneClasses(s);

  clearInterval(typingTimer);
  fullText = s.text;
  shownText = "";
  $("#text").textContent = "";

  const typeDelay = cinema.skip ? 2 : (s.speaker==="SYSTEM" ? 9 : 15);
  let i = 0;
  typingTimer = setInterval(()=>{
    shownText += fullText[i] ?? "";
    $("#text").textContent = shownText;
    i++;
    if(i >= fullText.length){
      clearInterval(typingTimer);
      const hold = IMPORTANT_HOLDS[state.scene] || 0;
      cinema.holdUntil = Date.now() + (cinema.skip ? 0 : hold);
      if(hold && !cinema.skip){
        $("#nextBtn").classList.add("waiting");
        setTimeout(()=>{
          if(state.scene===scenes.indexOf(s)){
            $("#nextBtn").classList.remove("waiting");
          }
        },hold);
      }
      showChoicesIfNeeded(s);
    }
  }, typeDelay);

  saveAuto();
}

function showChoicesIfNeeded(s){
  if(!s.choices) return;
  $("#nextBtn").classList.add("hidden");
  $("#choices").innerHTML = "";
  const renderChoices=()=>{
    s.choices.forEach(c=>{
      const b = document.createElement("button");
      b.className = "choice";
      b.textContent = c.label;
      b.onclick = ()=>{
        audioPulse("soft");
        finish(c.ending);
      };
      $("#choices").appendChild(b);
    });
  };
  const wait=Math.max(0,cinema.holdUntil-Date.now());
  if(wait>0 && !cinema.skip) setTimeout(renderChoices,wait);
  else renderChoices();
}

function advance(){
  const s = scenes[state.scene];
  if(Date.now() < cinema.holdUntil && !cinema.skip) return;

  if(shownText.length < fullText.length){
    clearInterval(typingTimer);
    shownText = fullText;
    $("#text").textContent = fullText;
    const hold = IMPORTANT_HOLDS[state.scene] || 0;
    cinema.holdUntil = Date.now() + (cinema.skip ? 0 : hold);
    if(hold && !cinema.skip){
      $("#nextBtn").classList.add("waiting");
      setTimeout(()=>$("#nextBtn").classList.remove("waiting"),hold);
    }
    showChoicesIfNeeded(s);
    return;
  }

  if(s.choices) return;
  if(state.scene < scenes.length-1){
    audioPulse("soft");
    state.scene++;
    renderScene();
  }
}

async function finish(type){
  await blackout(420);
  state.cleared = true;
  state.ending = type;
  syncUnlocks();
  localStorage.setItem(CLEAR_KEY,"1");
  saveAuto();
  $("#recordNemoBtn").classList.remove("hidden");

  let title, text;
  if(type==="give"){
    title = "ENDING : THE TRUTH";
    text = `ねもは、原世界の記録を最後まで読んだ。

自分が王女だったこと。
原世界がもう存在しないこと。
そして、自分と同じ過去を持つ“ねも”が
別の世界にもいること。

しばらく黙っていた。

「……じゃあ、ほかのねもも
　どっかで生きてるの？」

記録者は答えなかった。

ねもは少し考えて、
ファイルを閉じた。

「そっか。」

それから窓の外を見て、

「肉まん食べにいこ。」

と言った。

過去を知っても、
別の自分を知っても、
この世界のねもは、この世界のねもだった。

WORLD ID : 0001
SUBJECT : NEMO
STATUS : HEALTHY`;
  }else{
    title = "ENDING : THE RECORD";
    text = `記録者は、原世界のファイルを閉じた。

少し離れた道を、
ねもがいつものように歩いている。

王女だったことを知らない。
原世界の終わりを知らない。
別世界のねもたちを知らない。

けれど、それは欠落ではない。

WORLD-0000の王が望んだのは、
過去を保存することではなかった。

未来を残すことだった。

記録者の仕事は、
真実を教えることではない。

ただ、
この世界のねもが生きたことを記録する。

WORLD ID : 0001
SUBJECT : NEMO
STATUS : HEALTHY`;
  }

  $("#endingTitle").textContent = title;
  $("#endingText").textContent = text;
  $("#topbar").classList.add("hidden");
  $("#footerHint").classList.add("hidden");
  setScreen("#endingScreen");
  setFxMode("soft");
  audioMood("soft");
  await revealFromBlackout(850);
}

function startNew(){
  initAudio();
  if(cinema.audioReady && cinema.audio.ctx.state==="suspended") cinema.audio.ctx.resume();
  clearTimeout(cinema.titleTimer);
  $("#hiddenSignal").classList.add("hidden");
  state.scene = 0;
  state.unlocked = [];
  state.ending = null;
  state.cleared = localStorage.getItem(CLEAR_KEY)==="1";
  cinema.skip = false;
  $("#skipBtn").textContent="SKIP: OFF";
  $("#skipBtn").classList.toggle("hidden", !state.cleared);
  $("#topbar").classList.remove("hidden");
  $("#footerHint").classList.remove("hidden");
  setScreen("#gameScreen");
  renderScene();
}

function saveAuto(){
  const data = {
    version:"0.3",
    scene:state.scene,
    unlocked:state.unlocked,
    cleared:state.cleared,
    ending:state.ending
  };
  localStorage.setItem(SAVE_KEY,JSON.stringify(data));
  $("#continueBtn").disabled = false;
}

function loadGame(){
  initAudio();
  if(cinema.audioReady && cinema.audio.ctx.state==="suspended") cinema.audio.ctx.resume();
  clearTimeout(cinema.titleTimer);
  $("#hiddenSignal").classList.add("hidden");
  const raw = localStorage.getItem(SAVE_KEY);
  if(!raw) return;
  try{
    const d = JSON.parse(raw);
    state.scene = Math.min(d.scene ?? 0, scenes.length-1);
    state.unlocked = Array.isArray(d.unlocked)?d.unlocked:[];
    state.cleared = !!d.cleared || localStorage.getItem(CLEAR_KEY)==="1";
    state.ending = d.ending || null;
    $("#skipBtn").classList.toggle("hidden", !state.cleared);
    $("#topbar").classList.remove("hidden");
    $("#footerHint").classList.remove("hidden");
    setScreen("#gameScreen");
    renderScene();
  }catch(e){}
}

function renderArchive(){
  syncUnlocks();
  $("#archiveList").innerHTML = "";
  const clearedForArchive = localStorage.getItem(CLEAR_KEY)==="1";
  archives.forEach(a=>{
    const unlocked = state.unlocked.includes(a.id);
    const el = document.createElement("div");
    el.className = "archive-item" + (unlocked ? "" : " locked");
    const archiveTitle = (clearedForArchive && a.id==="REC-000") ? "ORIGIN RECORD" : a.title;
    el.innerHTML = `
      <div class="archive-id">${unlocked ? a.id : "LOCKED"}</div>
      <div class="archive-title">${unlocked ? archiveTitle : "████████"}</div>
      <div class="archive-body">${unlocked ? a.body : "記録はまだ復元されていません。"}</div>`;
    $("#archiveList").appendChild(el);
  });
}

function renderRecordNemo(){
  $("#recordList").innerHTML = "";
  recordNemo.forEach(r=>{
    const el = document.createElement("div");
    el.className="archive-item";
    el.innerHTML=`<div class="archive-id">${r[0]}</div><div class="archive-title">${r[1]}</div><div class="archive-body">${r[2]}</div>`;
    $("#recordList").appendChild(el);
  });
}

function toTitle(){
  $("#topbar").classList.add("hidden");
  $("#footerHint").classList.add("hidden");
  setScreen("#titleScreen");
  setFxMode("title");
  $("#titleScreen").classList.toggle("cleared-title", localStorage.getItem(CLEAR_KEY)==="1");
  $("#continueBtn").disabled = !localStorage.getItem(SAVE_KEY);
  if(localStorage.getItem(CLEAR_KEY)==="1"){
    $("#recordNemoBtn").classList.remove("hidden");
  }
  scheduleTitleSecret();
}

$("#newGameBtn").onclick = startNew;
$("#continueBtn").onclick = loadGame;
$("#nextBtn").onclick = advance;
$("#archiveBtn").onclick = ()=>{ renderArchive(); setScreen("#archiveScreen"); };
$("#closeArchiveBtn").onclick = ()=>setScreen("#gameScreen");
$("#menuBtn").onclick = ()=>setScreen("#menuScreen");
$("#closeMenuBtn").onclick = ()=>setScreen("#gameScreen");
$("#saveBtn").onclick = ()=>{
  saveAuto();
  $("#saveBtn").textContent="SAVED";
  setTimeout(()=>$("#saveBtn").textContent="SAVE",700);
};
$("#returnTitleBtn").onclick = toTitle;
$("#endingTitleBtn").onclick = toTitle;
$("#recordNemoBtn").onclick = ()=>{ renderRecordNemo(); setScreen("#recordScreen"); };
$("#closeRecordBtn").onclick = toTitle;

$("#soundBtn").onclick = ()=>{
  initAudio();
  if(cinema.audioReady && cinema.audio.ctx.state==="suspended") cinema.audio.ctx.resume();
  setSound(!cinema.sound);
};

$("#skipBtn").onclick = ()=>{
  cinema.skip=!cinema.skip;
  $("#skipBtn").textContent=`SKIP: ${cinema.skip ? "ON":"OFF"}`;
  if(cinema.skip){
    cinema.holdUntil=0;
    $("#nextBtn").classList.remove("waiting");
  }
};

resizeFx();
requestAnimationFrame(drawFx);

document.addEventListener("keydown",(e)=>{
  if((e.key==="Enter" || e.key===" ") && $("#gameScreen").classList.contains("active")){
    e.preventDefault();
    advance();
  }
});

toTitle();
