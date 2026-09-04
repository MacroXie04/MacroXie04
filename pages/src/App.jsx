import { HashRouter, Link, Route, Routes } from 'react-router-dom';
import ui from '@assets/data/ui.json';
import Terminal from './components/Terminal';
import './App.css';

function NotFoundPage() {
  return (
    <main className="app-not-found">
      <div className="app-not-found__content">
        <p className="app-not-found__status">{ui.notFound.status}</p>
        <h1>{ui.notFound.title}</h1>
        <p>{ui.notFound.description}</p>
        <Link to="/">{ui.notFound.back}</Link>
      </div>
    </main>
  );
}

function App() {
  return (
    <div className="App">
      <HashRouter>
        <Routes>
          <Route path="/" element={<Terminal />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </HashRouter>
    </div>
  );
}

export default App;
