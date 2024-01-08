import React from 'react';
import ReactDOM from 'react-dom/client';
//import './index.css';
import Flow from './Flow';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('app-content'));
root.render(
  <React.StrictMode>
    <Flow />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
