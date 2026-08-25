import { HashRouter, Route, Routes } from 'react-router-dom';
import Terminal from './components/Terminal';
import { CmsPage } from './features/cms/CmsPage';
import './App.css';

function App() {
  return (
    <div className="App">
      <HashRouter>
        <Routes>
          <Route path="/" element={<Terminal />} />
          <Route path="*" element={<CmsPage />} />
        </Routes>
      </HashRouter>
    </div>
  );
}

export default App;
