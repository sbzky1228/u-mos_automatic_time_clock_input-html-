/**
 * [グローバル定数・変数]
 * プログラム全体で共有し、状態を管理するための変数です。
 */
let savedStartTime = "09:00"; // 出勤時に報告した時間を保持し、退勤画面の初期値として利用します。
let currentMgrType = 'start'; // 現在「出勤」と「退勤」どちらのテンプレートを編集しているかを判別します。

// テンプレートデータの初期値。ユーザーがブラウザを閉じてもいいようにLocalStorageで管理します。
let templates = {
    start: ['【現場直行】', '【リモート】', '【AM休暇】'],
    end: ['【定例会議】', '【資料作成】', '【メール対応】']
};

/**
 * [初期化処理]
 * ページが読み込まれた瞬間に、保存されているデータの読み込みと画面描画を行います。
 */
window.onload = function() {
    // LocalStorageから過去に保存したユーザー専用テンプレートを読み込みます。
    const stored = localStorage.getItem('userWorkTemplatesV3');
    if (stored) {
        templates = JSON.parse(stored);
    }
    // 出勤モーダルと退勤モーダル、それぞれのボタン一覧を画面に作ります。
    renderMainTemplates();
};

/**
 * [出退勤画面：テンプレートボタン生成]
 * 登録されているテンプレート文字列を元に、クリック可能なボタンを自動で並べます。
 */
function renderMainTemplates() {
    // 出勤報告モーダル内のコメント入力エリア（start）にボタンを描画
    renderMainType('start', 'start-template-container', 'comment');
    // 退勤報告モーダル内の業務内容領域（end）にボタンを描画
    renderMainType('end', 'end-template-container', 'work-content');
}

/**
 * [テンプレート描画の共通ロジック]
 * @param {string} type - 'start' (出勤) か 'end' (退勤) か
 * @param {string} containerId - ボタンを追加するHTML要素のID
 * @param {string} targetId - ボタンを押した時に文字を書き込むテキストエリアのID
 */
function renderMainType(type, containerId, targetId) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // 既存のボタンを一度クリアします。
    
    templates[type].forEach(text => {
        const btn = document.createElement('button');
        btn.className = 'mini-btn';
        // 見た目をスッキリさせるため、表示上は【 】を外した文字を出します。
        btn.innerText = text.replace(/【|】/g, ''); 
        
        // ボタンをクリックした時の動作
        btn.onclick = () => {
            const area = document.getElementById(targetId);
            // 既に文字が入っている場合は改行を入れてから追記します。
            area.value += (area.value ? "\n" : "") + text;
        };
        container.appendChild(btn);
    });
}

/**
 * [管理画面：ポップアップを開く]
 * テンプレートの追加・削除を行う専用の編集画面を表示します。
 */
function openTemplateManager(type) {
    currentMgrType = type; // 今どちらを編集しているか記録
    const modal = document.getElementById('template-manager-modal');
    const title = document.getElementById('mgr-title');
    const errorMsg = document.getElementById('mgr-error');
    const input = document.getElementById('mgr-new-input');
    
    modal.classList.remove('hidden'); // ポップアップを表示
    errorMsg.style.display = 'none';  // エラー表示を隠す
    input.value = '';                 // 入力欄を空にする
    
    // 編集画面のタイトルを動的に変更
    title.innerText = (type === 'start') ? '出勤テンプレート編集' : '退勤テンプレート編集';
    
    // 追加ボタンが押された時の処理をここで定義
    document.getElementById('mgr-add-btn').onclick = function() {
        const name = input.value.trim();
        if (!name) return; // 空っぽなら何もしない
        
        const fullText = `【${name}】`;
        
        // [修正ポイント] 重複チェック機能
        if (templates[currentMgrType].includes(fullText)) {
            errorMsg.style.display = 'block'; // 「すでに追加済です」を表示
        } else {
            errorMsg.style.display = 'none';
            templates[currentMgrType].push(fullText); // データを追加
            saveAndRefresh(); // 保存と画面更新
            input.value = ''; // 入力欄をリセット
            renderMgrList();  // 削除リストも再描画
        }
    };
    
    renderMgrList(); // 現在の登録済みリストを表示
}

/**
 * [管理画面：削除用ボタンリストの描画]
 */
function renderMgrList() {
    const list = document.getElementById('mgr-list');
    list.innerHTML = ''; // 一度クリア
    
    templates[currentMgrType].forEach((text, index) => {
        const btn = document.createElement('button');
        btn.className = 'mini-btn delete-btn'; // 削除専用の赤いスタイルを適用
        btn.innerText = text.replace(/【|】/g, '');
        
        // 削除ボタンをクリックした時の動作
        btn.onclick = () => {
            templates[currentMgrType].splice(index, 1); // 配列から指定の1件を消す
            saveAndRefresh(); // 保存と反映
            renderMgrList();  // 自分自身を書き換えてリストを更新
        };
        list.appendChild(btn);
    });
}

/**
 * [データ保存と画面反映]
 * 変更があった際にLocalStorageへ保存し、メイン画面のボタンも最新の状態にします。
 */
function saveAndRefresh() {
    localStorage.setItem('userWorkTemplatesV3', JSON.stringify(templates));
    renderMainTemplates(); // メイン画面のショートカットボタンを更新
}

/**
 * [管理画面を閉じる]
 */
function closeTemplateManager() {
    document.getElementById('template-manager-modal').classList.add('hidden');
}

/**
 * [基本画面遷移機能]
 * メインメニューと月報メニューなどの表示を切り替えます。
 */
function toggleMenu(targetId) {
    document.getElementById('main-screen').classList.add('hidden');
    document.getElementById('monthly-screen').classList.add('hidden');
    document.getElementById(targetId).classList.remove('hidden');
}

/**
 * [出勤報告モーダルを開く]
 */
function openAttendanceModal() {
    document.getElementById('attendance-modal').classList.remove('hidden');
    // 日付選択欄に「今日」の日付を自動的にセットします。
    const now = new Date();
    document.getElementById('report-date').value = now.toISOString().substr(0, 10);
}

/**
 * [退勤報告モーダルを開く]
 */
function openLeaveModal() {
    document.getElementById('leave-modal').classList.remove('hidden');
    const now = new Date();
    document.getElementById('leave-date').value = now.toISOString().substr(0, 10);
    // 出勤報告時に保存した時間を初期値として自動入力します。
    document.getElementById('leave-start-time').value = savedStartTime;
    // 開いた瞬間に実稼働時間を計算します。
    calculateWorkHours();
}

/**
 * [実稼働計算ロジック]
 * 開始時間と終了時間から、会社規定の休憩時間を引いた数値を算出します。
 */
function calculateWorkHours() {
    const sVal = document.getElementById('leave-start-time').value;
    const eVal = document.getElementById('end-time').value;
    if (!sVal || !eVal) return;

    // "09:00" のような文字列を、計算しやすいように「0時からの累計分数」に直す関数
    const toMin = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    const start = toMin(sVal);
    const end = toMin(eVal);

    // 単純な差分（拘束時間）
    let total = end - start;
    if (total < 0) total += 24 * 60; // 深夜を跨いだ場合の補正

    // 重複する時間を計算するための補助関数
    const overlap = (s1, e1, s2, e2) => Math.max(0, Math.min(e1, e2) - Math.max(s1, s2));
    
    // 休憩時間の定義（分数換算）
    // 休憩1: 11:45(705分) 〜 12:30(750分) ＝ 45分
    // 休憩2: 17:30(1050分) 〜 18:00(1080分) ＝ 30分
    let breakMin = 0;
    breakMin += overlap(start, end, 705, 750);
    breakMin += overlap(start, end, 1050, 1080);

    // 実稼働時間 ＝ 拘束時間 － 休憩合計時間
    const workHours = (total - breakMin) / 60;
    // 結果を小数点2位（例: 7.50）で入力欄に表示します。
    document.getElementById('work-hours').value = workHours.toFixed(2);
}

/**
 * [モーダルをすべて閉じる]
 */
function closeAllModals() {
    document.getElementById('attendance-modal').classList.add('hidden');
    document.getElementById('leave-modal').classList.add('hidden');
}

/**
 * [出勤送信ボタンの動作]
 */
function submitAttendance() {
    // 後の退勤計算に使うため、入力された出勤時間を変数にキープします。
    savedStartTime = document.getElementById('start-time').value;
    alert(`出勤報告を完了しました。\n本日の開始：${savedStartTime}`);
    closeAllModals();
}

/**
 * [退勤送信ボタンの動作]
 */
function submitLeave() {
    const res = document.getElementById('work-hours').value;
    alert(`退勤報告を完了しました。\n本日の実稼働：${res}時間`);
    closeAllModals();
}

/**
 * [汎用アクションハンドラ]
 * まだ中身が作られていないボタン（日報、出社など）の分岐処理です。
 */
function handleAction(type) {
    alert(`${type}の機能は現在準備中です。次はここを作りましょう！`);
}