import { app } from './src/app.js';
import { dbConfig } from './src/config/database.js';
import { GLOBAL_CONFIG } from './src/config/env.js';

class Server {
  constructor() {
    this.port = GLOBAL_CONFIG.PORT;
  }

  async start() {
    //  We start by connecting to the database
    await dbConfig.connect();

    // 2. We start the server on the defined port (5000)
    app.listen(this.port, () => {
      console.log(` Server is running on http://localhost:${this.port}`);
    });
  }
}

// Official start of the server
const server = new Server();
server.start();
