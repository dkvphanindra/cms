import { FormEvent, useState } from 'react';
import { api } from '../../lib/api';
import { LoginResponse } from '../../types';
import { motion } from 'framer-motion';
import { Shield, User, Lock, LogIn } from 'lucide-react';

type Props = {
  onLoginSuccess: (data: LoginResponse) => void;
};

export default function LoginPage({ onLoginSuccess }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const data = await api.login(username, password);
      onLoginSuccess(data);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page auth-page custom-bg">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card auth-card"
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div className="icon-wrapper" style={{ margin: '0 auto 15px auto', width: '60px', height: '60px', fontSize: '1.5rem' }}>
            <Shield size={30} />
          </div>
          <h2 style={{ color: 'var(--primary)', marginBottom: '8px' }}>Welcome Back</h2>
          <p className="muted" style={{ fontSize: '0.9rem' }}>Certificates Management Portal</p>
        </div>

        <form onSubmit={onSubmit} className="stack">
          <label className="field">
            <span><User size={14} style={{ marginRight: '4px' }} /> Roll Number / Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. 21B91A0501"
              required
              disabled={loading}
            />
          </label>
          <label className="field">
            <span><Lock size={14} style={{ marginRight: '4px' }} /> Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </label>
          
          {message && (
            <p className="message danger" style={{ fontSize: '0.85rem', textAlign: 'center' }}>
              {message}
            </p>
          )}

          <button 
            type="submit" 
            style={{ marginTop: '10px', padding: '12px' }} 
            disabled={loading}
          >
            {loading ? 'Logging in...' : <><LogIn size={18} /> Login</>}
          </button>
        </form>
        
        <p className="muted" style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8rem' }}>
          Secure Student Data Portal | Digital Locker
        </p>
      </motion.div>
    </div>
  );
}