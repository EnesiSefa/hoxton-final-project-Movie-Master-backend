import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const app = express();
app.use(cors());
app.options("*", cors());
app.use(express.json());
import dotenv from "dotenv";

dotenv.config();
const SECRET = process.env.SECRET!;

const prisma = new PrismaClient({ log: ["error", "info", "query", "warn"] });

function generateToken(id: number) {
  return jwt.sign({ id }, SECRET);
}



async function getCurrentUser(token: string) {
  const decodedData = jwt.verify(token, SECRET);

  const user = await prisma.user.findUnique({
    //@ts-ignore
    where: { id: decodedData.id },
    include: { favorites: true, reviews: true },
  });
  return user;
}

const port = 4007;
app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany({
    include: { favorites: true, reviews: true, likeDislike: true },
  });
  res.send(users);
});

app.post("/sign-up", async (req, res) => {
  try {
    const foundUser = await prisma.user.findUnique({
      where: { email: req.body.email },
    });
    if (foundUser) {
      res.status(400).send({ error: "user already exists" });
    } else {
      const user = await prisma.user.create({
        data: {
          email: req.body.email,
          password: bcrypt.hashSync(req.body.password, 10),
          profilePic: req.body.profilePic,
          username: req.body.username,
        },
      });

      res.send({ user, token: generateToken(user.id) });
    }
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ error: [error.message] });
  }
});
app.post("/sign-in", async (req, res) => {
  try {
    const errors: string[] = [];

    if (typeof req.body.email !== "string") {
      errors.push("Email not provided or not a string");
    }
    if (typeof req.body.password !== "string") {
      errors.push("Password not provided or not a string");
    }

    if (errors.length > 0) {
      res.status(400).send({ errors });
      return;
    }
    const findUser = await prisma.user.findUnique({
      where: { email: req.body.email },
    });
    if (findUser && bcrypt.compareSync(req.body.password, findUser.password)) {
      res.send({ findUser, token: generateToken(findUser.id) });
    } else {
      res.status(400).send({
        errors: ["Email/Password is not correct"],
      });
    }
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ errors: [error.message] });
  }
});

app.delete("/user/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const deleteUser = await prisma.user.delete({
      where: { id },
      include: { favorites: true, reviews: true, likeDislike: true },
    });
    if (deleteUser) {
      res.send(deleteUser);
    } else {
      res.status(404).send({ errors: ["user not found"] });
    }
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ errors: [error.message] });
  }
});

app.get("/validate", async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (token) {
      const user = await getCurrentUser(token);
      if (user) {
        const newToken = generateToken(user.id);
        res.send({ user, token: newToken });
      } else {
        res.status(400).send({ errors: ["Token is invalid!"] });
      }
    } else {
      res.status(400).send({ errors: ["Token not provided!"] });
    }
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ errors: [error.message] });
  }
});
app.listen(port, () => {
  console.log(`App running: http://localhost:${port}`);
});
