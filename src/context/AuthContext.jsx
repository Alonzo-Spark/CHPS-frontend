import { createContext, useContext, useState } from 'react';

// Mock database of users
// In your real project, replace this with API calls to your backend
const MOCK_USERS = [
  { id: 1, username: 'admin',        password: 'admin123',  name: 'Marcus Thorne', role: 'ADMIN',               type: 'admin' },
  { id: 2, username: 'superadmin',   password: 'super123',  name: 'Super Admin',   role: 'SUPER ADMINISTRATOR',  type: 'admin' },
  { id: 3, username: 'staff',        password: 'staff123',  name: 'Marcus Thorne', role: 'STAFF ADMINISTRATOR',  type: 'staff' },
  { id: 4, username: 'babji',        password: 'babji123',  name: 'Babji Vanacharla', role: 'STAFF',             type: 'staff' },
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (username, password) => {
    const found = MOCK_USERS.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (found) {
      setUser(found);
      return { success: true, type: found.type };
    }
    return { success: false, error: 'Invalid username or password. Check demo credentials below.' };
  };

  const signup = (username, email, password) => {
    const newUser = {
      id: Date.now(),
      username,
      email,
      password,
      name: username,
      role: 'STAFF ADMINISTRATOR',
      type: 'staff',
    };
    setUser(newUser);
    return { success: true };
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
