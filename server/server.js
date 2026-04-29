const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let tasks = [];
let currentId = 1;



// 📖 READ (Obtener todas las tareas)
app.get('/tasks', (req, res) => {
    res.json(tasks);
});


app.post('/tasks', (req, res) => {
    const { title, username } = req.body; 
    
    const task = { 
        id: currentId++, 
        title: title, 
        completed: false 
    };
    
    tasks.push(task);
    
    // Emitimos la tarea y quién la creó a los demás clientes
    io.emit('taskAdded', { task, username }); 
    res.status(201).json(task);
});


app.put('/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { username, ...updateData } = req.body;
    
    const index = tasks.findIndex(t => t.id === id);
    
    if (index !== -1) {
        // Actualizamos los datos de la tarea en nuestro arreglo
        tasks[index] = { ...tasks[index], ...updateData };
        
        // Emitimos la tarea actualizada y quién la modificó
        io.emit('taskUpdated', { task: tasks[index], username });
        res.json(tasks[index]);
    } else {
        res.status(404).json({ message: 'Tarea no encontrada' });
    }
});


app.delete('/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const username = req.query.username || 'Alguien';
    
    // Filtramos el arreglo para quitar la tarea con ese ID
    tasks = tasks.filter(t => t.id !== id);
    
    // Avisamos a todos qué ID se eliminó y quién lo hizo
    io.emit('taskDeleted', { id, username });
    res.status(204).send();
});



const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor de TaskSync corriendo en http://localhost:${PORT}`);
});