import React from 'react'
import '@testing-library/jest-dom/vitest'

// Some test transpilation paths still rely on the classic JSX runtime.
// Expose React globally so unbound `React` identifiers don't crash.
globalThis.React = React

