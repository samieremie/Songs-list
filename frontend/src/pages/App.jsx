import "../css/App.css";
import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import AddSong from "./AddSong";
import NavBar from "../components/NavBar";

function App() {
  return (
    <>
      <NavBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/addsong" element={<AddSong />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
