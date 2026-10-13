import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { addProblemToPlaylist, createPlaylist, deletePlaylist, getAllListDetails, getPlaylistDetails, removeProblemFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";


const playlistRoutes = express.Router();



playlistRoutes.get("/", authMiddleware, getAllListDetails);
playlistRoutes.get("/:playlistId", authMiddleware, getPlaylistDetails);

playlistRoutes.post("/create-playlist", authMiddleware, createPlaylist);
playlistRoutes.post("/:playlistId/add-problem", authMiddleware, addProblemToPlaylist);
playlistRoutes.patch("/:playlistId", authMiddleware, updatePlaylist);

playlistRoutes.delete("/:playlistId", authMiddleware, deletePlaylist);
playlistRoutes.delete("/:playlistId/remove-problem", authMiddleware, removeProblemFromPlaylist);



export default playlistRoutes;
