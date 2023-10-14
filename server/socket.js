let io;

module.exports = {
  init: (httpServer) => {
    // //io = require("socket.io")(server);: Đoạn mã này tạo một máy chủ WebSocket bằng cách sử dụng Socket.io và liên kết nó với máy chủ HTTP đã tạo.
    // // Nhờ đó, bạn có thể tạo kết nối WebSocket cho ứng dụng và giao tiếp theo thời gian thực với client.
    // // nhớ thêm cái cors này để tránh bị Exception ở đây làm nhanh nên cho phép tất cả các trang đều cors được.
    io = require("socket.io")(httpServer, {
      cors: {
        origin: "*",
      },
    });
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io is not available");
    }
    return io;
  },
};
