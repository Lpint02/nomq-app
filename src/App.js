import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [text, setText] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [title, setTitle] = useState('Insert the word to reverse');


  const handleChange = (event) => {
    setText(event.target.value);
  };

  const handleClick = async () => {
    try {
      if (text) {
        console.log('Sending message:', text);
  
        const response = await axios.post('https://a9icm55wze.execute-api.us-east-1.amazonaws.com/prod/process', {
          message: text,
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
  
        console.log('API response:', response);
  
        // Verifica che la risposta sia quella attesa
        if (response.status === 200 && response.data && response.data.message) {
          // Mostra il messaggio elaborato
          setResponseMessage(`Reversed message from server: ${response.data.message}`);
        } else {
          // Mostra un messaggio generico se non si riceve il campo "message"
          setResponseMessage('Message sent successfully, but no reversed message returned.');
        }
        setIsError(false);
        setText('');
        setTitle('Insert another word');
        setTimeout(() => {
          setResponseMessage('');
        }, 20000);
  
      } else {
        setResponseMessage('The message field is empty.');
        setIsError(true);
        setTimeout(() => {
          setResponseMessage('');
        }, 20000);
      }
    } catch (error) {
      console.error('Error response:', error.response); // Log dell'errore
      if (error.response) {
        if (error.response.status === 504) {
          setResponseMessage('Request timed out.');
        } else {
          setResponseMessage(`Error sending message: ${error.response.status}`);
        }
      } else {
        setResponseMessage('Network error or other issue.');
      }
      setIsError(true);
      setTimeout(() => {
        setResponseMessage('');
      }, 20000);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleClick();
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="title">{title}</h1>
        <input
          type="text"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter your message"
        />
        <button onClick={handleClick}>
          Send Message
        </button>
        {responseMessage && (
          <p className={isError ? 'error-message' : 'success-message'}>
            {responseMessage}
          </p>
        )}
      </header>
    </div>
  );
}

export default App;
