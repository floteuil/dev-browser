import express from 'express';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.text({ type: '*/*' }));
app.use(express.json());

app.post('/execute', async (req, res) => {
  const script = typeof req.body === 'string' ? req.body : req.body.script;
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

const HTML_UI = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>dev-browser Web UI</title>
    <style>
        body { font-family: 'Inter', sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
        .container { width: 100%; max-width: 800px; background: rgba(30, 41, 59, 0.7); padding: 2rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); }
        h1 { margin-top: 0; color: #818cf8; }
        p { color: #94a3b8; line-height: 1.5; }
        textarea { width: 100%; height: 200px; background: #1e293b; color: #f8fafc; border: 1px solid #475569; border-radius: 8px; padding: 1rem; font-family: monospace; resize: vertical; margin-bottom: 1rem; box-sizing: border-box; }
        button { background: #6366f1; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: bold; transition: background 0.2s; }
        button:hover { background: #4f46e5; }
        pre { background: #000; padding: 1rem; border-radius: 8px; overflow-x: auto; color: #10b981; min-height: 50px; }
        .error { color: #ef4444; }
    </style>
</head>
<body>
    <div class="container">
        <h1>dev-browser</h1>
        <p>Bienvenue sur l'interface de test de <strong>dev-browser</strong>. Cet outil est normalement une interface en ligne de commande (CLI) utilisée par des agents IA, mais cette Web UI vous permet de tester l'exécution de scripts directement sur le serveur.</p>
        
        <textarea id="script">console.log("Test d'exécution depuis le serveur dev-browser !");</textarea>
        <button onclick="runScript()">Exécuter le Script</button>
        
        <h3 style="margin-top: 2rem;">Résultat :</h3>
        <pre id="output">En attente d'exécution...</pre>
    </div>
    <script>
        async function runScript() {
            const script = document.getElementById('script').value;
            const outputEl = document.getElementById('output');
            outputEl.textContent = 'Exécution en cours...';
            outputEl.className = '';
            
            try {
                const res = await fetch('/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ script })
                });
                const data = await res.json();
                
                if (!res.ok) {
                    outputEl.textContent = data.error + "\\n\\nStderr:\\n" + data.stderr;
                    outputEl.className = 'error';
                } else {
                    outputEl.textContent = data.stdout || "Succès ! (Aucune sortie générée)";
                    if (data.stderr) {
                        outputEl.textContent += "\\n\\nWarnings/Stderr:\\n" + data.stderr;
                    }
                }
            } catch (err) {
                outputEl.textContent = err.message;
                outputEl.className = 'error';
            }
        }
    </script>
</body>
</html>
`;

app.get('/', (req, res) => {
  res.send(HTML_UI);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'dev-browser' });
});

// Explicitly bind to 0.0.0.0 to prevent Bad Gateway issues in Docker
app.listen(port, '0.0.0.0', () => {
  console.log(`dev-browser API listening on 0.0.0.0:${port}`);
});
