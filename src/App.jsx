import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UltimateStagePianos from './pages/UltimateStagePianos';
import UltimateStagePianosV2 from './pages/UltimateStagePianosV2';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UltimateStagePianos />} />
        <Route path="/v2" element={<UltimateStagePianosV2 />} />
        <Route path="*" element={<UltimateStagePianos />} />
      </Routes>
    </Router>
  );
}

export default App;
