import { db } from "../config/firebase";
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from "firebase/firestore";

export const createIssue = async (issueData) => {
  try {
    console.log("Creating issue:", issueData);

    if (!issueData.societyId) {
      throw new Error("Missing societyId");
    }

    const docRef = await addDoc(collection(db, "issues"), issueData);

    console.log("Issue saved with ID:", docRef.id);

    return docRef.id;
  } catch (error) {
    console.error("Firestore error:", error);
    // You could also omit alert to let the component handle it natively, but this matches requested logs
    throw error;
  }
};

export const getIssuesBySociety = async (societyId) => {
  try {
    const q = query(collection(db, "issues"), where("societyId", "==", societyId));
    const querySnapshot = await getDocs(q);
    const issues = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    issues.sort((a, b) => b.createdAt - a.createdAt);
    return issues;
  } catch (error) {
    console.error("Error fetching issues:", error);
    throw error;
  }
};

export const updateIssueStatus = async (issueId, newStatus, afterImageUrl = null) => {
  try {
    const ref = doc(db, "issues", issueId);
    const updateData = { status: newStatus };
    
    if (afterImageUrl) {
      updateData.afterImage = afterImageUrl;       // screens check afterImage
      updateData.afterImageUrl = afterImageUrl;    // backward compat
    }

    await updateDoc(ref, updateData);
    console.log("Issue status updated successfully");
  } catch (error) {
    console.error("Update failed:", error);
    throw error;
  }
};

export const resolveIssue = async (issueId, imageUrl) => {
  try {
    if (!imageUrl) {
      throw new Error("Missing resolution image");
    }
    const ref = doc(db, "issues", issueId);
    await updateDoc(ref, {
      status: "Resolved",
      afterImage: imageUrl,        // screens check afterImage
      afterImageUrl: imageUrl,     // backward compat
    });
  } catch (error) {
    console.error("Resolve failed:", error);
    alert("Failed to resolve issue");
    throw error;
  }
};
