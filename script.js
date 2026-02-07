
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

        // 出勤時間をローカルストレージから挿入（あれば当日分）、なければ 09:00
        const inField = document.getElementById('inTimeForOut');
        const lastIn = JSON.parse(localStorage.getItem('lastIn') || 'null');
        if (inField) {
            if (lastIn && lastIn.date === today) {
                inField.value = lastIn.time;
            } else {
                inField.value = '09:00';
            }
            updateActualHours();
        }
    }

    modal.style.display = 'block';
} 

function closeForm() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
}

function openAddTemplateModal() {
    const templateModal = document.getElementById('templateModal');
    templateModal.style.display = 'block';
    document.getElementById('newTemplateInput').value = '';
    document.getElementById('newTemplateInput').focus();
}

function closeAddTemplateModal() {
    const templateModal = document.getElementById('templateModal');
    templateModal.style.display = 'none';
    document.getElementById('templateError').classList.add('hidden');
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
        // 成功時に出勤データをローカルに保持（退勤ポップアップでの自動挿入に使用）
        if (type === 'in') {
            try {
                if (data['in_date'] && data['in_time']) {
                    localStorage.setItem('lastIn', JSON.stringify({ date: data['in_date'], time: data['in_time'] }));
                }
            } catch (e) {
                console.warn('localStorage set failed', e);
            }
        }
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

// --- 実績時間計算機能 ---
function timeToMinutes(t) {
    if (!t) return null;
    const parts = t.split(':').map(Number);
    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
    return parts[0] * 60 + parts[1];
}

function overlapMinutes(aStart, aEnd, bStart, bEnd) {
    return Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));
}

function computeActualHours(inTimeStr, outTimeStr) {
    const inMin = timeToMinutes(inTimeStr);
    const outMin = timeToMinutes(outTimeStr);
    if (inMin === null || outMin === null) return null;
    let duration = outMin - inMin;
    if (duration < 0) duration += 24 * 60; // 日跨ぎ対応

    const breaks = [
        [11 * 60 + 45, 12 * 60 + 30], // 11:45 - 12:30
        [17 * 60 + 30, 18 * 60]       // 17:30 - 18:00
    ];

    let breakOverlap = 0;
    for (const br of breaks) {
        breakOverlap += overlapMinutes(inMin, outMin, br[0], br[1]);
    }

    let workingMinutes = duration - breakOverlap;
    if (workingMinutes < 0) workingMinutes = 0;
    const hours = workingMinutes / 60;
    return Number(hours.toFixed(2));
}

function updateActualHours() {
    const inField = document.getElementById('inTimeForOut');
    const outField = document.querySelector('input[name="out_time"]');
    const actualField = document.getElementById('actualHours');
    if (!inField || !outField || !actualField) return;
    const inVal = inField.value;
    const outVal = outField.value;
    if (!inVal || !outVal) {
        actualField.value = '';
        return;
    }
    const hours = computeActualHours(inVal, outVal);
    if (hours === null) {
        actualField.value = '';
    } else {
        actualField.value = hours.toFixed(2);
    }
}

// 入力の変化を監視
const inTimeInput = document.getElementById('inTimeForOut');
const outTimeInput = document.querySelector('input[name="out_time"]');
if (inTimeInput) inTimeInput.addEventListener('input', updateActualHours);
if (outTimeInput) outTimeInput.addEventListener('input', updateActualHours);

// --- Body scroll lock for mobile when content fits viewport ---
function updateBodyScrollLock() {
    try {
        // small tolerance for mobile address bar variations
        const needsScroll = document.documentElement.scrollHeight > (window.innerHeight + 2);
        if (!needsScroll) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }
    } catch (e) {
        // silent
    }
}

function onTouchMovePrevent(e) {
    // If body is locked, prevent touchmove except when interacting with modal content
    if (!document.body.classList.contains('no-scroll')) return;
    const path = e.composedPath ? e.composedPath() : (e.path || []);
    // allow when any ancestor is .modal-content
    for (const node of path) {
        try {
            if (node && node.classList && node.classList.contains && node.classList.contains('modal-content')) return;
        } catch (ex) {}
    }
    e.preventDefault();
}

// Initial check and listeners
document.addEventListener('DOMContentLoaded', () => {
    updateBodyScrollLock();
});
window.addEventListener('resize', updateBodyScrollLock);
window.addEventListener('orientationchange', updateBodyScrollLock);

// Watch for DOM changes that may affect page height
const bodyObserver = new MutationObserver(() => updateBodyScrollLock());
bodyObserver.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });

// Prevent touchmove when locked (passive:false to allow preventDefault)
document.addEventListener('touchmove', onTouchMovePrevent, { passive: false });


