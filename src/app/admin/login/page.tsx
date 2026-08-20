'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const res = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push('/admin');
    } else {
      setError('Senha incorreta.');
    }
  };

  return (
    <div style={{minHeight: '100vh', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{background: '#222', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '400px'}}>
        <h1 style={{color: '#e50914', fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center'}}>Admin Login</h1>
        <form onSubmit={handleLogin} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <input 
            type="password" 
            placeholder="Senha Mestra" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{padding: '1rem', background: '#333', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem'}}
          />
          <button type="submit" style={{padding: '1rem', background: '#e50914', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem'}}>
            Entrar
          </button>
          {error && <p style={{color: 'red', textAlign: 'center'}}>{error}</p>}
        </form>
      </div>
    </div>
  );
}