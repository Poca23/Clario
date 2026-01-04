/**
 * 🔄 SYNC SERVICE
 * Synchronisation automatique Firebase <-> LocalStorage
 */

import { db } from "../config/firebase.js";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { StorageService } from "./storage.service.js";

const COLLECTION_NAME = "tasks";
const QUEUE_KEY = "clario_sync_queue";

export class SyncService {
  static isOnline = navigator.onLine;
  static syncInProgress = false;

  /**
   * Initialise les écouteurs de connexion
   */
  static init() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });

    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  /**
   * Ajoute une tâche avec sync automatique
   */
  static async addTask(task, userId) {
    const newTask = StorageService.addTask(task);

    if (this.isOnline) {
      try {
        await this.syncTaskToFirebase(newTask, userId);
      } catch (error) {
        console.error("❌ Échec sync immédiate:", error);
        this.addToQueue("add", newTask, userId);
      }
    } else {
      this.addToQueue("add", newTask, userId);
    }

    return newTask;
  }

  /**
   * Modifie une tâche avec sync automatique
   */
  static async updateTask(taskId, updates, userId) {
    const tasks = StorageService.getTasks();
    const taskIndex = tasks.findIndex((t) => t.id === taskId);

    if (taskIndex === -1) {
      console.error("❌ Tâche introuvable:", taskId);
      return null;
    }

    tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
    StorageService.saveTasks(tasks);

    if (this.isOnline) {
      try {
        await this.syncTaskToFirebase(tasks[taskIndex], userId);
      } catch (error) {
        console.error("❌ Échec sync modification:", error);
        this.addToQueue("update", tasks[taskIndex], userId);
      }
    } else {
      this.addToQueue("update", tasks[taskIndex], userId);
    }

    return tasks[taskIndex];
  }

  /**
   * Supprime une tâche avec sync automatique
   */
  static async deleteTask(taskId, userId) {
    const tasks = StorageService.getTasks();
    const filtered = tasks.filter((t) => t.id !== taskId);
    StorageService.saveTasks(filtered);

    if (this.isOnline) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, taskId));
      } catch (error) {
        console.error("❌ Échec suppression Firebase:", error);
        this.addToQueue("delete", { id: taskId }, userId);
      }
    } else {
      this.addToQueue("delete", { id: taskId }, userId);
    }
  }

  /**
   * ✅ FIX : Synchronise une tâche vers Firebase AVEC createdAt
   */
  static async syncTaskToFirebase(task, userId) {
    const taskRef = doc(db, COLLECTION_NAME, task.id);

    // ✅ Garantir que createdAt existe TOUJOURS
    const taskData = {
      ...task,
      userId,
      createdAt: task.createdAt || Date.now(), // ⚡ FIX ICI
      syncedAt: new Date().toISOString(),
    };

    await setDoc(taskRef, taskData);
  }

  /**
   * Ajoute une action à la queue de synchronisation
   */
  static addToQueue(action, task, userId) {
    const queue = this.getQueue();
    queue.push({ action, task, userId, timestamp: Date.now() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }

  /**
   * Récupère la queue de synchronisation
   */
  static getQueue() {
    try {
      const data = localStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Traite la queue de synchronisation
   */
  static async processSyncQueue() {
    if (this.syncInProgress || !this.isOnline) return;

    const queue = this.getQueue();
    if (queue.length === 0) {
      return this.fullSync();
    }

    this.syncInProgress = true;

    try {
      for (const item of queue) {
        switch (item.action) {
          case "add":
          case "update":
            await this.syncTaskToFirebase(item.task, item.userId);
            break;
          case "delete":
            await deleteDoc(doc(db, COLLECTION_NAME, item.task.id));
            break;
        }
      }

      localStorage.removeItem(QUEUE_KEY);
      await this.fullSync();
    } catch (error) {
      console.error("❌ Erreur traitement queue:", error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * ✅ FIX : Synchronisation complète avec préservation createdAt
   */
  static async fullSync() {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      const firebaseTasks = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // ✅ Garantir createdAt même si absent dans Firebase
          createdAt: data.createdAt || this.extractTimestampFromId(doc.id),
        };
      });

      StorageService.saveTasks(firebaseTasks);
      return firebaseTasks;
    } catch (error) {
      console.error("❌ Erreur sync complète:", error);
      throw error;
    }
  }

  /**
   * ✅ HELPER : Extrait timestamp depuis l'ID (fallback)
   */
  static extractTimestampFromId(taskId) {
    const match = taskId.match(/_(\d+)$/);
    return match ? parseInt(match[1], 10) : Date.now();
  }

  /**
   * Supprime directement de Firebase
   */
  static async deleteFromFirebase(taskId) {
    return deleteDoc(doc(db, COLLECTION_NAME, taskId));
  }
}
