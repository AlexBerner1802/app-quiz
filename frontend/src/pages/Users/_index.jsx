// src/pages/Users/_index.jsx
import React, { useEffect, useState } from 'react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    // adapte l’URL si ton backend est ailleurs
    fetch('http://localhost:8000/api/users')
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(setUsers)
      .catch(setErr)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Chargement des utilisateurs…</div>;
  if (err) return <div style={{color:'crimson'}}>Erreur : {err.message}</div>;

  return (
    <div style={{padding: 16}}>
      <h1>Utilisateurs</h1>
      {users.length === 0 ? (
        <p>Aucun utilisateur.</p>
      ) : (
        <ul>
          {users.map(u => (
            <li key={u.id}>{u.name || u.username || u.email || JSON.stringify(u)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
