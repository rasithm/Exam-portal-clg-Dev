// C:\Users\nazeer\Downloads\Exam-portal\Exam-portal\backend\sockets\socketManager.js
import { Server } from "socket.io";

let io;

export const initSocket = (server, origin) => {
  io = new Server(server, {
    cors: {
      origin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Student/admin joins their college room
    socket.on("joinCollege", (collegeTag) => {
      socket.join(`college_${collegeTag}`);
      console.log(`Socket ${socket.id} joined college_${collegeTag}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

export { io };
