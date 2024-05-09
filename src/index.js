const express = require('express');
const app = express();

const mainRouter = require('./routes');
const apiRouter = require('./api');

app.use('/api', apiRouter);
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(mainRouter);

app.listen(3000, '0.0.0.0');
