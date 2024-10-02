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
  const [isProcessing, setIsProcessing] = useState(false);
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
    if (selectedFile.size > 126 * 1024 * 1024) {
      alert('Il file è troppo grande. La dimensione massima consentita è 125MB.');
      return;
    }
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
    
      setIsUploading(false);
      setIsProcessing(true); 
      

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
      if (error.response) {
        const statusCode = error.response.status;
        
        if (statusCode === 400 || statusCode === 500) {
          // Errori di elaborazione o di parsing
          setUploadedFiles(prevFiles => prevFiles.map(uploadedFile =>
            uploadedFile.name === file.name ? { ...uploadedFile, status: 'Errore durante l\'elaborazione o parsing', color: 'red' } : uploadedFile
          ));
        }
      } else {
        setUploadedFiles(prevFiles => prevFiles.map(uploadedFile =>
          uploadedFile.name === file.name ? { ...uploadedFile, status: 'Error 504 Gateway Timeout', color: 'red' } : uploadedFile
        ));
      }
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
    <div className="App">
    <div className="centered-container">
      <div className="title-container">
        <h1 class="title">Solver per Sistemi di Equazioni Lineari di Grandi Dimensioni</h1>
      </div>

      {isPopupOpen && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h2>Informazioni sul formato corretto del file</h2>
            <p>
              Questa applicazione web restituisce il vettore soluzione x del sistema 𝐴𝑥=𝑏. Per garantire che il file venga elaborato correttamente, assicurati che il file soddisfi le seguenti caratteristiche: <br />
              1. Il file deve contenere la matrice dei coefficenti A di dimensione n x n, seguita dal vettore dei termini noti b di dimensione n <br />
              2. La matrice deve essere rappresentata come una serie di righe, dove ogni riga contiene gli elementi separati da virgole. Le righe sono separate tra loro da un punto e virgola. <br />
              3. La matrice 𝐴 deve essere seguita da una riga di separazione con tre trattini --- <br /> 
              4. Il vettore 𝑏 deve essere rappresentato come una serie di elementi separati da virgole <br />
              5. Il file deve essere salvato in formato .txt <br />
              6. La dimensione massima del file è 125 MB. <br />
              Se hai bisogno di assistenza per generare la matrice, consulta il codice disponibile nella repo GitHub.<br />
            </p>
            <button className="popup-close" onClick={togglePopup}>X</button>
          </div>
        </div>
      )}
    
      <div className="uploader-container">
        <div
          className={`dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {file ? (
            <p style={{fontSize:'1.6em'}}>{file.name}</p>
          ) : (
            <p style={{fontSize:'1.6em'}}>
              Trascina qui il tuo file di input. Per maggiori informazioni clicca qui
              <button
                onClick={togglePopup} 
                style={{ cursor: 'pointer', background: 'none', border: 'none',  boxShadow: 'none', marginLeft: '-15px' }}
              >
                <i className="fas fa-info-circle info-icon"></i>
              </button>
            </p>
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
          <div className="file-processing-table-container">
            <table className="file-processing-table">
              <thead>
                <tr>
                  <th>Nome del file</th>
                  <th>Stato</th>
                </tr>
              </thead>
              <tbody>
                {uploadedFiles.map((uploadedFile, index) => (
                  <tr key={index}>
                    <td>{uploadedFile.name}</td>
                    <td className="semaforo-container">
                      {uploadedFile.status}
                    <span> 
                      <i className={`fas fa-circle semaforo ${uploadedFile.color}`} style={{ display: 'block' }}></i>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )}
    </div>
  </div>
</div>
  );
}

export default App;


