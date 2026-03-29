  const selectedListId = localStorage.getItem('selectedListId');
  const sets = JSON.parse(localStorage.getItem('targetsList'));
  const selectedList = sets.find((set) => set.id === selectedListId);
  
  document.getElementById('selectedList').textContent = selectedList.title;
  
  const startBtn = document.getElementById('startBtn');
  
  startBtn.addEventListener('click', (e) => {
    e.preventDefault();
    
    const participantId = document.getElementById('participantId').value.trim();
    const samples = document.getElementById('samples').value.trim();
    const frames = document.getElementById('frames').value.trim();
    const dominantHand = document.querySelector('input[name="hand"]:checked').value;
    
    if(!participantId) {
      alert('Please enter participant ID')
      return;
    }
    
    const session = {
      participantId: participantId,
      dominantHand: dominantHand,
      samples: parseInt(samples),
      frames: parseInt(frames),
      selectedListId: selectedList.id,
      targets: selectedList.targets
    };
    
    localStorage.setItem('session', JSON.stringify(session))
    window.location.href = 'collector.html'
  });