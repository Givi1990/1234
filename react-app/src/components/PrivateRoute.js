import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ element: Element, ...rest }) => {
  const { auth } = useAuth();

  return (
    <Route
      {...rest}
      element={auth ? <Element /> : <Navigate to="/login" />}
    />
  );
};

export default PrivateRoute;
