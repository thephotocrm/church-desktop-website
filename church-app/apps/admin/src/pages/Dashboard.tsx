import React from 'react';

export function Dashboard() {
  return (
    <div style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1>Church App Admin</h1>
      <nav>
        <ul>
          <li><a href="/approvals">User Approvals</a></li>
        </ul>
      </nav>
      <p>Admin dashboard — Phase 5</p>
    </div>
  );
}
