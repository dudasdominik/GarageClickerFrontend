import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
//import './LoginPage.css';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:5168/api/Player/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const playerId = data.id ?? data.playerId;

        if (!playerId) {
          setError("Login succeeded but playerId missing from response.");
          return;
        }

        localStorage.setItem("playerId", playerId);
        localStorage.setItem("username", username);
        console.log("Login successful, playerId:", playerId);
        navigate("/gamepage");
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn-submit">
            Login
          </button>
        </form>
        <div className="button-group">
          <button onClick={() => navigate("/")} className="btn-secondary">
            Back to Landing Page
          </button>
          <button onClick={() => navigate("/signup")} className="btn-secondary">
            Go to Signup
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
