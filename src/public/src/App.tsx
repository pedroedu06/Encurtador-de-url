import { useState } from 'react';
import './App.css'

function App() {
  const [url, setUrl] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const validateUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResponse('');
    setCopied(false);

    if (!url) {
      setError('Por favor, insira uma URL.');
      return;
    }

    if (!validateUrl(url)) {
      setError('Por favor, insira uma URL válida (ex: https://exemplo.com).');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/sendurl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      if (!res.ok) {
        throw new Error(`Falha na requisição. Código: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.resultfinal) {
        setResponse(data.resultfinal);
      } else {
         setError('Não foi possível encurtar a URL. Tente novamente.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
    

      <div className="background-stars">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 3 + 's',
              animationDuration: Math.random() * 2 + 2 + 's'
            }}
          />
        ))}
      </div>

      <main className="app-container">
        <header className="header-section">
          <h1 className="title">Encurte seus links em segundos</h1>
          <p className="subtitle">Transforme URLs longas em links curtos e fáceis de compartilhar. Rápido, seguro e gratuito.</p>
        </header>

        <section className="main-card">
          <form onSubmit={handleSubmit}>
            <label htmlFor="url-input" className="input-label">Cole seu link longo aqui</label>
            <div className="input-wrapper">
              <input
                id="url-input"
                type="text"
                className="url-input"
                placeholder="https://exemplo.com/seu-link-longo"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
              />
              {error && <div className="error-message">{error}</div>}
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Encurtando...' : 'Encurtar agora →'}
              </button>
            </div>
          </form>

          {response && (
            <div className="result-section">
              <span className="result-label">Seu link encurtado:</span>
              <div className="result-box">
                <a className="result-link" href={response} target="_blank" rel="noopener noreferrer">
                  {response}
                </a>
                <button 
                  className={`copy-btn ${copied ? 'copied' : ''}`}
                  onClick={handleCopy}
                >
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default App;
