import "../css/App.css";
import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import AddSong from "./AddSong";
import TabBar from "../components/TabBar";

function App() {
  return (
    <>
      <main className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/addsong" element={<AddSong />} />
        </Routes>
      </main>
      <TabBar />
    </>
  );
}

export default App;
