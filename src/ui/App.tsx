import { HashRouter, Routes, Route } from "react-router-dom";
import KanjiPage from "./Kanji";
import VocabularyPage from "./Vocabulary";
import Navbar from "./Navbar";

function App() {
  return (
    <>
      <HashRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<KanjiPage />} />
          <Route path="/vocab" element={<VocabularyPage />} />
        </Routes>
      </HashRouter>
    </>
  );
}

export default App;
