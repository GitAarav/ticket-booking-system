const app = require('./app');
const { startSweepJob } = require('./jobs/sweepJob');

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  startSweepJob();
  console.log('Sweep job started');
});
