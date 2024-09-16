import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Form } from 'react-bootstrap';
import { FaTrashAlt, FaLock, FaUnlock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UserTable = () => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!auth || !auth.token) return;

      try {
        const response = await axios.get('http://localhost:5002/api/users', {
          headers: {
            Authorization: `Bearer ${auth.token}`
          }
        });
        setUsers(response.data);
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          await logout();
          navigate('/login');
        }
      }
    };

    fetchUsers();
  }, [auth, logout, navigate]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(new Set(users.map(user => user._id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(userId)) {
        newSelected.delete(userId);
      } else {
        newSelected.add(userId);
      }
      return newSelected;
    });
  };

  const handleAction = async (action) => {
    if (!auth || !auth.token || selectedUsers.size === 0) {
      console.log('auth или token не определен, либо нет выбранных пользователей');
      return;
    }

    try {
      const selectedUserIds = Array.from(selectedUsers);

      // Проверка, если пользователь выбирает сам себя
      if (auth.user && selectedUserIds.includes(auth.user._id)) {
        console.log(`Пользователь выполняет действие (${action}) сам для себя`);

        // Выполнение действия для самого себя
        await axios.post(`http://localhost:5002/api/users/${action}`, {
          userIds: selectedUserIds
        }, {
          headers: {
            Authorization: `Bearer ${auth.token}`
          }
        });

        // Удаление токена и перенаправление на страницу логина
        await logout();
        navigate('/login');

        return;
      }

      // Выполнение действий для других пользователей
      console.log('Выполнение действия для других пользователей');

      await axios.post(`http://localhost:5002/api/users/${action}`, {
        userIds: selectedUserIds
      }, {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      });

      // Получение обновленного списка пользователей
      const updatedResponse = await axios.get('http://localhost:5002/api/users', {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      });

      console.log('Ответ сервера при обновлении пользователей:', updatedResponse);

      if (updatedResponse && updatedResponse.status === 200) {
        setUsers(updatedResponse.data);
        setSelectedUsers(new Set());
        toast.success(`Users ${action}ed successfully`);
      } else {
        console.error('Ошибка при обновлении списка пользователей.');
      }
    } catch (error) {
      console.error('Ошибка выполнения действия:', error);
      toast.error('Ошибка выполнения действия');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  return (
    <div>
      <ToastContainer />
      <div className="d-flex justify-content-between mb-3">
        <Button onClick={() => handleAction('block')} variant="warning">
          <FaLock /> Block
        </Button>
        <Button onClick={() => handleAction('unblock')} variant="success">
          <FaUnlock /> Unblock
        </Button>
        <Button onClick={() => handleAction('delete')} variant="danger">
          <FaTrashAlt /> Delete
        </Button>
      </div>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>
              <Form.Check
                type="checkbox"
                onChange={handleSelectAll}
                checked={users.length > 0 && selectedUsers.size === users.length}
              />
            </th>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Registration Date</th>
            <th>Last Login Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id}>
              <td><Form.Check type="checkbox" checked={selectedUsers.has(user._id)} onChange={() => handleSelectUser(user._id)} /></td>
              <td>{user._id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{formatDate(user.registrationDate)}</td>
              <td>{user.lastLogin ? formatDate(user.lastLogin) : 'Never logged in'}</td>
              <td>{user.status}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default UserTable;
