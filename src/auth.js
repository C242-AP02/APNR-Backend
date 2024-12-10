import admin from "firebase-admin";
import serviceAccount from "../credentials.json" assert { type: "json" };
import { createNewUser } from "./firestore.js";
import { ML_URL } from "./ml.js";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function handleLogin (req, res) {
  const { idToken } = req.body;

  fetch(`${ML_URL}`, { method: 'GET' }).catch(() => {});

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const { uid, email, name, picture } = decodedToken;
    await createNewUser(uid, email, name);

    res.cookie("token", idToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
    });
    
    res.cookie("uid", uid, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
    })

    res.cookie("name", name, {
      httpOnly: false,
      secure: true,
      sameSite: 'None',
    })

    res.cookie("email", email, {
      httpOnly: false,
      secure: true,
      sameSite: 'None',
    })

    res.cookie("picture", picture, {
      httpOnly: false,
      secure: true,
      sameSite: 'None',
    })

    return res.status(200).json({ message: "Login successful", user: {email, name, picture} });
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).json({ message: "Invalid ID token" });
  }
}

function handleLogout(_, res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
  });  
  
  res.clearCookie("uid", {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
  });
  return res.status(200).json({ message: "Logout successful" });
}

const authenticateUser = async (req, res, next) => {
  const { uid } = req.cookies;

  if (!uid) {
    return res.status(401).json({ message: 'Unauthorized: Missing or invalid token' });
  }
  next();
};

export {admin, db, handleLogin, handleLogout, authenticateUser}