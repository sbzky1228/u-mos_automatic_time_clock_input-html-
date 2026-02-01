
from flask import Flask, request, jsonify
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import time

app = Flask(__name__)

def launch_driver():
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    return webdriver.Chrome(options=options)

@app.route('/submit_in', methods=['POST'])
def submit_in():
    data = request.json
    # U-MOSにログインして出勤処理するサンプル（仮）
    driver = launch_driver()
    driver.get('https://umos.example.com/login')
    # ログイン処理など省略
    print("出勤入力: ", data)
    driver.quit()
    return jsonify({'message': '出勤情報を送信しました'})

@app.route('/submit_out', methods=['POST'])
def submit_out():
    data = request.json
    # U-MOSにログインして退勤処理するサンプル（仮）
    driver = launch_driver()
    driver.get('https://umos.example.com/login')
    # ログイン処理など省略
    print("退勤入力: ", data)
    driver.quit()
    return jsonify({'message': '退勤情報を送信しました'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
