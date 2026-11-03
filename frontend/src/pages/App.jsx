import "../css/App.css";
import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import AddSong from "./AddSong";
import Setlists from "./Setlists";
import Setlist from "./Setlist";
import TabBar from "../components/TabBar";

function App() {
  return (
    <>
      <main className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/addsong" element={<AddSong />} />
          <Route path="/sub-liste" element={<Setlists />} />
          <Route path="/sub-liste/:date" element={<Setlist />} />
        </Routes>
      </main>
      <TabBar />
    </>
  );
}

export default App;
