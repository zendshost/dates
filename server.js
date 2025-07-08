const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'database.json');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper Functions
const readData = () => {
    try {
        if (!fs.existsSync(DB_PATH)) {
            fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
        }
        const data = fs.readFileSync(DB_PATH);
        return JSON.parse(data);
    } catch (error) {
        console.error("Gagal membaca atau membuat file database:", error);
        return [];
    }
};

const writeData = (data) => {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Gagal menulis ke file database:", error);
    }
};

// --- API Endpoints ---

// GET: Ambil semua tugas
app.get('/api/tasks', (req, res) => {
    const tasks = readData();
    tasks.sort((a, b) => new Date(b.schedule_time) - new Date(a.schedule_time));
    res.json(tasks);
});

// POST: Tambah tugas baru
app.post('/api/tasks', (req, res) => {
    const tasks = readData();
    const { task_description, schedule_time } = req.body;

    if (!task_description || !schedule_time) {
        return res.status(400).json({ message: 'Deskripsi dan waktu jadwal tidak boleh kosong.' });
    }

    const newTask = { id: Date.now(), task_description, schedule_time, is_completed: false };
    tasks.push(newTask);
    writeData(tasks);
    res.status(201).json(newTask);
});

// PUT: Perbarui status tugas menjadi selesai
app.put('/api/tasks/:id', (req, res) => {
    const tasks = readData();
    const taskId = parseInt(req.params.id, 10);
    const taskIndex = tasks.findIndex(task => task.id === taskId);

    if (taskIndex !== -1) {
        tasks[taskIndex].is_completed = true;
        writeData(tasks);
        res.status(200).json(tasks[taskIndex]);
    } else {
        res.status(404).json({ message: 'Tugas tidak ditemukan.' });
    }
});

// DELETE: Hapus tugas
app.delete('/api/tasks/:id', (req, res) => {
    let tasks = readData();
    const taskId = parseInt(req.params.id, 10);
    const initialLength = tasks.length;
    
    tasks = tasks.filter(task => task.id !== taskId);

    if (tasks.length < initialLength) {
        writeData(tasks);
        res.status(200).json({ message: 'Tugas berhasil dihapus.' });
    } else {
        res.status(404).json({ message: 'Tugas tidak ditemukan.' });
    }
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
