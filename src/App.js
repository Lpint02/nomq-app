import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isError, setIsError] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
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
          setMessages(prevMessages => [...prevMessages, response.data.message]);
          setResponseMessage(`Message sent successfully!`);
          setIsError(false);
        } else {
          // Mostra un messaggio generico se non si riceve il campo "message"
          setResponseMessage('Message sent successfully, but no reversed message returned.');
          setIsError(false);
        }
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
      console.error('Error response:', error.response); 
      if (!error.response || error.response.status === 504) {
        // Considera un timeout o un errore CORS come un timeout
        setResponseMessage('Request timed out.');
      } else {
        setResponseMessage(`Error sending message: ${error.response.status}`);
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
        {messages.length > 0 && (
          <div className="messages-container">
            <h2>Reversed words:</h2>
            <ul>
              {messages.map((msg, index) => (
                <li key={index}>{msg}</li>
              ))}
            </ul>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
