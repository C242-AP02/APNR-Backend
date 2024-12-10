import express, { json } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import multer, { memoryStorage } from 'multer';
import { handleLogin, handleLogout, authenticateUser } from "./auth.js";
import { handleDetect, handleGetDetail, handleGetList, handleGetTotalVehicle, handleGetTotalVehicleDaily, handleGetTotalVehicleMonthly, handleGetTotalVehiclePerRegion } from "./handler.js";

const app = express();
const PORT = 9000;
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

app.get("/get-total-vehicle", authenticateUser, handleGetTotalVehicle);
app.get("/get-total-vehicle-per-region", authenticateUser, handleGetTotalVehiclePerRegion);
app.get("/get-total-vehicle-daily", authenticateUser, handleGetTotalVehicleDaily);
app.get("/get-total-vehicle-monthly", authenticateUser, handleGetTotalVehicleMonthly);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
});
