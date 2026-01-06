import LandingPage from "./Pages/LandingPage";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import SignupPage from "./Pages/SignupPage";
import LoginPage from "./Pages/LoginPage";
import GamePage from "./Pages/GamePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/gamepage" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
