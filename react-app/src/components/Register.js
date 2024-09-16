import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';
import axios from 'axios';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrationDate] = useState(new Date().toISOString()); // Устанавливаем текущую дату регистрации
  const [lastLoginDate] = useState(new Date().toISOString()); // Последний вход тоже текущая дата при регистрации
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5002/api/register', { 
        name, 
        email, 
        password, 
        registrationDate, 
        lastLoginDate 
      });
      alert('Registration successful');
      navigate('/login');
    } catch (error) {
      console.error('Error during registration:', error);
      alert('Registration failed: ' + error.response?.data?.message || 'Unknown error occurred');
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <Form onSubmit={handleRegister}>
      <Form.Group controlId="formBasicName">
        <Form.Label>Name</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Form.Group>

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
        Register
      </Button>
      <Button variant="secondary" onClick={handleGoToLogin}>
        Go to Login
      </Button>
    </Form>
  );
};

export default Register;
