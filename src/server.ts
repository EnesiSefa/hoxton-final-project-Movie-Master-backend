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
const port = 4008;

dotenv.config();
const SECRET = process.env.SECRET!;

const prisma = new PrismaClient({ log: ["error", "info", "query", "warn"] });

function generateToken(id: number) {
  return jwt.sign({ id }, SECRET);
}

async function getCurrentUser(token: string) {
  const result = jwt.verify(token, SECRET);

  const user = await prisma.user.findUnique({
    //@ts-ignore
    where: { id: result.id },
    include: { favorites: true, reviews: true, likeDislike: true },
  });
  return user;
}

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
    const user = await prisma.user.findUnique({
      where: { email: req.body.email },
    });
    if (user && bcrypt.compareSync(req.body.password, user.password)) {
      res.send({ user: user, token: generateToken(user.id) });
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
app.get("/movies/:pagenr", async (req, res) => {
  const perPage = Number(req.query.perPage);
  const page = Number(req.params.pagenr);

  let nrToSkip;
  nrToSkip = (page - 1) * perPage;
  nrToSkip = (page - 1) * 20;

  const movies = await prisma.movie.findMany({
    skip: nrToSkip,
    take: 8,
  });
  res.send(movies);
});
app.get("/movie/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const movie = await prisma.movie.findUnique({
      where: { id: id },
      include: { reviews: true, favorite: true },
    });
    res.send(movie);
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ error: [error.message] });
  }
});
app.post("/movie", async (req, res) => {
  try {
    const movie = await prisma.movie.create({
      data: {
        title: req.body.title,
        thumbnail: req.body.thumbnail,
        video: req.body.video,
        description: req.body.description,
        duration: req.body.duration,
        year: req.body.year,
        genre: req.body.genre,
        rating: req.body.rating,
      },
    });

    res.send(movie);
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ error: [error.message] });
  }
});

app.post("/addReviewToMovie", async (req, res) => {
  try {
    const movieId = req.body.movieId;
    const userId = req.body.userId;
    const reviewComment = req.body.comment;
    console.log(movieId, userId, reviewComment);

    const review = await prisma.review.create({
      data: { movieId, userId, comment: reviewComment },
    });

    res.send(review);
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ error: [error.message] });
  }
});

app.delete("/deleteReview/:id", async (req, res) => {
  const review = await prisma.review.delete({
    where: { id: Number(req.params.id) },
  });

  res.send(review);
});

app.post("/addMovieToFavorite", async (req, res) => {
  try {
    const movieId = req.body.movieId;
    const userId = req.body.userId;
    const favorite = await prisma.favorite.create({
      data: {
        movies: { connect: { id: movieId } },
        user: { connect: { id: userId } },
      },
    });
    res.send(favorite);
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ error: [error.message] });
  }
});

app.get("/favorites", async (req, res) => {
  const favorites = await prisma.favorite.findMany({
    include: { movies: true },
  });
  res.send(favorites);
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
