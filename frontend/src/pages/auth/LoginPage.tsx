import { FormEvent, useState } from 'react';
import { api } from '../../lib/api';
import { LoginResponse } from '../../types';

type Props = {
  onLoginSuccess: (data: LoginResponse) => void;
};

export default function LoginPage({ onLoginSuccess }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('Logging in...');

    try {
      const data = await api.login(username, password);
      onLoginSuccess(data);
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  return (
    <div className="auth-card">
      <h2>Campus Credential Portal</h2>
      <p className="muted">Login using roll number (student) or admin username.</p>
      <form onSubmit={onSubmit} className="stack">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username / Roll Number"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit">Login</button>
      </form>
      <p className="message">{message}</p>
    </div>
  );
}