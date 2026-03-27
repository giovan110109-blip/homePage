const cluster = require('cluster');
const os = require('os');
const path = require('path');

const numCPUs = os.cpus().length;

const forkWorker = (logicalWorkerId) => {
  const worker = cluster.fork({ WORKER_ID: String(logicalWorkerId) });
  worker.logicalWorkerId = String(logicalWorkerId);
  if (String(logicalWorkerId) === "0") {
    console.log(
      `Worker ${worker.process.pid} (ID: ${logicalWorkerId}) will start the upload queue`
    );
  }
  return worker;
};

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  console.log(`Starting ${numCPUs} workers...`);

  for (let i = 0; i < numCPUs; i++) {
    forkWorker(i);
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
    console.log('Restarting worker...');
    const logicalWorkerId = worker.logicalWorkerId ?? "0";
    forkWorker(logicalWorkerId);
  });

  cluster.on('listening', (worker, address) => {
    console.log(`Worker ${worker.process.pid} is now connected to ${address.address}:${address.port}`);
  });
} else {
  require('./app');
}
