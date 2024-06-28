const express = require('express')
const app = express();
require('dotenv').config();

const cors = require('cors')
const bodyParser = require('body-parser');
const { PORT } = require('./app/config/config');
const port = PORT
app.use(cors());
app.use(bodyParser.json())




require('./app/router/user')(app);
require('./app/router/auth')(app);









app.get('*', (req, res) => {
    res.status(400).send({
        message: 'Hunn smart!',
        error: true
    })
});



app.listen(port, () => console.log(`Server is running port on ${port}`))