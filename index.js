const WSS = require('ws').Server
const http = require('http')
const express = require('express')

const app = express()

const apiKeys = require('./keys.json').keys

function checkKeyValid(key) {
    let valid = false
    apiKeys.forEach((info) => {
        if (info.key == key) {
            valid = info.owner
        }
    })
    return valid
}

app.set('views', __dirname + "/views")
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
    res.render('index')
})

app.post('/api/stop', (req, res) => {
    if (!req.headers.apikey || !req.body["user"]) return res.status(400).send("400 Bad Request");
    const { apikey } = req.headers
    if (!checkKeyValid(apikey)) return res.status(401).send("401 Unauthorized");
    const { user } = req.body
    wss.clients.forEach((client) => {
        if (client.username && client.username == user) {
            wss.send("STOP")
        }
    })
})

app.post('/api/play', (req, res) => {
    if (!req.headers.apikey || !req.body["user"] || !req.body["url"]) return res.status(400).send("400 Bad Request");
    const { apikey } = req.headers
    if (!checkKeyValid(apikey)) return res.status(401).send("401 Unauthorized");
    const { user, url } = req.body

    wss.clients.forEach((client) => {
        if (client.username && client.username == user) {
            client.send("PLAY " + url)
        }
    })

    if (!res.headersSent) {
        res.status(200).send("200 Ok (player not connected)")
    }
})

const server = http.createServer(app)
const wss = new WSS({ server: server })

// setInterval(() => {
//     console.clear()
//     console.log('-------------------')
//     console.log('USERS:')
//     wss.clients.forEach((client) => {
//         console.log(client.username)
//     })
// }, 1000)

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const msg = message.toString()
        if (msg.startsWith("CONNECT ")) {
            ws.send(`Connected`)
            ws.username = msg.split(" ")[1]
        }
    })
})

server.listen(3000, () => {
    console.log('ready')
})