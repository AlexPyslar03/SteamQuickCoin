import express from 'express'

const PORT = 5000;

const app = express()

app.get('/', (req, res) => {
    res.status(200).json('ХУЙ')
})

app.get('/r', (req, res) => {
    res.status(200).json('r')
})

app.listen(PORT, () => console.log('server start' + PORT))