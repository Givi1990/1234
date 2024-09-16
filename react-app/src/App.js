import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import UserTable from './components/UserTable';
import { Container } from 'react-bootstrap';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Container>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/users" element={<UserTable />} />
            <Route path="/" element={
              <div className="card" style={{ width: '30rem' }}>
                <div className="card-body">
                  <h5 className="card-title">Welcome to the User Management App</h5>
                  <br></br>
                  <p className="card-text">
                    All users should be able to block or delete themselves or any other user.
                  </p>
                  <p className="card-text">
                    If user account is blocked or deleted, any next user’s request should redirect to the login page.
                  </p>
                  <p className="card-text">
                    User can use any non-empty password (even one character). If you use a 3rd-party service to store users, you may:
                  </p>
                  <ul>
                    <li>either implement your own "users" there</li>
                    <li>accept that some requirements cannot be implemented (but you get results faster).</li>
                  </ul>
                  <p className="card-text">
                    Blocked user should not be able to login; deleted user can re-register.
                  </p>
                  <button className="btn btn-outline-primary" onClick={() => window.location.href = "/login"}>Login</button>
                  <button className="btn btn-outline-secondary" onClick={() => window.location.href = "/register"}>Register</button>
                </div>
              </div>
            } />
          </Routes>
        </Container>
      </Router>
    </AuthProvider>
  );
}

export default App;
