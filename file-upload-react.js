import './App.css';
import { useState, useEffect } from 'react';

const App = () => {
  const [file, setFile] = useState()
  const handleChange = (event) =>    {
    setFile(event.target.files[0])
  }
  
  const handleSubmit = (event) => {
    event.preventDefault()
    const formData = new FormData();
    formData.append('fileUploaded', file);
    formData.append('fileName', file.name);
    formData.append('userName', 'ganesh babu');
    fetch('http://localhost:3030/api/file-upload', {
      method: 'POST',
      body: formData,
    })
    .then(res => res.json())
    .then((data) =>  {
      console.log('Data: ', data);
    })
    .catch((e) => {
      console.log('Error: ', e);
    })
  }
  return (
    <>
      <h1>Hello World!</h1>
      <form onSubmit={handleSubmit} enctype="multipart/form-data">
          <h1>React File Upload</h1>
          <input type="file" onChange={handleChange}/>
          <button type="submit">Upload</button>
      </form>
    </>
  );
}

export default App;
