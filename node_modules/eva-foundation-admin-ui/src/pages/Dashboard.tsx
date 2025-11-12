import React from 'react';

export const Dashboard: React.FC = () => {
  return (
    <div>
      <h2>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Chat Sessions</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#0078d4' }}>1,234</p>
          <p>Active conversations this month</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Documents Processed</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#107c10' }}>5,678</p>
          <p>Files indexed for RAG</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Active Users</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#5c2d91' }}>891</p>
          <p>Users with access</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>System Health</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#0078d4' }}>99.9%</p>
          <p>Uptime this month</p>
        </div>
      </div>
    </div>
  );
};
