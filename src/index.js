import express, { json } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import multer, { memoryStorage } from 'multer';
import { handleLogin, handleLogout, authenticateUser } from "./auth.js";
import { handleDetect, handleGetDetail, handleGetList } from "./handler.js";

const app = express();
const PORT = 9000;
const FRONTEND_URL = "https://web-apnr.vercel.app"
const upload = multer({ storage: memoryStorage() }); 

app.use(cors({ origin: true, credentials: true }));
app.use(json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.post("/auth/google", handleLogin);
app.post("/logout", handleLogout);

app.post("/detect", authenticateUser, upload.single("image"), handleDetect);
app.get("/get-list/", authenticateUser , handleGetList);
app.get("/get-vehicle-details/:plateDataId", authenticateUser, handleGetDetail);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
});
