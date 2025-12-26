import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SF2Workstation from './pages/SF2Workstation';
import SF2WorkstationV2 from './pages/SF2WorkstationV2';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SF2Workstation />} />
        <Route path="/v2" element={<SF2WorkstationV2 />} />
        <Route path="*" element={<SF2Workstation />} />
      </Routes>
    </Router>
  );
}

export default App;
