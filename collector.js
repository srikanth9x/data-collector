import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/vision_bundle.js";

let session = null;
let currentTargetIdx = 0;
let collectedData = [];
let lastLandmarks = null;
let isCapturing = false;
let captureCount = 0;

const collectBtn = document.getElementById('collectBtn');
const undoBtn = document.getElementById('undoBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const downloadBtn = document.getElementById('downloadBtn');
  
session = JSON.parse(localStorage.getItem('session'));
  
function updateUI() {
  const currentTargetEl = document.getElementById('currentTarget');
  const samples = document.getElementById('samples');
  const collectedSamples = document.getElementById('collectedSamples');
  const progressFill = document.getElementById('progressFill');
    
  currentTargetEl.textContent = session.targets[currentTargetIdx];
    samples.textContent = session.samples;
    collectedSamples.textContent = (collectedData.filter((target) => target.label === currentTargetIdx).length) / session.frames;
  const percentage = (collectedSamples.textContent/samples.textContent)*100;
    progressFill.style.width = percentage + '%'
    
  if(currentTargetIdx === session.targets.length - 1) {
    const samplesCollected = (collectedData.filter(t => t.label === currentTargetIdx).length) / session.frames;
    if(samplesCollected >= session.samples) {
      collectBtn.disabled = true;
      collectBtn.textContent = "All Done!";
    } else {
      collectBtn.disabled = false;
      collectBtn.textContent = "Collect";
    }
  }
}
updateUI();
  
const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17]
];  

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let handLandmarker = null;
let isRunning = false;
  
async function loadMediaPipe() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 2
  });
}

// START CAMERA
async function startCam() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "environment",
      aspectRatio: 0.75
    } // BACK CAMERA
  });
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  });
  isRunning = true;
  detectHands();
}

function drawHand(hand) {
  HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
    const start = hand[startIdx];
    const end = hand[endIdx];
    ctx.beginPath();
    ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
    ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
    ctx.strokeStyle = "dimgray";
    ctx.lineWidth = 3;
    ctx.stroke();
  });

  hand.forEach(point => {
    ctx.beginPath();
    ctx.arc(point.x * canvas.width, point.y * canvas.height, 6, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
  });
}

async function detectHands() {
  if(!isRunning) return;
  
  if(handLandmarker && video.readyState >= 2) {
    const result = handLandmarker.detectForVideo(video, Date.now());
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if(result.landmarks && result.landmarks.length > 0) {
      result.landmarks.forEach(hand => drawHand(hand));
      
      let leftLandmarks = null;
      let rightLandmarks = null;
      
      result.handednesses.forEach((handedness,i) => {
        const label = handedness[0].categoryName;
        if (label === "Right") leftLandmarks = result.landmarks[i];
        else rightLandmarks = result.landmarks[i];
      });
      
      const left = leftLandmarks ? (leftLandmarks).flatMap(p => [p.x, p.y, p.z]) : new Array(63).fill(0);
      const right = rightLandmarks ? (rightLandmarks).flatMap(p => [p.x, p.y, p.z]) : new Array(63).fill(0);
        
      lastLandmarks = {left: leftLandmarks, right: rightLandmarks}
        
      if(isCapturing) {
        const normalLeft = normaliseLandmarks(lastLandmarks.left);
        const normalRight = normaliseLandmarks(lastLandmarks.right);
        
        const row = {
          participant_id: session.participantId,
          dominant_hand: session.dominantHand,
          target: session.targets[currentTargetIdx],
          label: currentTargetIdx,
        };
        
        normalLeft.forEach((val, i) => row[`left_${Math.floor(i/3)}${'xyz'[i%3]}`] = val);
        normalRight.forEach((val, i) => row[`right_${Math.floor(i/3)}${'xyz'[i%3]}`] = val)
        
        collectedData.push(row);
        captureCount++;
        
        if(captureCount === session.frames) {
          isCapturing = false;
          captureCount = 0;
          
          const samplesCollected = collectedData.filter(t => t.label === currentTargetIdx).length / session.frames
          
          const isLastTarget = currentTargetIdx === session.targets.length - 1;
          const isCompleted = samplesCollected >= session.samples;
          
          if(isCompleted && !isLastTarget) currentTargetIdx++
          updateUI();
        }
      }
    }
  }
  requestAnimationFrame(detectHands);
}

function normaliseLandmarks(hand) {
  if(!hand) return new Array(63).fill(0);
  
  const origin = hand[0];
  
  const normalised = hand.map(point => ({
    x: point.x - origin.x,
    y: point.y - origin.y,
    z: point.z - origin.z
  }));
  
  const p9 = normalised[9];
  const scale = Math.sqrt(p9.x**2 + p9.y**2 + p9.z**2);
  
  if(scale === 0) return normalised.flatMap(p => [p.x, p.y, p.z])
  
  return normalised.map(point => ({
    x: point.x / scale,
    y: point.y / scale,
    z: point.z / scale
  })).flatMap(p => [p.x, p.y, p.z]);
}

await loadMediaPipe();
await startCam();

collectBtn.addEventListener('click', () => {
    if(!lastLandmarks) {
      alert("No hand detected!");
      return;
    }
    isCapturing = true;
  })
  
undoBtn.addEventListener('click', () => {
  const samplesCollected = collectedData.filter(t => t.label === currentTargetIdx).length / session.frames;
    
  if(samplesCollected === 0) {
    alert('Nothing to undo!');
    return;
  }
    
  let removed = 0;
  for(let i = collectedData.length - 1; i >= 0; i--) {
    if(collectedData[i].label === currentTargetIdx && removed < session.frames) {
      collectedData.splice(i, 1);
      removed++;
    }
  }
  updateUI();
});
  
prevBtn.addEventListener('click', () => {
  if(currentTargetIdx > 0) {
    currentTargetIdx--;
    updateUI();
  } else {
    alert('It is the first target!');
  }
});
  
nextBtn.addEventListener('click', () => {
  if(currentTargetIdx < session.targets.length - 1) {
  currentTargetIdx++;
  updateUI();
  } else {
    alert('Reached to last target!')
  }
});

downloadBtn.addEventListener('click', () => {
  if(collectedData.length === 0){
    alert('No data collected yet!');
    return;
  }
  const headers = Object.keys(collectedData[0]);
  const headerLine = headers.join(',');
  
  const rows = collectedData.map(row => {
    return headers.map(header => row[header]).join(',')
  })
  
  const csv = [headerLine, ...rows].join('\n');
  
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${session.participantId}_${session.targets[0]}_data.csv`;
  a.click();
  URL.revokeObjectURL(url);
});