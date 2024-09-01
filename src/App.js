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

        const response = await axios.post('https://e009njynmk.execute-api.us-east-1.amazonaws.com/prod/process', {
          message: text,
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        // Se la richiesta ha successo
        setResponseMessage('Message sent successfully!');
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
      if (error.response && error.response.status === 504) {
        setResponseMessage('Request timed out.');
      } else {
        setResponseMessage('Error sending message');
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
          disabled={!isConnected}
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
