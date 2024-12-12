import imageType from "image-type";
import { deleteFromFirestore, getTotalVehicle, getTotalVehicleDaily, getTotalVehicleMonthly, getTotalVehiclePerRegion, getUserPlateData, getVehicleById, saveToFirestore } from "./firestore.js";
import { uploadToGCS, deleteFromGCS } from "./gcs.js";
import { predictImage } from "./ml.js";
import { base64ToBuffer } from "./utils.js";

export async function handleDetect (req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const { uid } = req.cookies;

    let result;
    try {
      result = await predictImage(req.file.buffer);
    } catch (predictError) {
      return res.status(400).json({ error: "No plate detected" });
    }

    let platesDataID = [];
    await Promise.all(
      result.map(async (item) => {
        const plateNumber = item.plate_number;
        const region = item.region;
    
        const image = base64ToBuffer(item.annotated_image);
        const type = imageType(image);
    
        const timestamp = Date.now();
        const fileName = `${plateNumber}-${timestamp}.jpg`;
    
        const publicUrl = await uploadToGCS(image, fileName, type.mime);
        const plateDataID = await saveToFirestore(uid, plateNumber, region, publicUrl, timestamp);
        platesDataID.push(plateDataID);
      })
    );

    if (platesDataID.length === 1 ) {
      return res.status(200).json({ message: 'Success', redirect: platesDataID[0] });
    }
    console.log(platesDataID)
    return res.status(200).json({ message: 'Success', redirect: `?items=${platesDataID.join(",")}` });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function handleGetList(req, res) {
  try {
    const { uid } = req.cookies;

    const result = await getUserPlateData(uid);

    if (result.message) {
      return res.status(200).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function handleGetDetail(req, res) {
  try {
    const { uid } = req.cookies;
    const { plateDataId } = req.params;

    const result = await getVehicleById(plateDataId);

    if (result.owner !== uid) {
      return res.status(403).json({ error: "You do not have permission to access this resource." });
    }

    if (result.message) {
      return res.status(200).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function handleDeleteVehicleData(req, res) {
  try {
    const { uid } = req.cookies;
    const { plateDataId } = req.params

    const result = await getVehicleById(plateDataId);

    if (result.owner !== uid) {
      return res.status(403).json({ error: "You do not have permission to access this resource." });
    }

    await deleteFromGCS(result.imageUrl);
    await deleteFromFirestore(uid, plateDataId);

    return res.status(200).json({ message: "Vehicle data deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function handleGetTotalVehicle(req, res) {
  try {
    const { uid } = req.cookies;
    const result = await getTotalVehicle(uid)

    res.status(200).json(result);
  } catch (error){
    res.status(500).json({ error: error.message })
  }
}

export async function handleGetTotalVehiclePerRegion(req, res) {
  try {
    const { uid } = req.cookies;
    const result = await getTotalVehiclePerRegion(uid)

    res.status(200).json(result);
  } catch (error){
    res.status(500).json({ error: error.message })
  }
}

export async function handleGetTotalVehicleDaily(req, res) {
  try {
    const { uid } = req.cookies;
    const result = await getTotalVehicleDaily(uid)

    res.status(200).json(result);
  } catch (error){
    res.status(500).json({ error: error.message })
  }
}

export async function handleGetTotalVehicleMonthly(req, res) {
  try {
    const { uid } = req.cookies;
    const result = await getTotalVehicleMonthly(uid)

    res.status(200).json(result);
  } catch (error){
    res.status(500).json({ error: error.message })
  }
}
