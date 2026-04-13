import sqlite3

connect_db = sqlite3.connect('database.db')
cursor = connect_db.cursor()

cursor.execute('''CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    account_type TEXT NOT NULL
)''')

cursor.execute('''INSERT INTO users (username, password, account_type) VALUES (?, ?, ?)''', 
               ('testuser', 'testpassword', 'customer'))

connect_db.commit()
connect_db.close()
print("DB works")

