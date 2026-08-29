const mongoose = require('mongoose');
const uri = 'mongodb://nitinkushwaha819653_db_user:IBzZJ3kTtV9cB6A5@ac-lkykems-shard-00-00.esoutvn.mongodb.net:27017,ac-lkykems-shard-00-01.esoutvn.mongodb.net:27017,ac-lkykems-shard-00-02.esoutvn.mongodb.net:27017/?ssl=true&replicaSet=atlas-rnifdo-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(uri)
  .then(() => { console.log('Connected successfully!'); process.exit(0); })
  .catch(err => { console.error('Failed to connect:', err); process.exit(1); });
