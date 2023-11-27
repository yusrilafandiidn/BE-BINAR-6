require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    return res.json({
        status: true,
        message: 'welcome to challenge chapter 6',
        error: null,
        data: null,
    })
})

const mediaRouter = require('./routes/media.routes.js');
app.use('/api/v1', mediaRouter);

const { PORT = 3000 } = process.env;
app.listen(PORT, () => console.log('listening on port', PORT));