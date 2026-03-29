// JS for index.html
if(document.getElementById('addBtn')) {
  
};


//JS for start.html
if(document.getElementById('startBtn')) {
  
};

//JS for collector.html
if(document.getElementById('collectBtn')) {
  
  
  const video = document.getElementById('video');
  
  /*
  async function startCam() {
    const stream = await navigator.mediaDevices.getUserMedia({video: {
    facingMode: "environment",
    aspectRatio: { ideal: 0.75 }
  }});
  video.srcObject = stream;
  }
  startCam();
  */
  
  async function loadMediaPipe() {
    const hands = new Hands({ locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    }
    }
    
    hands.serOptions({
      maxNumHands: 2,
      
    })
  }
  
  
  
  
  
  
};


