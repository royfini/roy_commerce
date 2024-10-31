import express from "express";
import http from "http";
import "express-async-errors";
import { json } from "body-parser";
import { productRouter } from "./routes/product";
import { Server } from "socket.io";
import cors from "cors";
import { categoryRouter } from "./routes/category";
import { brandRouter } from "./routes/brand";
import { supplierRouter } from "./routes/supplier";
import { errorHandler } from "./middlewares/error-handler";
import { purchaseRouter } from "./routes/purshase";

const app = express();
app.use(cors())
app.use(json());
app.use("/product", productRouter);
app.use("/category", categoryRouter);
app.use("/brand", brandRouter);
app.use("/supplier", supplierRouter);
app.use('/purchase', purchaseRouter);
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

//add error handler middleware
app.use(errorHandler as express.ErrorRequestHandler);

export { app, server, io };
