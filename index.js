  const DEFAULT_SETS = [
    {
      id: "1",
      title: "ISL Alphabets",
      targets: ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"]
    },
    {
      id: "2",
      title: "ISL Numbers",
      targets: ["0","1","2","3","4","5","6","7","8","9"]
    },
  ];
  
  function getTargets () {
    const stored = localStorage.getItem('targetsList');
    
    if(!stored) {
      localStorage.setItem('targetsList', JSON.stringify(DEFAULT_SETS));
      return DEFAULT_SETS;
    }
    return JSON.parse(stored);
  };
  
  function renderTargetsList() {
   const targets = getTargets();
   const targetsList = document.getElementById('targetsList');
   
   targetsList.innerHTML = '<h1 class="w-full text-3xl p-2 rounded flex justify-center bg-neutral-100 dark:bg-neutral-900 border border-neutral-500 border-t border-t-neutral-400 dark:border-t-neutral-600 text-neutral-950 dark:text-neutral-50">Targets List</h1>'
   
   targets.forEach((list) => {
     const div = document.createElement('div');
     div.setAttribute('class', 'w-full text-xl p-2 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-500 border-t border-t-neutral-400 dark:border-t-neutral-600 text-neutral-950 dark:text-neutral-50 cursor-pointer')
     div.textContent = list.title;
     div.addEventListener('click', () => { selectList(list.id) });
     targetsList.appendChild(div);
     });
  };
  renderTargetsList();
  
  function selectList(id) {
    localStorage.setItem('selectedListId', id);
    window.location.href = 'start.html';
  };
  
  const addBtn = document.getElementById('addBtn');
  
  addBtn.addEventListener('click', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('targetTitle').value.trim();
    const targetItemsRaw = document.getElementById('targetItems').value.trim();
    
    if(!title || !targetItemsRaw) {
      alert('Please fill both fields!');
      return;
    }
    
    const targetItems = targetItemsRaw.split(',').map((t) => {
      return t.trim();
    })
    
    const targets = getTargets();
    
    const newTargets = {
      id: Date.now().toString(),
      title: title,
      targets: targetItems
    }
    
    targets.push(newTargets);
    localStorage.setItem('targetsList', JSON.stringify(targets));
    
    renderTargetsList();
    
    document.getElementById('targetTitle').value = ''
    document.getElementById('targetItems').value = ''

  })