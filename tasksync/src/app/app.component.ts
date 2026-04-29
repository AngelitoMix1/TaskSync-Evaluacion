import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from './services/task.service';
import { SocketService } from './services/socket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  tasks: any[] = [];
  newTaskTitle: string = '';
  isLoading: boolean = true;
  errorMessage: string = '';
  editingTaskId: number | null = null;
  editTaskTitle: string = '';
  notificationMessage: string | null = null;
  notificationTimeout: any;

  // Nueva variable para almacenar el nombre del usuario
  username: string = '';

  constructor(
    private taskService: TaskService,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef
  ) {
    // Pedimos el nombre al cargar la página
    const randomNum = Math.floor(Math.random() * 1000);
    this.username = prompt('Bienvenido a TaskSync. ¿Cuál es tu nombre?') || `Usuario_${randomNum}`;
  }

  showNotification(message: string) {
    this.notificationMessage = message;
    this.cdr.detectChanges();
    if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
    this.notificationTimeout = setTimeout(() => {
      this.notificationMessage = null;
      this.cdr.detectChanges();
    }, 3500);
  }

  async ngOnInit() {
    try {
      this.tasks = await this.taskService.getTasks();
    } catch (error) {
      this.errorMessage = 'Error al conectar con el servidor. Verifica el backend.';
    } finally {
      this.isLoading = false;
    }

    // Escuchamos e identificamos quién hizo el cambio
    this.socketService.listen('taskAdded').subscribe((data: any) => {
      if (!this.tasks.find(t => t.id === data.task.id)) {
        this.tasks.push(data.task);
        if (data.username !== this.username) {
          this.showNotification(`✨ ${data.username} agregó una nueva tarea`);
        }
      }
    });

    this.socketService.listen('taskUpdated').subscribe((data: any) => {
      const index = this.tasks.findIndex(t => t.id === data.task.id);
      if (index !== -1) {
        this.tasks[index] = data.task;
        if (data.username !== this.username) {
          this.showNotification(`✏️ ${data.username} actualizó una tarea`);
        }
      }
    });

    this.socketService.listen('taskDeleted').subscribe((data: any) => {
      this.tasks = this.tasks.filter(t => t.id !== data.id);
      if (data.username !== this.username) {
        this.showNotification(`🗑️ ${data.username} eliminó una tarea`);
      }
    });
  }

  async addTask() {
    if (!this.newTaskTitle.trim()) return;
    try {
      this.errorMessage = '';
      await this.taskService.addTask(this.newTaskTitle, this.username);
      this.newTaskTitle = '';
    } catch (error) {
      this.errorMessage = 'No se pudo agregar la tarea.';
    }
  }

  async toggleTask(task: any) {
    try {
      this.errorMessage = '';
      await this.taskService.updateTask(task.id, { completed: !task.completed }, this.username);
    } catch (error) {
      this.errorMessage = 'Error al actualizar estado.';
      task.completed = !task.completed;
    }
  }

  startEdit(task: any) {
    this.editingTaskId = task.id;
    this.editTaskTitle = task.title;
  }

  cancelEdit() {
    this.editingTaskId = null;
    this.editTaskTitle = '';
  }

  async saveEdit(task: any) {
    if (!this.editTaskTitle.trim()) return; 
    try {
      this.errorMessage = '';
      await this.taskService.updateTask(task.id, { title: this.editTaskTitle }, this.username);
      this.cancelEdit();
    } catch (error) {
      this.errorMessage = 'Error al editar el texto.';
    }
  }

  async deleteTask(id: number) {
    try {
      this.errorMessage = '';
      await this.taskService.deleteTask(id, this.username);
    } catch (error) {
      this.errorMessage = 'Error al eliminar.';
    }
  }
}