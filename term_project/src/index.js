import express from 'express';
import logger from 'morgan';
import path from 'path';
import liveReload from 'livereload';
import connectLiveReload from 'connect-livereload';
import hbs from 'hbs';

import loginRouter from '../routes/login';
import logoutRouter from '../routes/logout';
import book_searchRouter from '../routes/book_search';
import administerRouter from '../routes/administer';
import homeRouter from '../routes/home';
import SBRouter from '../routes/shopping_basket';
import reservationRouter from '../routes/reservation';

const PORT = 3000;

// 헬퍼 함수 정의
hbs.registerHelper('keys', function (context) {
    return Object.keys(context);
});

const liveReloadServer = liveReload.createServer(); 
liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh('/');
  }, 100)
});

const app = express(); 

app.use(connectLiveReload());

app.use(express.urlencoded({ extended: false })) 
app.use(express.json()); 

app.set('views', path.join(__dirname, '../views')); 
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, '../src')));

app.use(logger('dev'));

app.use('/', loginRouter);
app.use('/home', homeRouter);
app.use("/logout", logoutRouter);
app.use("/administer", administerRouter);
app.use("/book_search", book_searchRouter);
app.use("/shopping_basket", SBRouter);
app.use("/reservation", reservationRouter);

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`)
});
