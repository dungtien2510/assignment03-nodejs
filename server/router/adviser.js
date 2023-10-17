const express = require("express");

const adminController = require("../controller/admin");

const router = express.Router();

///// router chat
//router chat send message
router.post("/sendMess", adminController.postChat);

//router get chats
router.get("/chatList", adminController.getChat);

//router get chat Id
router.get("/chat/:id", adminController.getChatId);

module.exports = router;
