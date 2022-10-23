import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "@prisma/client";

const app = express();
app.use(cors());
app.options("*", cors());
app.use(express.json());
import dotenv from "dotenv";
import { Server } from "socket.io";
const port = 4003;

dotenv.config();
const SECRET = process.env.SECRET!;

const prisma = new PrismaClient();
// { log: ["error", "info", "query", "warn"] }

function generateToken(id: number) {
  return jwt.sign({ id }, SECRET);
}

async function getCurrentUser(token: string) {
  const result = jwt.verify(token, SECRET);

  const user = await prisma.user.findUnique({
    //@ts-ignore
    where: { id: result.id },
    include: {
      favorites: true,
      reviews: true,
      likes: true,
      dislikes: true,
      sentMessages: true,
    },
  });
  return user;
}

app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany({
    include: {
      favorites: true,
      reviews: true,
      likes: true,
      dislikes: true,
      receivedMessages: true,
      sentMessages: true,
    },
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
      include: {
        favorites: true,
        reviews: true,
        likes: true,
        dislikes: true,
        receivedMessages: true,
        sentMessages: true,
      },
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

app.get("/user/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        sentMessages: true,
        receivedMessages: true,
        reviews: true,
        favorites: true,
      },
    });
    res.send(user);
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ errors: [error.message] });
  }
});
app.patch("/user/:id", async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        username: req.body.username,
        email: req.body.email,
        profilePic: req.body.profilePic,
        password: req.body.password,
      },
    });
    res.send(user)
  } catch (error) {}
});

app.get("/movies", async (req, res) => {
  const movies = await prisma.movie.findMany({
    include: { reviews: { include: { user: true } }, favorite: true },
  });
  res.send(movies);
});
app.get("/movies/:pagenr", async (req, res) => {
  const perPage = Number(req.query.perPage);
  const page = Number(req.params.pagenr);

  let nrToSkip;
  nrToSkip = (page - 1) * 8;

  const movies = await prisma.movie.findMany({
    skip: nrToSkip,
    take: 8,
  });
  res.send(movies);
});
app.get("/movieCount", async (req, res) => {
  try {
    const movies = await prisma.movie.count();
    res.send({ movies });
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ error: [error.message] });
  }
});

app.get("/movie/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const movie = await prisma.movie.findUnique({
      where: { id: id },
      include: { reviews: { include: { user: true } }, favorite: true },
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

app.delete("/movie/:id", async (req, res) => {
  try {
    const movie = await prisma.movie.delete({
      where: { id: Number(req.params.id) },
      include: { reviews: true, favorite: true },
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

app.get("/reviews", async (req, res) => {
  const reviews = await prisma.review.findMany({
    include: { user: true, likes: true, dislikes: true },
  });
  res.send(reviews);
});

// app.get("/findUserFromReview/:id", async (req, res) => {
//   try {
//     const user = await prisma.user.findUnique({
//       where: { id: Number(req.params.id) },
//     });
//     res.send(user);
//   } catch (error) {
//     //@ts-ignore
//     res.status(400).send({ errors: [error.message] });
//   }
// });

app.get("/messages", async (req, res) => {
  const messages = await prisma.message.findMany({
    include: { sender: true, receiver: true },
  });
  console.log(messages);
  res.send(messages);
});
app.delete("/message/:id", async (req, res) => {
  try {
    const message = await prisma.message.delete({
      where: { id: Number(req.params.id) },
    });
    res.send(message);
  } catch (error) {}
});

app.post("/message", async (req, res) => {
  try {
    const receiverId = req.body.receiverId;
    const senderId = req.body.senderId;
    const content = req.body.content;
    const message = await prisma.message.create({
      data: {
        content,
        receiver: { connect: { id: receiverId } },
        sender: { connect: { id: senderId } },
        timeStamp: new Date(),
      },
    });
    res.send(message);
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ errors: [error.message] });
  }
});
app.post("/like", async (req, res) => {
  try {
    const liking = await prisma.like.create({
      data: {
        review: { connect: { id: req.body.reviewId } },
        user: { connect: { id: req.body.userId } },
      },
    });
    res.send(liking);
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ errors: [error.message] });
  }
});
app.post("/dislike", async (req, res) => {
  try {
    const disliking = await prisma.dislike.create({
      data: {
        review: { connect: { id: req.body.reviewId } },
        user: { connect: { id: req.body.userId } },
      },
    });
    res.send(disliking);
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ errors: [error.message] });
  }
});
app.get("/likes", async (req, res) => {
  const likes = await prisma.like.findMany({
    include: { review: true, user: true },
  });
  res.send(likes);
});
app.get("/dislikes", async (req, res) => {
  const dislikes = await prisma.dislike.findMany({
    include: { review: true, user: true },
  });
  res.send(dislikes);
});

// const io = new Server(4555, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });

// const messages: Message[] = [];

// type Message = {
//   content: string;
//   user: User & { friends: User[] };
// };

// //initializing the socket io connection
// io.on("connection", (socket) => {
//   //for a new user joining the chat
//   socket.emit("message", messages);
//   socket.on("message", (message: Message) => {
//     messages.push(message);
//     console.log(messages)
//     socket.broadcast.emit("message", messages);
//   });
// });

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
