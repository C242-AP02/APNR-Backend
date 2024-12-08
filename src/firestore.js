import { nanoid } from "nanoid";
import { admin, db } from "./auth.js";

export async function createNewUser(uid, email, name) {
  const userRef = db.collection('users').doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    await userRef.set({
      email: email,
      name: name,
      plateData: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`User ${uid} created successfully.`);
  }
}

export async function saveToFirestore (uid, plateNumber, region, imageUrl, timestamp) {
  const plateDataId = nanoid(5);

  try {
    await db.collection('plateData').doc(plateDataId).set({
      id: plateDataId,
      plateNumber,
      region,
      imageUrl,
      timestamp,
      owner: uid,
    });

    const plateDataPath = `plateData/${plateDataId}`;

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      await userRef.update({
        plateDataPaths: admin.firestore.FieldValue.arrayUnion(plateDataPath),
      });
    } else {
      await userRef.set({
        plateDatePaths: [plateDataPath],
      });
    }

    return plateDataId;
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    throw new Error('Failed to save to Firestore');
  }
};

export async function getUserPlateData(uid) {
  try {
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      throw new Error("User not found");
    }

    const userData = userDoc.data();
    const plateDataPaths = userData.plateDataPaths || [];

    if (plateDataPaths.length === 0) {
      return { message: "No plate data paths found", data: [] };
    }

    const plateDataPromises = plateDataPaths.map((path) => db.doc(path).get());
    const plateDocs = await Promise.all(plateDataPromises);

    const plateData = plateDocs
      .filter((doc) => doc.exists)
      .map((doc) => {
        const data = doc.data();
        const { owner, ...rest } = data;
        return { id: doc.id, ...rest };
      });

    return { data: plateData };
  } catch (error) {
    console.error("Error fetching plate data:", error);
    throw new Error("Internal Server Error");
  }
}

export async function getVehicleById(plateDataId) {
  try {
    const docRef = db.collection("plateData").doc(plateDataId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error("Vehicle not found");
    }

    return { ...doc.data() };
  } catch (error) {
    throw new Error(error.message);
  }
};