/**
 * EdgeOne Cloud Function: /api/icmp-ping
 * Node.js Runtime fallback for ICMP Ping and TCP Port probing.
 * Used for VPS hosts with no HTTP/HTTPS open ports.
 */

const { exec } = require('child_process');
const net = require('net');

module.exports = async (req, res) => {
  const host = req.query.host || req.body?.host;
  const type = req.query.type || req.body?.type || 'icmp';
  const port = parseInt(req.query.port || req.body?.port || '80', 10);

  if (!host) {
    return res.status(400).json({ error: 'Missing host parameter' });
  }

  if (type === 'tcp') {
    // TCP Port Check
    const startTime = Date.now();
    const socket = new net.Socket();
    socket.setTimeout(3000);

    socket.connect(port, host, () => {
      const latency = Date.now() - startTime;
      socket.destroy();
      return res.status(200).json({ status: 'up', latency, type: 'tcp', host, port });
    });

    socket.on('error', (err) => {
      socket.destroy();
      return res.status(200).json({ status: 'down', latency: 0, error: err.message, type: 'tcp', host, port });
    });

    socket.on('timeout', () => {
      socket.destroy();
      return res.status(200).json({ status: 'down', latency: 0, error: 'Connection Timeout', type: 'tcp', host, port });
    });

  } else {
    // ICMP System Ping Check
    const cmd = process.platform === 'win32' 
      ? `ping -n 1 -w 2000 ${host}`
      : `ping -c 1 -W 2 ${host}`;

    const startTime = Date.now();
    exec(cmd, (error, stdout, stderr) => {
      const latency = Date.now() - startTime;
      if (error) {
        return res.status(200).json({
          status: 'down',
          latency: 0,
          error: 'ICMP Host Unreachable or Packet Loss',
          host,
        });
      }

      // Try parsing RTT from stdout
      let rtt = latency;
      const match = stdout.match(/time[=<](\d+\.?\d*)\s*ms/i);
      if (match && match[1]) {
        rtt = Math.round(parseFloat(match[1]));
      }

      return res.status(200).json({
        status: 'up',
        latency: rtt,
        type: 'icmp',
        host,
        raw: stdout.trim(),
      });
    });
  }
};
