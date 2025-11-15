import express from 'express';
import mockDataRoutes from './routes/mockdata';

const app = express();
app.use('/api/mockdata', mockDataRoutes);

app.listen(4000, () => {
  console.log('Mock data server on http://localhost:4000');
  console.log('Single sensor:  GET http://localhost:4000/api/mockdata/sensor');
  console.log('Batch sensor:   GET http://localhost:4000/api/mockdata/sensor/batch/5');
});