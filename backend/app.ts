import express from "express";
import http from "http";
import { json } from "body-parser";
import { errorHandler } from "./middlewares/error-handler";
import { productRouter } from "./routes/product";
import { Server } from "socket.io";

const app = express();
app.use(json());
app.use("/product", productRouter);
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    errorHandler(err, req, res, next);
  }
);

export { app, server, io };
