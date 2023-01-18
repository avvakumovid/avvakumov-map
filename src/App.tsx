import React from 'react';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import './App.css';
import Map from './components/Map/Map';
import { store } from './store';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Provider store={store}>
      <div className='App'>
        <Map />
        <ToastContainer style={{ zIndex: 10 }} />
      </div>
    </Provider>
  );
}

export default App;
