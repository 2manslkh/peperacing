import express, { Request, Response } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User, { IUser } from "./models/User";
import { isEligible } from "./isEligible";
import { isUser } from "./isUser";
const signing = require("./routes/Signing");
dotenv.config();

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI!);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});
app.use(express.json());
app.use("/signing", signing);
// Endpoint to handle daily check-ins
app.post("/check-in", async (req: Request, res: Response) => {
  const walletAddress: string = req.body.walletAddress.toLowerCase();
  // Get eligibility of wallet address

  // Uncomment if want to include NFTs
  // let eligible: boolean = await isEligible(walletAddress);
  let eligible: boolean = true;
  let legitUser: boolean = await isUser(walletAddress, req.body.signature);
  if (eligible && legitUser) {
    let user: IUser | null = await User.findOne({ walletAddress });
    if (!user) {
      console.log("Creating new user");
      user = new User({
        walletAddress,
        lastCheckIn: new Date(),
        streak: 1,
      });
    } else {
      const oneDay = 24 * 60 * 60 * 1000;
      const diffDays = Math.round(
        Math.abs((new Date().getTime() - user.lastCheckIn.getTime()) / oneDay)
      );

      if (diffDays == 1) {
        if (user.streak == 7) {
          user.streak = 1;
        } else {
          user.streak += 1;
        }
      } else if (diffDays > 1) {
        user.streak = 1;
      } else if (diffDays < 1) {
        return res.json({ message: "Wallet address already checked in today" });
      }
      user.lastCheckIn = new Date();
    }

    await user.save();
    res.json({ message: "Check-in successful", streak: user.streak });
  } else {
    res.json({ message: "Wallet address is not eligible for check-in" });
  }
});
app.get("/", (req: Request, res: Response) => {
  res.send("Server is up and running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
