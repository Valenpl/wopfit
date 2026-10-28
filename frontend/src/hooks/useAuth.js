import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout as logoutAction } from '../redux/slices/authSlice';

/** El usuario logueado (GET /me) y cerrar sesión. */
export default function useAuth() {
  const dispatch = useDispatch();
  const me = useSelector(s => s.auth.me);
  const logout = useCallback(() => dispatch(logoutAction()), [dispatch]);
  return { me, logout };
}
