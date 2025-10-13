// sockets/socketManager.js
import { Server } from "socket.io";

let io;

// map adminId -> Set( studentIdentifier ) ; studentIdentifier could be rollNumber or studentId
const onlineByAdmin = new Map();

export const initSocket = (server, origin) => {
  io = new Server(server, {
    cors: {
      origin : [origin, "http://localhost:5173"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // student or admin can join a room (admin rooms named admin_<adminId>)
    socket.on("joinAdminRoom", (adminId) => {
      socket.join(`admin_${adminId}`);
      console.log(`Socket ${socket.id} joined admin_${adminId}`);
    });

    // student reports online (payload: { adminId, studentIdOrRoll })
    socket.on("studentOnline", ({ adminId, studentIdentifier }) => {
      if (!adminId || !studentIdentifier) return;
      const key = String(adminId);
      if (!onlineByAdmin.has(key)) onlineByAdmin.set(key, new Set());
      onlineByAdmin.get(key).add(String(studentIdentifier));
      // notify admin's room (optional)
      io.to(`admin_${adminId}`).emit("studentStatusChange", { studentIdentifier, online: true });
    });

    // student reports offline (call on disconnect or explicit event)
    socket.on("studentOffline", ({ adminId, studentIdentifier }) => {
      if (!adminId || !studentIdentifier) return;
      const key = String(adminId);
      if (onlineByAdmin.has(key)) {
        onlineByAdmin.get(key).delete(String(studentIdentifier));
        io.to(`admin_${adminId}`).emit("studentStatusChange", { studentIdentifier, online: false });
      }
    });

    socket.on("disconnecting", () => {
      // We don't have student/admin mapping on socket by default.
      // (Optional) If you want to map sockets -> studentIdentifiers, you can store that on socket when studentOnline is received.
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

export const getOnlineStudentsForAdmin = (adminId) => {
  const set = onlineByAdmin.get(String(adminId));
  return set ? new Set(set) : new Set();
};

export { io };

