#!/usr/bin/env node
import express from "express";
import fs from "fs";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;
const SONGS_PATH = "./songs.json";

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors()); // Allow cross-origin requests

function loadSongs() {
  if (fs.existsSync(SONGS_PATH)) {
    const data = fs.readFileSync(SONGS_PATH);
    try {
      return JSON.parse(data);
    } catch (err) {
      console.error("Error parsing songs.json, resetting file.");
      return [];
    }
  }
  // file doesn’t exist → return empty list
  return [];
}

function saveSongs(songs) {
  fs.writeFileSync(SONGS_PATH, JSON.stringify(songs, null, 2));
}

// Routes
app.get("/", (req, res) => {
  res.json({ message: "🎵 Welcome to the Songs API!" });
});

// GET /songs → List all songs
app.get("/songs", (req, res) => {
  const songs = loadSongs();
  res.json(songs);
});

// POST /songs → Add a new song
app.post("/songs", (req, res) => {
  const { title, music_scale } = req.body;

  if (!title || !music_scale) {
    return res
      .status(400)
      .json({ error: "Both 'title' and 'music_scale' are required." });
  }

  const songs = loadSongs();
  const newSong = {
    id: songs.length > 0 ? songs[songs.length - 1].id + 1 : 1,
    title,
    music_scale,
  };

  songs.push(newSong);
  saveSongs(songs);

  res.status(201).json({
    message: "✅ Song added successfully!",
    song: newSong,
  });
});

// DELETE /songs/:id → Delete song by ID
app.delete("/songs/:id", (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID parameter." });
  }

  const songs = loadSongs();
  let found = false;
  const updatedSongs = [];

  for (let song of songs) {
    if (song.id === id) {
      found = true;
      continue;
    }
    updatedSongs.push(song);
  }

  if (!found) {
    return res.status(404).json({ error: "Song not found." });
  }

  saveSongs(updatedSongs);
  res.json({ message: "🗑️ Song deleted successfully." });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🎶 Songs API running at http://0.0.0.0:${PORT}`);
});

// /**
//  * Function used to parse command line arguments
//  * @returns {command: string, options: Object}
//  */
// function parseArgs() {
//   const args = process.argv.slice(2);

//   const command = args[0];
//   const options = {};

//   for (let i = 1; i < args.length; i++) {
//     if (args[i].startsWith("--")) {
//       const key = args[i].replace("--", "");
//       const value =
//         args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true;
//       options[key] = value;
//       if (value !== true) i++;
//     }
//   }

//   return { command, options };
// }

// function addSong(title, music_scale) {
//   const songs = loadSongs();
//   const songsID = songs.length > 0 ? songs[songs.length - 1].id + 1 : 1;

//   const newSong = {
//     id: songsID,
//     title,
//     music_scale,
//   };

//   songs.push(newSong);
//   saveSongs(songs);
//   console.log("Song added correctly");
// }

// function deleteSong(id) {
//   const songs = loadSongs();
//   const targetId = parseInt(id);

//   let found = false;
//   const updatedSongs = [];

//   for (let i = 0; i < songs.length; i++) {
//     const song = songs[i];
//     if (song.id == targetId) {
//       found = true;
//       continue;
//     }
//     if (found) song.id -= 1;
//     updatedSongs.push(song);
//   }

//   if (!found) {
//     console.log("Song with that Id not found");
//     return;
//   }

//   saveSongs(updatedSongs);
//   console.log("Song deleted succesfully");
// }

// function listSongs() {
//   let songs = loadSongs();

//   if (songs.length === 0) {
//     console.log("No songs found.");
//   } else {
//     console.log("# ID\t| Title\t| Music_scale");
//     songs.forEach((song) => {
//       console.log(`# ${song.id}\t| ${song.title}\t| ${song.music_scale}`);
//     });
//   }
// }

// function main() {
//   const { command, options } = parseArgs();
//   switch (command) {
//     case "add":
//       if (options.title && options.music_scale) {
//         addSong(options.title, options.music_scale);
//       } else {
//         console.log("Usage: node index.js add --t <title> --m <music-scale>");
//       }
//       break;
//     case "list":
//       listSongs();
//       break;
//     case "delete":
//       if (options.id) {
//         deleteSong(options.id);
//       } else {
//         console.log("Usage: node index.js delete --id <song_id>");
//       }
//       break;
//     default:
//       console.log("Please provide a valid command.");
//       console.log("Usage: node index.js <command> [options]");
//       console.log("Commands:");
//       console.log(
//         "  add --title <title> --music_scale <music-scale>                  Add a new song"
//       );
//       console.log(
//         "  list                                               List all songs"
//       );
//       console.log(
//         "  delete --id <song_id>                              Delete a song by ID"
//       );
//       break;
//   }
// }

// main();
