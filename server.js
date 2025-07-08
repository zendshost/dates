const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = 3006;

const DB_PATH = path.join(__dirname, 'database.json');
const CONFIG_PATH = path.join(__dirname, 'telegrambot.json');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper: baca & tulis database
const readData = () => {
    try {
        if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
        return JSON.parse(fs.readFileSync(DB_PATH));
    } catch (err) {
        console.error("❌ Gagal baca DB:", err);
        return [];
    }
};

const writeData = (data) => {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("❌ Gagal tulis DB:", err);
    }
};

// GET semua task
app.get('/api/tasks', (req, res) => {
    const tasks = readData();
    tasks.sort((a, b) => new Date(b.schedule_time) - new Date(a.schedule_time));
    res.json(tasks);
});

// POST task baru
app.post('/api/tasks', (req, res) => {
    const tasks = readData();
    const { task_description, schedule_time } = req.body;
    if (!task_description || !schedule_time) {
        return res.status(400).json({ message: 'Data tidak lengkap.' });
    }

    const newTask = {
        id: Date.now(),
        task_description,
        schedule_time,
        is_completed: false
    };
    tasks.push(newTask);
    writeData(tasks);
    res.status(201).json(newTask);
});

// PUT selesai
app.put('/api/tasks/:id', (req, res) => {
    const tasks = readData();
    const id = parseInt(req.params.id);
    const index = tasks.findIndex(t => t.id === id);

    if (index !== -1) {
        tasks[index].is_completed = true;
        writeData(tasks);
        res.json(tasks[index]);
    } else {
        res.status(404).json({ message: 'Tugas tidak ditemukan.' });
    }
});

// DELETE task
app.delete('/api/tasks/:id', (req, res) => {
    let tasks = readData();
    const id = parseInt(req.params.id);
    const newTasks = tasks.filter(t => t.id !== id);

    if (newTasks.length !== tasks.length) {
        writeData(newTasks);
        res.json({ message: 'Berhasil dihapus' });
    } else {
        res.status(404).json({ message: 'Tugas tidak ditemukan' });
    }
});

// POST notifikasi Telegram
app.post('/api/notify', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Pesan kosong' });

        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        const { chatId, botToken } = config;

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: message })
        });

        if (!response.ok) throw new Error('Gagal kirim pesan');

        res.json({ success: true });
    } catch (err) {
        console.error('❌ Gagal kirim Telegram:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server berjalan di http://localhost:${PORT}`);
});
