import { Injectable } from '@angular/core';
import axios from 'axios';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://localhost:3000/tasks';

  async getTasks() {
    const response = await axios.get(this.apiUrl);
    return response.data;
  }

  async addTask(title: string, username: string) {
    const response = await axios.post(this.apiUrl, { title, username });
    return response.data;
  }

  async updateTask(id: number, data: any, username: string) {
    const response = await axios.put(`${this.apiUrl}/${id}`, { ...data, username });
    return response.data;
  }

  async deleteTask(id: number, username: string) {
    await axios.delete(`${this.apiUrl}/${id}`, { params: { username } });
  }
}