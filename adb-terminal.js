const WebSocket = require('ws');
const readline = require('readline');

let connectedSocket = null;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt for host and port
function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function startServer() {
  const host = await ask("🔌 Enter WebSocket host (e.g., localhost): ") || "localhost";
  const portInput = await ask("🔌 Enter WebSocket port (e.g., 8080): ") || "8080";
  const port = parseInt(portInput, 10);

  if (isNaN(port)) {
    console.log("❌ Invalid port. Please enter a valid number.");
    rl.close();
    return;
  }

  const wss = new WebSocket.Server({ host, port }, () => {
    console.log(`🌐 Starting WebSocket server on ws://${host}:${port}`);
  });

  wss.on('connection', (ws) => {
    connectedSocket = ws;

    // Clear current line before printing connection message
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    console.log("✅ UE client connected");

    ws.on('close', () => {
      connectedSocket = null;
      console.log("❌ UE disconnected");
    });

    ws.on('error', (err) => {
      console.log(`❌ WebSocket error: ${err.message}`);
    });
  });

  inputLoop();
}

function inputLoop() {
  const interval = setInterval(() => {
    if (!connectedSocket || connectedSocket.readyState !== WebSocket.OPEN) {
      // Only log if the user is not typing
      if (!rl.line || rl.line.trim() === '') {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write("⚠️  No UE client connected. Waiting...\n");
      }
      return;
    }

    // Once connected, prompt for command and stop interval
    clearInterval(interval);
    rl.question("📥 Enter command to send: ", (command) => {
      if (connectedSocket && connectedSocket.readyState === WebSocket.OPEN) {
        connectedSocket.send(command);
        console.log("✅ Command sent to UE");
      } else {
        console.log("⚠️  No UE client connected. Command not sent.");
      }
      inputLoop(); // Restart loop after sending command
    });
  }, 500);
}

startServer();
