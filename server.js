require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const mysql = require('mysql2');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Srinath@3280',
    database: 'audio'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('MySQL connected...');
});

function queryDatabase(query) {
    return new Promise((resolve, reject) => {
        db.query(query, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

app.post('/', async (req, res) => {
    const en_US = "these skills will allow you to read english language newspapers.";
    const te_IN = "మిమ్మల్ని కలవడం చాలా సంతోషంగా ఉంది.";
    const hi_IN = "मैं अच्छी तरह से हिंदी नहीं बोलता।";
    const sql = 'INSERT INTO multilingual_data (en_US, te_IN, hi_IN) VALUES (?, ?, ?)';
    db.query(sql, [en_US, te_IN, hi_IN], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json({ message: 'Text Inserted successfully' });
    });
})

app.get('/test', async (req, res) => {
    const result = await queryDatabase('SELECT * FROM text');
    // console.log(result);
    res.json(result);
})

app.get('/test1', async (req, res) => {
    const result = await queryDatabase('SELECT * FROM word');
    // console.log(result);
    res.json(result);
})

app.post('/register', async (req, res) => {
    const { name, email, age, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (name, email, age, password) VALUES (?, ?, ?, ?)';
    db.query(sql, [name, email, age, hashedPassword], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json({ message: 'User registered successfully', userId: result.insertId });
    });
});

app.post('/login', async (req, res) => {
    const { name, password } = req.body;
    const user = name;
    // console.log(req.body)

    try {
        const result = await queryDatabase(`SELECT * FROM users WHERE name = "${user}"`);
        // console.log(result[0])
        if (result.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }
        const resultDetails = result[0];
        const isMatch = await bcrypt.compare(password, resultDetails.password);
        if (isMatch) {
            const token = jwt.sign({ username: user.username }, 'your_secret_key', { expiresIn: '1h' });
            res.status(200).json({ success: true, message: 'Login successful', token: token, name: resultDetails.name });
        } else {
            res.status(400).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
})

app.post('/speechrecognized', (req, res) => {
    // console.log(req.body);
    const { name, greenCount, redCount, totalCount, greenWords, redWords } = req.body;

    // Convert arrays to JSON strings
    const greenWordsJson = JSON.stringify(greenWords);
    const redWordsJson = JSON.stringify(redWords);

    const sql = 'INSERT INTO sentenceinformation (name, greencount, redcount, totalcount, greenwords, redwords) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [name, greenCount, redCount, totalCount, greenWordsJson, redWordsJson], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json({ message: 'Data Inserted successfully' });
    });

})

app.post('/speechrecognizedbyword', (req, res) => {
    console.log(req.body);
    const { name, greenCount, redCount, totalcount, greenWords, redWords } = req.body;

    // Convert arrays to JSON strings
    const greenWordsJson = JSON.stringify(greenWords);
    const redWordsJson = JSON.stringify(redWords);

    const sql1 = 'INSERT INTO wordinformation (name, greencount, redcount, totalcount, greenwords, redwords) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql1, [name, greenCount, redCount, totalcount, greenWordsJson, redWordsJson], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json({ message: 'Data Inserted successfully' });
    });

})

app.listen(process.env.PORT, () => { console.log('Server running on ' + process.env.PORT) })