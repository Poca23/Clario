/**
 * 🔄 SYNC SERVICE
 * Synchronisation Firebase <-> LocalStorage
 */

import { db } from "../config/firebase.js";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { StorageService } from "./storage.service.js";

const COLLECTION_NAME = "tasks";

export class SyncService {
  /**
   * Synchronise vers Firebase
   * @param {string} userId - ID utilisateur
   */
  static async syncToFirebase(userId) {
    try {
      const tasks = StorageService.getTasks();

      for (const task of tasks) {
        const taskRef = doc(db, COLLECTION_NAME, task.id);
        await setDoc(taskRef, {
          ...task,
          userId,
          syncedAt: new Date().toISOString(),
        });
      }

      console.log("✅ Sync Firebase: OK");
    } catch (error) {
      console.error("❌ Erreur sync Firebase:", error);
      throw error;
    }
  }

  /**
   * Récupère depuis Firebase
   * @param {string} userId - ID utilisateur
   */
  static async syncFromFirebase(userId) {
    try {
      const q = collection(db, COLLECTION_NAME);

      const snapshot = await getDocs(q);
      const firebaseTasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fusionner avec localStorage
      const localTasks = StorageService.getTasks();
      const mergedTasks = this.mergeTasks(localTasks, firebaseTasks);

      // Sauvegarder
      localStorage.setItem("clario_tasks", JSON.stringify(mergedTasks));

      console.log("✅ Sync depuis Firebase: OK");
      return mergedTasks;
    } catch (error) {
      console.error("❌ Erreur récupération Firebase:", error);
      throw error;
    }
  }

  /**
   * Fusionne les tâches (Firebase prioritaire)
   */
  static mergeTasks(localTasks, firebaseTasks) {
    const taskMap = new Map();

    // 1. Ajouter Firebase d'abord (prioritaire)
    firebaseTasks.forEach((task) => taskMap.set(task.id, task));

    // 2. Ajouter local seulement si pas dans Firebase
    localTasks.forEach((task) => {
      if (!taskMap.has(task.id)) {
        taskMap.set(task.id, task);
      }
    });

    return Array.from(taskMap.values());
  }

  /**
   * Supprime de Firebase
   */
  static async deleteFromFirebase(taskId) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, taskId));
      console.log("🗑️ Tâche supprimée Firebase:", taskId);
    } catch (error) {
      console.error("❌ Erreur suppression Firebase:", error);
    }
  }
}
