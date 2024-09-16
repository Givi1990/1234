import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext'; // Импортируйте useAuth

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth(); // Используйте login из контекста

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/users');
    } catch (error) {
      console.error('Error during login:', error);
      alert('Login failed: ' + error.response?.data?.message || 'Unknown error occurred');
    }
  };

  const handleGoToRegistration = () => {
    navigate('/register');
  };

  return (
    <Form onSubmit={handleLogin}>
      <Form.Group controlId="formBasicEmail">
        <Form.Label>Email address</Form.Label>
        <Form.Control
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Form.Group>

      <Form.Group controlId="formBasicPassword">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Form.Group>
      
      <Button variant="primary" type="submit">
        Login
      </Button>
      
      <Button variant="secondary" onClick={handleGoToRegistration}>
        Go to Registration
      </Button>
    </Form>
  );
};

export default Login;
