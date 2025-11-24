/**
 * 🔄 SYNC SERVICE V2
 * Synchronisation automatique Firebase <-> LocalStorage
 *
 * WHO: Gestionnaire sync offline-first
 * WHAT: Sync auto + queue offline + détection connexion
 * WHY: Garantir cohérence données online/offline
 * HOW: Event listeners + flags sync + queue actions
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
   * 🚀 Initialise les écouteurs
   */
  static init() {
    console.log("🔄 Init SyncService, connexion:", this.isOnline);

    // Détection connexion
    window.addEventListener("online", () => {
      console.log("✅ CONNEXION RETROUVÉE");
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener("offline", () => {
      console.log("📴 CONNEXION PERDUE");
      this.isOnline = false;
    });

    // Sync initiale si online
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  /**
   * ➕ Ajoute une tâche (auto-sync)
   */
  static async addTask(task, userId) {
    console.log("➕ Ajout tâche:", task.title);

    // 1. Sauvegarde locale TOUJOURS
    const newTask = StorageService.addTask(task);
    console.log("✅ Sauvegarde locale OK");

    // 2. Sync Firebase si online
    if (this.isOnline) {
      try {
        await this.syncTaskToFirebase(newTask, userId);
        console.log("✅ Sync Firebase immédiate OK");
      } catch (error) {
        console.warn("⚠️ Échec sync immédiate, ajout à la queue");
        this.addToQueue("add", newTask, userId);
      }
    } else {
      console.log("📴 Offline: ajout à la queue");
      this.addToQueue("add", newTask, userId);
    }

    return newTask;
  }

  /**
   * ✏️ Modifie une tâche (auto-sync)
   */
  static async updateTask(taskId, updates, userId) {
    console.log("✏️ Modification tâche:", taskId);

    // 1. Sauvegarde locale
    const tasks = StorageService.getTasks();
    const taskIndex = tasks.findIndex((t) => t.id === taskId);

    if (taskIndex === -1) {
      console.error("❌ Tâche introuvable:", taskId);
      return null;
    }

    tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
    StorageService.saveTasks(tasks);
    console.log("✅ Modification locale OK");

    // 2. Sync Firebase
    if (this.isOnline) {
      try {
        await this.syncTaskToFirebase(tasks[taskIndex], userId);
        console.log("✅ Sync Firebase immédiate OK");
      } catch (error) {
        console.warn("⚠️ Échec sync, ajout à la queue");
        this.addToQueue("update", tasks[taskIndex], userId);
      }
    } else {
      console.log("📴 Offline: ajout à la queue");
      this.addToQueue("update", tasks[taskIndex], userId);
    }

    return tasks[taskIndex];
  }

  /**
   * 🗑️ Supprime une tâche (auto-sync)
   */
  static async deleteTask(taskId, userId) {
    console.log("🗑️ Suppression tâche:", taskId);

    // 1. Suppression locale
    const tasks = StorageService.getTasks();
    const filtered = tasks.filter((t) => t.id !== taskId);
    StorageService.saveTasks(filtered);
    console.log("✅ Suppression locale OK");

    // 2. Sync Firebase
    if (this.isOnline) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, taskId));
        console.log("✅ Suppression Firebase OK");
      } catch (error) {
        console.warn("⚠️ Échec suppression, ajout à la queue");
        this.addToQueue("delete", { id: taskId }, userId);
      }
    } else {
      console.log("📴 Offline: ajout à la queue");
      this.addToQueue("delete", { id: taskId }, userId);
    }
  }

  /**
   * 🔄 Sync une tâche vers Firebase
   */
  static async syncTaskToFirebase(task, userId) {
    const taskRef = doc(db, COLLECTION_NAME, task.id);
    await setDoc(taskRef, {
      ...task,
      userId,
      syncedAt: new Date().toISOString(),
    });
  }

  /**
   * 📝 Ajoute à la queue de sync
   */
  static addToQueue(action, task, userId) {
    const queue = this.getQueue();
    queue.push({ action, task, userId, timestamp: Date.now() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log("📝 Ajouté à queue:", action, task.id || task.title);
  }

  /**
   * 📋 Récupère la queue
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
   * ⚙️ Traite la queue de sync
   */
  static async processSyncQueue() {
    if (this.syncInProgress || !this.isOnline) {
      console.log("⏸️ Sync annulée (en cours ou offline)");
      return;
    }

    const queue = this.getQueue();
    if (queue.length === 0) {
      console.log("✅ Queue vide, sync Firebase complète");
      return this.fullSync();
    }

    console.log("🔄 Traitement queue:", queue.length, "actions");
    this.syncInProgress = true;

    try {
      for (const item of queue) {
        console.log(
          `🔄 Action: ${item.action}`,
          item.task.id || item.task.title
        );

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

      // Vider la queue
      localStorage.removeItem(QUEUE_KEY);
      console.log("✅ Queue traitée et vidée");

      // Sync complète finale
      await this.fullSync();
    } catch (error) {
      console.error("❌ Erreur traitement queue:", error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * 🔄 Sync complète (Firebase écrase Local)
   */
  static async fullSync() {
    console.log("🔄 Sync complète Firebase → Local");

    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      const firebaseTasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Écraser local avec Firebase (source de vérité)
      StorageService.saveTasks(firebaseTasks);
      console.log(
        "✅ Local écrasé par Firebase:",
        firebaseTasks.length,
        "tâches"
      );

      return firebaseTasks;
    } catch (error) {
      console.error("❌ Erreur sync complète:", error);
      throw error;
    }
  }

  /**
   * 🧹 Nettoyage (appelé après sync)
   */
  static cleanup() {
    localStorage.removeItem(QUEUE_KEY);
    console.log("🧹 Queue nettoyée");
  }

  // ===== MÉTHODES LEGACY (compatibilité) =====

  static async syncToFirebase(userId) {
    console.log("⚠️ syncToFirebase() legacy appelée");
    return this.processSyncQueue();
  }

  static async syncFromFirebase(userId) {
    console.log("⚠️ syncFromFirebase() legacy appelée");
    return this.fullSync();
  }

  static mergeTasks(localTasks, firebaseTasks) {
    // Désormais inutile (Firebase écrase toujours)
    return firebaseTasks;
  }

  static async deleteFromFirebase(taskId) {
    return deleteDoc(doc(db, COLLECTION_NAME, taskId));
  }
}
