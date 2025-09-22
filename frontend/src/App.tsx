import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ShowGrid from './components/ShowGrid';
import ShowPage from './components/ShowPage';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<ShowGrid />} />
        <Route path="/show/:showName" element={<ShowPage />} />
      </Routes>
    </BrowserRouter>
  );
}
