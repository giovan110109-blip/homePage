const cluster = require('cluster');
const os = require('os');
const path = require('path');

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  console.log(`Starting ${numCPUs} workers...`);

  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork({ WORKER_ID: i });
    if (i === 0) {
      console.log(`Worker ${worker.process.pid} (ID: ${i}) will start the upload queue`);
    }
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
    console.log('Restarting worker...');
    const newWorker = cluster.fork({ WORKER_ID: worker.id });
    if (worker.id === 0) {
      console.log(`Worker ${newWorker.process.pid} (ID: ${worker.id}) will start the upload queue`);
    }
  });

  cluster.on('listening', (worker, address) => {
    console.log(`Worker ${worker.process.pid} is now connected to ${address.address}:${address.port}`);
  });
} else {
  require('./app');
}