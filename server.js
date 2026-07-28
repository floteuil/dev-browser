import express from 'express';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const port = 3000;

app.use(express.text({ type: '*/*' }));

app.post('/execute', async (req, res) => {
  const script = req.body;
  if (!script) {
    return res.status(400).send('Script is required');
  }

  const scriptId = uuidv4();
  const scriptPath = path.join('/tmp', `${scriptId}.js`);

  try {
    await fs.writeFile(scriptPath, script);
    
    // Execute dev-browser with the script
    exec(`dev-browser --headless < ${scriptPath}`, (error, stdout, stderr) => {
      // Clean up the script file
      fs.unlink(scriptPath).catch(console.error);

      if (error) {
        return res.status(500).json({
          error: error.message,
          stdout,
          stderr
        });
      }
      
      res.json({
        stdout,
        stderr
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('dev-browser API is running');
});

app.listen(port, () => {
  console.log(`dev-browser API listening on port ${port}`);
});
