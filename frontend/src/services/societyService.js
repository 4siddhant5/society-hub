import { db } from "../config/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore";
import { generateSocietyCode } from "../utils/generateCode";

const now = () => Date.now();

const addNotification = async ({ userId, societyId = null, title, message, type = "SYSTEM" }) => {
  if (!userId) return;

  await addDoc(collection(db, "notifications"), {
    userId,
    societyId,
    title,
    message,
    type,
    read: false,
    createdAt: now(),
  });
};

export const createSociety = async (societyData) => {
  try {
    const docRef = await addDoc(collection(db, "societies"), {
      ...societyData,
      status: societyData.status || "active",
      createdAt: now(),
      updatedAt: now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating society:", error);
    throw error;
  }
};

export const getSocietyByCode = async (code) => {
  try {
    const q = query(
      collection(db, "societies"),
      where("societyCode", "==", String(code || "").toUpperCase())
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching society By Code:", error);
    throw error;
  }
};

export const createSocietyRequest = async (requestData) => {
  try {
    const adminId = requestData.adminId || requestData.createdBy || requestData.userId;
    const docRef = await addDoc(collection(db, "societyRequests"), {
      ...requestData,
      adminId,
      createdBy: requestData.createdBy || adminId || null,
      status: "pending",
      rejectionReason: null,
      createdAt: now(),
      updatedAt: now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating society request:", error);
    throw error;
  }
};

export const getPendingSocietyRequests = async () => {
  const q = query(
    collection(db, "societyRequests"),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const getAllSocieties = async () => {
  const q = query(collection(db, "societies"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const approveSocietyRequest = async (requestId, approvedBy) => {
  try {
    return await runTransaction(db, async (transaction) => {
      const requestRef = doc(db, "societyRequests", requestId);
      const requestSnap = await transaction.get(requestRef);

      if (!requestSnap.exists()) {
        throw new Error("Society request not found.");
      }

      const requestData = requestSnap.data();
      if (requestData.status === "approved") {
        return { requestId, societyId: requestData.societyId, societyCode: requestData.societyCode, adminId: requestData.adminId };
      }

      const societyCode = requestData.societyCode || generateSocietyCode();
      const societyRef = doc(collection(db, "societies"));
      const adminRef = doc(db, "users", requestData.adminId);

      transaction.set(societyRef, {
        name: requestData.name,
        address: requestData.address || "",
        secretaryId: requestData.adminId,
        societyCode,
        status: "active",
        createdAt: now(),
        updatedAt: now(),
        approvedAt: now(),
        approvedBy,
      });

      transaction.update(adminRef, {
        status: "approved",
        societyId: societyRef.id,
        updatedAt: now(),
      });

      transaction.update(requestRef, {
        status: "approved",
        societyId: societyRef.id,
        societyCode,
        approvedAt: now(),
        approvedBy,
        updatedAt: now(),
      });

      return { requestId, societyId: societyRef.id, societyCode, adminId: requestData.adminId };
    }).then(async (result) => {
      await addNotification({
        userId: result.adminId,
        societyId: result.societyId,
        title: "Society Approved",
        message: `Your society has been approved. Your society code is ${result.societyCode}`,
        type: "SOCIETY_APPROVED",
      });
      return result;
    });
  } catch (error) {
    console.error("Error approving society request:", error);
    throw error;
  }
};

export const rejectSocietyRequest = async (requestId, rejectionReason, rejectedBy) => {
  try {
    const requestRef = doc(db, "societyRequests", requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      throw new Error("Society request not found.");
    }

    const requestData = requestSnap.data();
    await updateDoc(requestRef, {
      status: "rejected",
      rejectionReason: rejectionReason || "Not specified",
      rejectedBy,
      rejectedAt: now(),
      updatedAt: now(),
    });

    await updateDoc(doc(db, "users", requestData.adminId), {
      status: "rejected",
      rejectionReason: rejectionReason || "Not specified",
      updatedAt: now(),
    });

    await addNotification({
      userId: requestData.adminId,
      title: "Society Request Rejected",
      message: `Your request was rejected. Reason: ${rejectionReason || "Not specified"}`,
      type: "SOCIETY_REJECTED",
    });
  } catch (error) {
    console.error("Error rejecting society request:", error);
    throw error;
  }
};

export const getAllUsers = async () => {
  const snapshot = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const promoteUserToAdmin = async (userId) => {
  await updateDoc(doc(db, "users", userId), {
    role: "admin",
    status: "approved",
    requestedRole: null,
    updatedAt: now(),
  });
};

export const approveAdminRequest = async (requestId, userId, approvedBy) => {
  if (!requestId || !userId) {
    throw new Error("Admin request is missing user details.");
  }
  await promoteUserToAdmin(userId);
  await updateDoc(doc(db, "adminRequests", requestId), {
    status: "approved",
    approvedBy: approvedBy || null,
    approvedAt: now(),
    updatedAt: now(),
  });
};

export const rejectAdminRequest = async (requestId, rejectionReason, rejectedBy) => {
  if (!requestId) {
    throw new Error("Admin request not found.");
  }
  await updateDoc(doc(db, "adminRequests", requestId), {
    status: "rejected",
    rejectionReason: rejectionReason || "Not specified",
    rejectedBy: rejectedBy || null,
    rejectedAt: now(),
    updatedAt: now(),
  });
};

export const removeAdminRole = async (userId) => {
  await updateDoc(doc(db, "users", userId), {
    role: "resident",
    requestedRole: null,
    updatedAt: now(),
  });
};

export const blockUser = async (userId, reason = "") => {
  await updateDoc(doc(db, "users", userId), {
    status: "blocked",
    blockedReason: reason,
    updatedAt: now(),
  });
};

export const unblockUser = async (userId) => {
  await updateDoc(doc(db, "users", userId), {
    status: "approved",
    blockedReason: "",
    updatedAt: now(),
  });
};

export const deleteUserAccess = async (userId) => {
  await updateDoc(doc(db, "users", userId), {
    status: "deleted",
    deletedAt: now(),
    updatedAt: now(),
  });
};

export const updateSocietyDetails = async (societyId, updates) => {
  await updateDoc(doc(db, "societies", societyId), {
    ...updates,
    updatedAt: now(),
  });
};

export const setSocietyStatus = async (societyId, status) => {
  await updateDoc(doc(db, "societies", societyId), {
    status,
    updatedAt: now(),
  });
};

export const deleteGlobalAnnouncement = async (announcementId) => {
  await deleteDoc(doc(db, "globalAnnouncements", announcementId));
};

export const createGlobalAnnouncement = async ({ title, message, createdBy }) => {
  return addDoc(collection(db, "globalAnnouncements"), {
    title,
    message,
    createdBy,
    createdAt: now(),
    updatedAt: now(),
    audience: "all",
  });
};

export const getGlobalAnnouncements = async () => {
  const snapshot = await getDocs(query(collection(db, "globalAnnouncements"), orderBy("createdAt", "desc")));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const getSuperAdminAnalytics = async () => {
  const [societiesSnap, usersSnap, issuesSnap, requestsSnap] = await Promise.all([
    getDocs(collection(db, "societies")),
    getDocs(collection(db, "users")),
    getDocs(collection(db, "issues")),
    getDocs(collection(db, "societyRequests")),
  ]);

  const societies = societiesSnap.docs.map((item) => item.data());
  const users = usersSnap.docs.map((item) => item.data());
  const issues = issuesSnap.docs.map((item) => item.data());
  const requests = requestsSnap.docs.map((item) => item.data());

  return {
    totalSocieties: societiesSnap.size,
    totalUsers: usersSnap.size,
    activeIssues: issues.filter((issue) => issue.status !== "Resolved").length,
    resolvedIssues: issues.filter((issue) => issue.status === "Resolved").length,
    appUsage: usersSnap.docs.filter((item) => item.data()?.isOnline).length,
    pendingSocietyRequests: requests.filter((request) => request.status === "pending").length,
    activeSocieties: societies.filter((society) => society.status !== "suspended").length,
    suspendedSocieties: societies.filter((society) => society.status === "suspended").length,
    blockedUsers: users.filter((user) => user.status === "blocked").length,
    adminCount: users.filter((user) => user.role === "admin").length,
  };
};
