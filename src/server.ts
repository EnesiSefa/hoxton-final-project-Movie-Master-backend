import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
const app = express();
app.use(cors());
app.options("*", cors());
app.use(express.json());
import dotenv from "dotenv";
dotenv.config();


const prisma = new PrismaClient({ log: ["error", "info", "query", "warn"] });

const port = 4006;
app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.send(users);
});

app.post("/sign-up", async (req, res) => {
  try {
    const foundUser = await prisma.user.findUnique({
      where: { email: req.body.email },
    });
    if (foundUser) {
      res.status(400).send({ error: "user already exist" });
    } else {
      const user = await prisma.user.create({
        data: {
          email: req.body.email,
          password: req.body.password,
          profilePic: req.body.profilePic,
          username: req.body.username,
        },
        
      });
      
      res.send(user);
    }
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ error: error.message });
  }
});
app.listen(port, () => {
  console.log(`App running: http://localhost:${port}`);
});
