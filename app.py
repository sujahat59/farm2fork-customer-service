#some quick app logic to deal with login, registration, and sub pages for cusotmers v drivers
from flask import Flask, render_template, request, jsonify, session
import sqlite3

app = Flask(__name__)

app.secret_key = 'TestKeyThingYEAH'

def db_con():
    con = sqlite3.connect('database.db')
    con.row_factory = sqlite3.Row
    return con

#default 
@app.route('/')
def default():
    return render_template('index.html')

@app.route('/login', methods=['GET','POST'])
def login():
    if request.method == 'GET':
        return render_template('login.html')
    
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    con = db_con()
    con.row_factory = sqlite3.Row 
    
    user = con.execute('SELECT * FROM users WHERE username = ? AND password = ?',
                        (username, password)).fetchone()
    con.close()

    if user:
        session['username'] = user['username']
        return jsonify({
            "status": "success", 
            "account_type": user['account_type'] 
        }), 200
    else:
        return jsonify({"status": "fail", "message": "Invalid credentials"}), 401

#register
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'GET':
        return render_template('register.html')

    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    account_type = data.get('account_type')

    con = db_con()
    try:
        con.execute('INSERT INTO users (username, password, account_type) VALUES (?, ?, ?)',
                     (username, password, account_type))
        con.commit()
        return jsonify({"status": "success"}), 201
    except Exception as e:
        return jsonify({"status": "fail", "message": str(e)}), 500
    finally:
        con.close()

#customer page
@app.route('/customer')
def customer():
    username = session.get('username', 'Admin')

    if not username:
        return ('/login')

    return render_template('customer.html', username=username)

#driver page
@app.route('/driver')
def driver():
    return render_template('driver.html')

#init
if __name__ == '__main__':
    app.run(debug=True)