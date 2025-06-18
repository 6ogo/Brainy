import React from 'react';

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 24,
  right: 24,
  zIndex: 9999,
  width: 64,
  height: 64,
  borderRadius: '50%',
  boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
  background: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'box-shadow 0.2s',
};

const imageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  borderRadius: '50%',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

export const BoltOverlay: React.FC = () => (
  <a
    href="https://bolt.new"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Open Bolt"
    style={overlayStyle}
    tabIndex={0}
  >
    <img
      src={import.meta.env.BASE_URL + 'white_circle_360x360.png'}
      alt="Bolt"
      style={imageStyle}
      draggable={false}
    />
  </a>
);

export default BoltOverlay;