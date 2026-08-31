const clients = new Set()

export function addClient(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  res.write(': connected\n\n')
  clients.add(res)

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n')
  }, 30000)

  res.on('close', () => {
    clearInterval(heartbeat)
    clients.delete(res)
  })
}

export function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const client of clients) {
    client.write(payload)
  }
}

export function clientCount() {
  return clients.size
}

export default { addClient, broadcast, clientCount }
