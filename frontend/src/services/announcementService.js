import {
  addDoc,
  collection,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";
import { db } from "../config/firebase";

export const createAnnouncement = async (data) => {
  return await addDoc(collection(db, "announcements"), {
    ...data,
    createdAt: Date.now(),
  });
};

export const updateAnnouncement = async (id, data) => {
  return await updateDoc(doc(db, "announcements", id), data);
};

export const deleteAnnouncement = async (id) => {
  return await deleteDoc(doc(db, "announcements", id));
};
