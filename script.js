
// テンプレートを管理
let taskTemplates = ['26BEV仕様作成'];

// ローカルストレージからテンプレートを読み込む
function loadTemplates() {
    const saved = localStorage.getItem('taskTemplates');
    if (saved) {
        taskTemplates = JSON.parse(saved);
    }
}

// テンプレートをローカルストレージに保存
function saveTemplates() {
    localStorage.setItem('taskTemplates', JSON.stringify(taskTemplates));
}

function showForm(type) {
    const modal = document.getElementById('modal');
    const modalContent = modal.querySelector('.modal-content');
    document.getElementById('inForm').classList.add('hidden');
    document.getElementById('outForm').classList.add('hidden');
    
    // 今日の日付を取得
    const today = new Date().toISOString().split('T')[0];
    
    if (type === 'in') {
        document.getElementById('inForm').classList.remove('hidden');
        document.querySelector('input[name="in_date"]').value = today;
        document.querySelector('input[name="in_time"]').value = '09:00';
    } else {
        document.getElementById('outForm').classList.remove('hidden');
        document.querySelector('input[name="out_date"]').value = today;
        document.querySelector('input[name="out_time"]').value = '17:30';
        updateTaskDropdown();
    }

    // モバイル判定して全画面クラスを付け外し
    if (window.innerWidth <= 480) {
        modalContent.classList.add('fullscreen');
    } else {
        modalContent.classList.remove('fullscreen');
    }

    modal.style.display = 'block';
}

function closeForm() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
    const mc = modal.querySelector('.modal-content');
    if (mc) mc.classList.remove('fullscreen');
}

function openAddTemplateModal() {
    const templateModal = document.getElementById('templateModal');
    const mc = templateModal.querySelector('.modal-content');
    if (window.innerWidth <= 480) {
        mc.classList.add('fullscreen');
    } else {
        mc.classList.remove('fullscreen');
    }
    templateModal.style.display = 'block';
    document.getElementById('newTemplateInput').value = '';
    document.getElementById('newTemplateInput').focus();
}

function closeAddTemplateModal() {
    const templateModal = document.getElementById('templateModal');
    templateModal.style.display = 'none';
    document.getElementById('templateError').classList.add('hidden');
    const mc = templateModal.querySelector('.modal-content');
    if (mc) mc.classList.remove('fullscreen');
}

function checkTemplateInput() {
    const newTemplate = document.getElementById('newTemplateInput').value.trim();
    const errorDiv = document.getElementById('templateError');
    
    if (newTemplate && taskTemplates.includes(newTemplate)) {
        errorDiv.textContent = 'すでにテンプレートに追加されています';
        errorDiv.classList.remove('hidden');
    } else {
        errorDiv.classList.add('hidden');
    }
}

function addTemplate() {
    const newTemplate = document.getElementById('newTemplateInput').value.trim();
    const errorDiv = document.getElementById('templateError');
    
    if (!newTemplate) {
        errorDiv.textContent = 'テンプレートを入力してください';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    // 重複チェック
    if (taskTemplates.includes(newTemplate)) {
        errorDiv.textContent = 'すでにテンプレートに追加されています';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    taskTemplates.push(newTemplate);
    saveTemplates();
    updateTaskDropdown();
    closeAddTemplateModal();
    alert('テンプレートを追加しました');
}

function updateTaskDropdown() {
    const dropdown = document.getElementById('taskDropdown');
    dropdown.innerHTML = '';
    taskTemplates.forEach(template => {
        const item = document.createElement('div');
        item.className = 'task-item';
        item.textContent = template;
        item.onclick = () => selectTask(template);
        dropdown.appendChild(item);
    });
}

window.onclick = function(event) {
    const modal = document.getElementById('modal');
    const templateModal = document.getElementById('templateModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
    if (event.target == templateModal) {
        templateModal.style.display = 'none';
    }
}

function submitForm(event, type) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => data[key] = value);

    fetch(`/submit_${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(json => {
        alert(json.message);
        closeForm();
    })
    .catch(err => alert("エラーが発生しました"));
}

function showTaskDropdown() {
    const taskDropdown = document.getElementById('taskDropdown');
    taskDropdown.classList.remove('hidden');
}

function hideTaskDropdown() {
    setTimeout(() => {
        const taskDropdown = document.getElementById('taskDropdown');
        taskDropdown.classList.add('hidden');
    }, 100);
}

function selectTask(task) {
    document.getElementById('taskInput').value = task;
    document.getElementById('taskDropdown').classList.add('hidden');
}

// ページ読み込み時にテンプレートを読み込む
loadTemplates();

// ウィンドウサイズ変更時に、開いているモーダルの表示クラスを更新する
window.addEventListener('resize', () => {
    document.querySelectorAll('.modal').forEach(modal => {
        if (modal.style.display === 'block') {
            const mc = modal.querySelector('.modal-content');
            if (!mc) return;
            if (window.innerWidth <= 480) {
                mc.classList.add('fullscreen');
            } else {
                mc.classList.remove('fullscreen');
            }
        }
    });
});
