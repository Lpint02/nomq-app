import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen); // Cambia lo stato del popup
  };

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css';
    document.head.appendChild(link);
  }, []);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setUploadProgress(0);
    setSuccess(false);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files[0];

    if (droppedFile.size > 126 * 1024 * 1024) {
      alert('Il file è troppo grande. La dimensione massima consentita è 125MB.');
      return;
    }

    setFile(droppedFile);
    setUploadProgress(0);
    setSuccess(false);
  };

  const uploadFile = async () => {
    if (!file) {
        alert('Nessun file selezionato.');
        return;
    }

    if (isUploading) {
      alert('Attendi il completamento dell\'upload attuale.');
      return;
    }

    setIsUploading(true);

    let objectKey = '';  
    let bucketName = '';

    try {
        // Step 1: Ottieni la URL presigned
        const response = await axios.post('https://fuggxb8035.execute-api.us-east-1.amazonaws.com/prod/get-url-presigned', { 
            filename: file.name
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const uploadUrl = response.data.url;
        const bucketName = response.data.bucketName; 
        const objectKey = response.data.key; 
        console.log('URL presigned ricevuta:', uploadUrl);
        setError('');

        // Step 2: Carica il file usando la URL presigned
        await axios.put(uploadUrl, file, {
          headers: {
          'Content-Type': 'text/plain'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      // Aggiorna l'elenco dei file caricati, imposta il semaforo blu
      setUploadedFiles(prevFiles => [
        ...prevFiles,
        { name: file.name, status: 'Caricamento completo, Elaborazione in corso...', color: 'blue' }
      ]);
      setSuccess(true);
      setFile(null); // Resetta il file
      setUploadProgress(0);
      alert('File caricato con successo!');

      // Step 3: Invia i dettagli del file all'API
      const processResponse = await axios.post('https://a9icm55wze.execute-api.us-east-1.amazonaws.com/prod/process', {
        bucketname: bucketName,
        objectkey: objectKey
      }, {
        headers: {
            'Content-Type': 'application/json'
        }
      });

      if (processResponse.status === 200) {
        // Successo, aggiorna il semaforo a verde
        setUploadedFiles(prevFiles => prevFiles.map(file =>
          file.name === objectKey ? { ...file, status: 'Elaborazione completata', color: 'green' } : file
        ));
      }

    } catch (error) {
      // Timeout case
      setUploadedFiles(prevFiles => prevFiles.map(uploadedFile =>
      uploadedFile.name === file.name ?{ ...uploadedFile, status: 'Error 504 Gateway Timeout', color: 'red' } : uploadedFile
      ));
    } finally {
      setIsUploading(false); // Reset dello stato di caricamento
    }
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false); // Nascondi il messaggio di successo dopo 10 secondi
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="uploader-container">
      <div className="title-container">
        <h2 onClick={togglePopup} style={{ cursor: 'pointer' }}>Allega qui il tuo file: (clicca per maggiori info)</h2>
      </div>

      {isPopupOpen && (
        <div className="popup-overlay">
          <div className="popup-content">
            <button className="popup-close" onClick={togglePopup}>X</button>
            <h2>Informazioni sul formato corretto del file</h2>
            <p>
              Quando si parla di costruzione dal basso, si intende generalmente la ripresa del gioco dalla rimessa dal fondo che inizia con un calcio del portiere verso i giocatori più prossimi nella sua porzione di campo. 
              La squadra è chiamata a costruire il gioco dal basso anche quando la palla arretra verso il proprio portiere, costringendo tutti i reparti a ripiegare per iniziare una nuova azione coinvolgendo l’estremo difensore. 
              Spesso inoltre, la scelta di far arretrare il pallone rappresenta la precisa scelta di  attrarre gli avversari ampliando il campo a disposizione: una sorta di invito al pressing in modo da  disordinare la loro struttura 
              difensiva e generare una superiorità numerica o ottenere vantaggi in termini di spazi da attaccare.
              Così intesa, la costruzione dal basso non presenta tratti peculiari; ciò che la caratterizza è la sua interpretazione.
              Ad esempio, il giocatore può scegliere di verticalizzare subito il gioco alla ricerca di un compagno nella zona di centrocampo o verso la metà campo difensiva avversaria. In alternativa, le squadra può scegliere di opporsi all’attacco degli avversari e alla loro disposizione attraverso una costruzione fatta di passaggi ravvicinati e continue ricerche di linee di passaggio per superare le linee di pressione avversarie, aggredendo quindi gli spazi in modo progressivo e senza scavalcarli con un rilancio in avanti.
            </p>
          </div>
        </div>
      )}
    
      <div
        className={`dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {file ? (
          <p>{file.name}</p>
        ) : (
          <p>Trascina un file qui o clicca per selezionare un file. Dimensione massima: 125MB. </p>
        )}
        <input
          type="file"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="fileInput"
        />
      </div>
      <button className="btn" onClick={() => document.getElementById('fileInput').click()} >
        Seleziona File
      </button>
      <button className="btn" onClick={uploadFile} style={{ marginLeft: '10px' }} >
        Carica File
      </button>

      
      {uploadProgress > 0 && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
            {uploadProgress}%
          </div>
        </div>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>Caricamento completato con successo resta in attesa!</p>}

      {uploadedFiles.length > 0 && (
        <>
          <h2 className="files-title">Matrici in elaborazione o elaborate</h2>
          <ul className="uploaded-files-list">
            {uploadedFiles.map((uploadedFile, index) => (
              <li key={index}>
                <span>{uploadedFile.name} - {uploadedFile.status}</span>
                {uploadedFile.color && <i className={`fas fa-circle semaforo ${uploadedFile.color}`} />}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;


