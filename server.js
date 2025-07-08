// server.js

const express = require('express');
const fs = require('fs'); // Modul 'File System' untuk bekerja dengan file
const path = require('path');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'database.json');

// Middleware untuk membaca JSON dari request body
app.use(express.json());
// Middleware untuk menyajikan file statis dari folder 'public' (HTML, CSS, JS)
app.use(express.static('public'));

// --- Helper Functions untuk Baca/Tulis Data ---
const readData = () => {
    const data = fs.readFileSync(DB_PATH);
    return JSON.parse(data);
};

const writeData = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// --- API Endpoints ---

// GET: Mengambil semua tugas
app.get('/api/tasks', (req, res) => {
    const tasks = readData();
    res.json(tasks);
});

// POST: Menambah tugas baru
app.post('/api/tasks', (req, res) => {
    const tasks = readData();
    const newTask = {
        id: Date.now(), // ID unik berdasarkan timestamp
        task_description: req.body.task_description,
        schedule_time: req.body.schedule_time,
        is_completed: false
    };

    tasks.push(newTask);
    writeData(tasks);
    res.status(201).json(newTask);
});

// PUT: Memperbarui status tugas menjadi 'completed'
app.put('/api/tasks/:id', (req, res) => {
    const tasks = readData();
    const taskId = parseInt(req.params.id, 10);
    
    const taskIndex = tasks.findIndex(task => task.id === taskId);

    if (taskIndex !== -1) {
        tasks[taskIndex].is_completed = true;
        writeData(tasks);
        res.json(tasks[taskIndex]);
    } else {
        res.status(404).json({ message: 'Tugas tidak ditemukan' });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
