// public/script.js

const taskInput = document.getElementById('taskInput');
const timeInput = document.getElementById('timeInput');
const addButton = document.getElementById('addButton');
const taskList = document.getElementById('taskList');

// Fungsi untuk mengambil dan menampilkan semua tugas
async function fetchAndRenderTasks() {
    const response = await fetch('/api/tasks');
    const tasks = await response.json();

    taskList.innerHTML = ''; // Kosongkan daftar

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.id = `task-${task.id}`;
        li.className = 'task-item';

        const descriptionSpan = document.createElement('span');
        descriptionSpan.textContent = task.task_description;

        const countdownSpan = document.createElement('span');
        countdownSpan.className = 'countdown';

        li.appendChild(descriptionSpan);
        li.appendChild(countdownSpan);
        taskList.appendChild(li);

        if (task.is_completed) {
            li.classList.add('completed');
            countdownSpan.textContent = "Selesai!";
        } else {
            startCountdown(task, li, countdownSpan);
        }
    });
}

// Fungsi untuk memulai hitung mundur
function startCountdown(task, taskElement, countdownElement) {
    const scheduleTime = new Date(task.schedule_time).getTime();

    const intervalId = setInterval(async () => {
        const now = new Date().getTime();
        const distance = scheduleTime - now;

        if (distance > 0) {
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            countdownElement.textContent = `${days}h ${hours}j ${minutes}m ${seconds}d`;
        } else {
            // Waktu habis!
            clearInterval(intervalId);
            taskElement.classList.add('completed');
            
            // Kirim update ke server
            await fetch(`/api/tasks/${task.id}`, { method: 'PUT' });
        }
    }, 1000);
}

// Event listener untuk tombol 'Simpan Jadwal'
addButton.addEventListener('click', async () => {
    const description = taskInput.value;
    const time = timeInput.value;

    if (description === '' || time === '') {
        alert('Harap isi deskripsi dan waktu!');
        return;
    }

    await fetch('/api/tasks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            task_description: description,
            schedule_time: time
        })
    });

    taskInput.value = '';
    timeInput.value = '';
    fetchAndRenderTasks(); // Muat ulang daftar tugas
});

// Muat data saat halaman pertama kali dibuka
fetchAndRenderTasks();
