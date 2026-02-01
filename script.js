
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

function updateCharCounts() {
    const inComment = document.getElementById('inComment');
    const inCount = document.getElementById('inCommentCount');
    if (inComment && inCount) inCount.textContent = 120 - inComment.value.length;

    const outTask = document.getElementById('taskInput');
    const outCount = document.getElementById('outTaskCount');
    if (outTask && outCount) outCount.textContent = 120 - outTask.value.length;
}

function onOutTaskInput() {
    updateCharCounts();
}

function showForm(type) {
    try {
        console.log('showForm called with', type);
        const modal = document.getElementById('modal');
        const inForm = document.getElementById('inForm');
        const outForm = document.getElementById('outForm');
        if (inForm) inForm.classList.add('hidden');
        if (outForm) outForm.classList.add('hidden');

        // 今日の日付を取得
        const today = new Date().toISOString().split('T')[0];

        if (type === 'in') {
            if (inForm) inForm.classList.remove('hidden');
            const inDateEl = document.querySelector('input[name="in_date"]');
            if (inDateEl) inDateEl.value = today;
            const inTimeEl = document.querySelector('input[name="in_time"]');
            if (inTimeEl) { inTimeEl.value = '09:00'; inTimeEl.dispatchEvent(new Event('input')); }
            updateCharCounts();
        } else {
            if (outForm) outForm.classList.remove('hidden');
            const outDateEl = document.querySelector('input[name="out_date"]');
            if (outDateEl) outDateEl.value = today;
            const outTimeEl = document.querySelector('input[name="out_time"]');
            if (outTimeEl) { outTimeEl.value = '17:30'; outTimeEl.dispatchEvent(new Event('input')); }
            // 出勤時間を直近の出勤から自動入力
            const savedIn = localStorage.getItem('lastIn_' + today);
            const outInEl = document.getElementById('outInTime');
            if (outInEl) outInEl.value = savedIn || '09:00';
            updateTaskDropdown();
            updateCharCounts();
            computeActualHours();
        }

        if (modal) {
            modal.style.display = 'block';
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
        } else {
            console.error('modal element not found');
        }
    } catch (e) {
        console.error('showForm error', e);
        alert('ポップアップを表示できませんでした（コンソールを確認してください）');
    }
} 

function closeForm() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('modal-open');
}

function openAddTemplateModal() {
    document.getElementById('templateModal').style.display = 'block';
    document.getElementById('newTemplateInput').value = '';
    document.getElementById('newTemplateInput').focus();
}

function closeAddTemplateModal() {
    document.getElementById('templateModal').style.display = 'none';
    const err = document.getElementById('templateError');
    if (err) err.classList.add('hidden');
}

function checkTemplateInput() {
    const newTemplate = document.getElementById('newTemplateInput').value.trim();
    const errorDiv = document.getElementById('templateError');
    
    if (newTemplate && taskTemplates.includes(newTemplate)) {
        errorDiv.textContent = '追加済のテンプレートです。';
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
        errorDiv.textContent = '追加済のテンプレートです。';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    taskTemplates.push(newTemplate);
    saveTemplates();
    updateTaskDropdown();
    closeAddTemplateModal();
    alert('テンプレートを追加しました');
}

function renderTimeSuggestions(containerId, inputId) {
    const times = ['08:30','09:00','09:30','10:00','11:00','11:45','12:00','12:30','13:00','15:00','17:00','17:30','18:00'];
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    times.forEach(t => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'time-chip';
        chip.textContent = t;
        chip.onclick = () => {
            const input = document.getElementById(inputId);
            if (input) {
                input.value = t;
                input.dispatchEvent(new Event('input'));
                computeActualHours();
            }
        };
        container.appendChild(chip);
    });
}

function updateTaskDropdown() {
    const list = document.getElementById('taskList');
    if (!list) return;
    list.innerHTML = '';
    taskTemplates.forEach(template => {
        const item = document.createElement('div');
        item.className = 'task-item';
        item.textContent = template;
        item.onclick = () => selectTask(template);
        list.appendChild(item);
    });
}

function filterTaskDropdown(query) {
    const list = document.getElementById('taskList');
    if (!list) return;
    const q = (query || '').toLowerCase();
    Array.from(list.children).forEach(child => {
        const txt = (child.textContent || '').toLowerCase();
        child.style.display = txt.indexOf(q) === -1 ? 'none' : 'flex';
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

// ensure time suggestions are created on focus
const inTimeField = document.getElementById('inTime');
if (inTimeField) {
    inTimeField.addEventListener('focus', () => renderTimeSuggestions('inTimeSuggestions', 'inTime'));
}
const outTimeField = document.getElementById('outTime');
if (outTimeField) {
    outTimeField.addEventListener('focus', () => renderTimeSuggestions('outTimeSuggestions', 'outTime'));
}
const outInField = document.getElementById('outInTime');
if (outInField) {
    outInField.addEventListener('focus', () => renderTimeSuggestions('outInTimeSuggestions', 'outInTime'));
}
function parseTimeToMinutes(t) {
    if (!t) return null;
    const [hh, mm] = t.split(':').map(Number);
    return hh * 60 + mm;
}

function computeActualHours() {
    const inTime = document.getElementById('outInTime').value;
    const outTime = document.getElementById('outTime').value;
    const actualField = document.getElementById('actualHours');
    if (!inTime || !outTime) {
        actualField.value = '';
        return;
    }

    let inMin = parseTimeToMinutes(inTime);
    let outMin = parseTimeToMinutes(outTime);
    if (outMin <= inMin) {
        // 翌日の扱いはここでは考慮せず空にする
        actualField.value = '';
        return;
    }

    let total = outMin - inMin;

    // ブレイク時間の差し引き（重なりがあれば差し引く）
    const breaks = [
        { start: parseTimeToMinutes('11:45'), end: parseTimeToMinutes('12:30') },
        { start: parseTimeToMinutes('17:30'), end: parseTimeToMinutes('18:00') }
    ];

    breaks.forEach(b => {
        const overlapStart = Math.max(inMin, b.start);
        const overlapEnd = Math.min(outMin, b.end);
        if (overlapEnd > overlapStart) total -= (overlapEnd - overlapStart);
    });

    const hours = (total / 60);
    // 2桁小数で表示（例: 7.75）
    actualField.value = (Math.round(hours * 100) / 100).toString();
}

function submitForm(event, type) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => data[key] = value);

    // 出勤時はローカルに出勤時間を保存（退勤時の初期値に使う）
    if (type === 'in') {
        const date = data['in_date'];
        const time = data['in_time'];
        if (date && time) localStorage.setItem('lastIn_' + date, time);
    }

    // 退勤時は実績時間を計算して追加
    if (type === 'out') {
        const actual = document.getElementById('actualHours').value;
        if (actual) data['actual_hours'] = actual;
    }

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
    updateCharCounts();
}

// ページ読み込み時にテンプレートを読み込む
loadTemplates();
// イベント登録
const inCommentField = document.getElementById('inComment');
if (inCommentField) inCommentField.addEventListener('input', updateCharCounts);
const outTaskField = document.getElementById('taskInput');
if (outTaskField) outTaskField.addEventListener('input', onOutTaskInput);
const outInField = document.getElementById('outInTime');
const outTimeField = document.getElementById('outTime');
if (outInField) outInField.addEventListener('input', computeActualHours);
if (outTimeField) outTimeField.addEventListener('input', computeActualHours);
