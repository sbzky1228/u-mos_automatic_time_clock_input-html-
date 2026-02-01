
import os
import time
import logging
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
import requests
import msal

load_dotenv()

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# 環境変数（.env に設定）
UMOS_URL = os.getenv('UMOS_URL')
UMOS_USER = os.getenv('UMOS_USER')
UMOS_PASS = os.getenv('UMOS_PASS')
# 以下は実際のページに合わせて設定してください（セレクタ等）
UMOS_SELECTORS = {
    'username': os.getenv('UMOS_USERNAME_SELECTOR', 'input#username'),
    'password': os.getenv('UMOS_PASSWORD_SELECTOR', 'input#password'),
    'login_button': os.getenv('UMOS_LOGIN_BUTTON_SELECTOR', 'button[type=submit]'),
    # ナビや実績入力欄等は環境に合わせて更新してください
    'report_tab': os.getenv('UMOS_REPORT_TAB_SELECTOR', 'a#report'),
    'actual_button': os.getenv('UMOS_ACTUAL_BUTTON_SELECTOR', 'button#actual'),
    'in_field': os.getenv('UMOS_IN_FIELD_SELECTOR', 'input[name="work_in"]'),
    'out_field': os.getenv('UMOS_OUT_FIELD_SELECTOR', 'input[name="work_out"]'),
    'register_button': os.getenv('UMOS_REGISTER_BUTTON_SELECTOR', 'button#register')
}

# Graph API 設定
GRAPH_TENANT_ID = os.getenv('GRAPH_TENANT_ID')
GRAPH_CLIENT_ID = os.getenv('GRAPH_CLIENT_ID')
GRAPH_CLIENT_SECRET = os.getenv('GRAPH_CLIENT_SECRET')
TEAM_ID = os.getenv('GRAPH_TEAM_ID')
CHANNEL_ID = os.getenv('GRAPH_CHANNEL_ID')
THREAD_SEARCH_TEXT = os.getenv('GRAPH_THREAD_SEARCH_TEXT')

# Helper: Microsoft Graph token via client credentials
def get_graph_token():
    if not GRAPH_CLIENT_ID or not GRAPH_CLIENT_SECRET or not GRAPH_TENANT_ID:
        logging.warning('Graph credentials not configured in .env')
        return None
    app_msal = msal.ConfidentialClientApplication(
        GRAPH_CLIENT_ID,
        authority=f'https://login.microsoftonline.com/{GRAPH_TENANT_ID}',
        client_credential=GRAPH_CLIENT_SECRET
    )
    result = app_msal.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
    if 'access_token' in result:
        return result['access_token']
    logging.error('Failed to acquire Graph token: %s', result)
    return None

# Find a message in a channel that contains a specific text
def find_parent_message(token, team_id, channel_id, search_text):
    if not token or not team_id or not channel_id or not search_text:
        return None
    url = f'https://graph.microsoft.com/v1.0/teams/{team_id}/channels/{channel_id}/messages'
    headers = {'Authorization': f'Bearer {token}'}
    resp = requests.get(url, headers=headers)
    if resp.status_code != 200:
        logging.error('Failed to list messages: %s - %s', resp.status_code, resp.text)
        return None
    data = resp.json()
    for msg in data.get('value', []):
        body = msg.get('body', {}).get('content', '')
        if search_text in body:
            return msg.get('id')
    return None

# Post a reply in a thread
def post_reply(token, team_id, channel_id, parent_id, message_text):
    if not token or not parent_id:
        logging.warning('post_reply: missing token or parent_id')
        return False
    url = f'https://graph.microsoft.com/v1.0/teams/{team_id}/channels/{channel_id}/messages/{parent_id}/replies'
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    body = { 'body': { 'content': message_text } }
    resp = requests.post(url, json=body, headers=headers)
    if resp.status_code in (201, 200):
        return True
    logging.error('Failed to post reply: %s - %s', resp.status_code, resp.text)
    return False

# Playwright automation for U-MOS - these functions are scaffolds and have TODOs for selectors
def umos_submit_in(data):
    if not UMOS_URL:
        raise RuntimeError('UMOS_URL not configured in .env')
    logging.info('UMOS submit in: %s', data)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(UMOS_URL)
        # TODO: Update selectors in .env/.env.example to match actual site
        page.fill(UMOS_SELECTORS['username'], UMOS_USER)
        page.fill(UMOS_SELECTORS['password'], UMOS_PASS)
        page.click(UMOS_SELECTORS['login_button'])
        # navigate to report page
        try:
            page.wait_for_selector(UMOS_SELECTORS['report_tab'], timeout=10000)
            page.click(UMOS_SELECTORS['report_tab'])
        except PlaywrightTimeoutError:
            logging.warning('Report tab not found, continuing')
        # click actual, fill in in time
        try:
            page.wait_for_selector(UMOS_SELECTORS['actual_button'], timeout=10000)
            page.click(UMOS_SELECTORS['actual_button'])
        except PlaywrightTimeoutError:
            logging.warning('Actual button not found')
        # Fill in in_field (TODO selector)
        try:
            page.fill(UMOS_SELECTORS['in_field'], data.get('in_time', ''))
            page.click(UMOS_SELECTORS['register_button'])
            page.wait_for_timeout(3000)
        except Exception as e:
            logging.error('Failed filling in in_field: %s', e)
        browser.close()

def umos_submit_out(data):
    if not UMOS_URL:
        raise RuntimeError('UMOS_URL not configured in .env')
    logging.info('UMOS submit out: %s', data)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(UMOS_URL)
        page.fill(UMOS_SELECTORS['username'], UMOS_USER)
        page.fill(UMOS_SELECTORS['password'], UMOS_PASS)
        page.click(UMOS_SELECTORS['login_button'])
        try:
            page.wait_for_selector(UMOS_SELECTORS['report_tab'], timeout=10000)
            page.click(UMOS_SELECTORS['report_tab'])
        except PlaywrightTimeoutError:
            logging.warning('Report tab not found, continuing')
        try:
            page.wait_for_selector(UMOS_SELECTORS['actual_button'], timeout=10000)
            page.click(UMOS_SELECTORS['actual_button'])
        except PlaywrightTimeoutError:
            logging.warning('Actual button not found')
        try:
            page.fill(UMOS_SELECTORS['out_field'], data.get('out_time', ''))
            # If 'actual_hours' present, fill the internal field (selector TBD)
            # page.fill('selector_for_actual_hours', data.get('actual_hours', ''))
            page.click(UMOS_SELECTORS['register_button'])
            page.wait_for_timeout(3000)
        except Exception as e:
            logging.error('Failed filling in out_field: %s', e)
        browser.close()

@app.route('/submit_in', methods=['POST'])
def submit_in():
    data = request.json
    logging.info('Received submit_in: %s', data)
    try:
        umos_submit_in(data)
        # Post to Teams thread (if configured)
        token = get_graph_token()
        if token and TEAM_ID and CHANNEL_ID and THREAD_SEARCH_TEXT:
            parent_id = find_parent_message(token, TEAM_ID, CHANNEL_ID, THREAD_SEARCH_TEXT)
            if parent_id:
                message = f"{data.get('in_type', '')} {data.get('in_time', '')}"
                posted = post_reply(token, TEAM_ID, CHANNEL_ID, parent_id, message)
                logging.info('Posted reply to Teams: %s', posted)
        return jsonify({'message': '出勤情報を送信しました (処理を開始しました)'})
    except Exception as e:
        logging.exception('submit_in error')
        return jsonify({'message': '出勤処理中にエラーが発生しました', 'error': str(e)}), 500

@app.route('/submit_out', methods=['POST'])
def submit_out():
    data = request.json
    logging.info('Received submit_out: %s', data)
    try:
        umos_submit_out(data)
        return jsonify({'message': '退勤情報を送信しました (処理を開始しました)'})
    except Exception as e:
        logging.exception('submit_out error')
        return jsonify({'message': '退勤処理中にエラーが発生しました', 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)), debug=(os.getenv('FLASK_DEBUG', '1') == '1'))