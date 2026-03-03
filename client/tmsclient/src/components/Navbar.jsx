import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav style={styles.navbar}>
      <div style={styles.logo}>
        <h2>SLIIT Tennis</h2>
      </div>
      <div>
        {/* Navigates to the login page */}
        <Link to="/login" style={styles.loginBtn}>Login</Link>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#000080', // Primary: SLIIT Blue
    color: '#FFFFFF', // Secondary: White
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  logo: { margin: 0 },
  loginBtn: {
    backgroundColor: '#FF5C00', // Tertiary: SLIIT Orange
    color: '#FFFFFF',
    padding: '0.5rem 1.2rem',
    textDecoration: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    transition: 'opacity 0.2s',
  }
};

export default Navbar;