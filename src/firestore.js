import { nanoid } from "nanoid";
import { admin, db } from "./auth.js";

export async function createNewUser(uid, email, name) {
  const userRef = db.collection('users').doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    await userRef.set({
      email: email,
      name: name,
      plateDataPaths: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`New User ${uid} added`);
  }
}

export async function saveToFirestore (uid, plateNumber, region, imageUrl, timestamp) {
  const plateDataId = nanoid(12);

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

export async function deleteFromFirestore(uid, plateDataId) {
  try {
    const plateDataRef = db.collection('plateData').doc(plateDataId);
    const plateDataDoc = await plateDataRef.get();

    if (!plateDataDoc.exists) {
      throw new Error('Plate data not found');
    }
    await plateDataRef.delete();
    const plateDataPath = `plateData/${plateDataId}`;

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      await userRef.update({
        plateDataPaths: admin.firestore.FieldValue.arrayRemove(plateDataPath),
      });
    }
  } catch (error) {
    console.error('Error deleting from Firestore:', error);
    throw new Error('Failed to delete from Firestore');
  }
}

export async function getTotalVehicle(uid) {
  try {
    const querySnapshot = await db.collection("plateData")
      .where("owner", "==", uid)
      .get();

    return { total: querySnapshot.size};
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getTotalVehiclePerRegion(uid) {
  try {
    const querySnapshot = await db.collection("plateData")
      .where("owner", "==", uid)
      .get();

    const totalPerRegion = {};

    querySnapshot.forEach(doc => {
      const data = doc.data();
      const region = data.region;

      if (region) {
        totalPerRegion[region] = (totalPerRegion[region] || 0) + 1;
      }
    });

    const topRegions = Object.entries(totalPerRegion)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return Object.fromEntries(topRegions); 
  } catch (error) {
    console.error("Error fetching total vehicles per region:", error);
    throw new Error(error.message);
  }
}

export async function getTotalVehicleDaily(uid) {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const querySnapshot = await db.collection("plateData")
      .where("owner", "==", uid)
      .where("timestamp", ">=", sevenDaysAgo.getTime())
      .get();

    const dailyCounts = {
      "Sunday": 0,
      "Monday": 0,
      "Tuesday": 0,
      "Wednesday": 0,
      "Thursday": 0,
      "Friday": 0,
      "Saturdat": 0
    };

    querySnapshot.forEach(doc => {
      const data = doc.data();
      const timestamp = data.timestamp;

      if (timestamp) {
        const date = new Date(timestamp);
        const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
        dailyCounts[dayName] = (dailyCounts[dayName] || 0) + 1;
      }
    });

    const daysOrder = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date();
      day.setDate(now.getDate() - (6 - i));
      daysOrder.push(day.toLocaleDateString("en-US", { weekday: "long" }));
    }

    const result = daysOrder.reduce((acc, day) => {
      acc[day] = dailyCounts[day] || 0;
      return acc;
    }, {});

    return result;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getTotalVehicleMonthly(uid) {
  try {
    const now = new Date();
    const fiveMonthsAgo = new Date();
    fiveMonthsAgo.setMonth(now.getMonth() - 4);

    const querySnapshot = await db.collection("plateData")
      .where("owner", "==", uid)
      .where("timestamp", ">=", fiveMonthsAgo.getTime()) 
      .get();

    const monthlyCounts = {};

    querySnapshot.forEach(doc => {
      const data = doc.data();
      const timestamp = data.timestamp;

      if (timestamp) {
        const date = new Date(timestamp);
        const month = date.toLocaleDateString("en-US", {
          month: "long",
        });

        monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
      }
    });

    const monthsOrder = [];
    for (let i = 4; i >= 0; i--) {
      const date = new Date();
      date.setMonth(now.getMonth() - i); 
      const month = date.toLocaleDateString("en-US", {
        month: "long",
      });
      monthsOrder.push(month);
    }

    const result = monthsOrder.reduce((acc, month) => {
      acc[month] = monthlyCounts[month] || 0;
      return acc;
    }, {});

    return result;
  } catch (error) {
    throw new Error(error.message);
  }
}
