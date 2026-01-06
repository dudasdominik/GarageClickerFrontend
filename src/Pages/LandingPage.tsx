import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/LandingPage.css";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate("/signup");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <div className="landing-page">
      <div className="landing-container">
        <h1 className="game-title">Garage Clicker</h1>
        <div className="intro-section">
          <p className="intro-text">
            Welcome to Garage Clicker, the ultimate idle clicker game where you
            start with a humble garage and build your automotive empire! Click
            to fix cars, upgrade your tools, hire mechanics, and expand your
            garage into a thriving business.
          </p>
          <p className="intro-subtext">
            Start your journey from a small garage shop to becoming the biggest
            automotive tycoon!
          </p>
        </div>
        <div className="button-container">
          <button className="btn btn-primary" onClick={handleSignUp}>
            Sign Up
          </button>
          <button className="btn btn-secondary" onClick={handleLogin}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
