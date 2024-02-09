const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();

// Configurar a conexão com o banco de dados MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'phpmyadmin',
    password: '123456',
    database: 'mydb',
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        throw err;
    }
    console.log('Conexão com o banco de dados MySQL estabelecida.');
});

// Configurar a sessão
app.use(
    session({
        secret: 'Escreva aqui a senha para criptografar as sessões.',
        resave: true,
        saveUninitialized: true,
    })
);

// Configuração de pastas com aquivos estáticos
//app.use('/img', express.static(__dirname + '/img'))
app.use('/', express.static(__dirname + '/static'));

// Engine do Express para processar o EJS (templates)
// Lembre-se que para uso do EJS uma pasta (diretório) 'views', precisa existir na raiz do projeto.
// E que todos os EJS serão processados a partir desta pasta
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar EJS como o motor de visualização
app.set('view engine', 'ejs');

// Configuração das rotas do servidor HTTP
// A lógica ddo processamento de cada rota deve ser realizada aqui
app.get('/', (req, res) => {
    // Passe a variável 'req' para o template e use-a nas páginas para renderizar partes do HTML conforme determinada condição
    // Por exemplo de o usuário estive logado, veja este exemplo no arquivo views/partials/header.ejs
    // res.render('pages/index', { req: req });
    res.redirect("/posts");
    // Caso haja necessidade coloque pontos de verificação para verificar pontos da sua logica de negócios
    console.log(`${req.session.username ? `Usuário ${req.session.username} logado no IP ${req.connection.remoteAddress}` : 'Usuário não logado.'}  `);
    //console.log(req.connection)
});

// Rota para a página de login
app.get('/login', (req, res) => {
    // Quando for renderizar páginas pelo EJS, passe parametros para ele em forma de JSON
    res.render('pages/login', { req: req });
});


app.get('/about', (req, res) => {
    res.render('pages/about', { req: req })
});

    app.get('/posts', (req, res) => {
        const query = 'SELECT * FROM posts;'

        db.query(query, (err, results) => {
            if (err) {
                throw err;
            }
            // if (results.length > 0) {
            //     req.session.loggedin = true;
            //     req.session.username = username;
            //     res.redirect('/dashboard');
            // } else {
            //     // res.send('Credenciais incorretas. <a href="/">Tente novamente</a>');
            //     res.redirect('/login_failed');
            // }

            res.render('pages/pgposts', { req: req, posts: results });
        });
});

// Rota para processar o formulário de login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM users WHERE username = ? AND password = SHA1(?)';

    db.query(query, [username, password], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            req.session.loggedin = true;
            req.session.username = username;
            res.redirect('/dashboard');
        } else {
            // res.send('Credenciais incorretas. <a href="/">Tente novamente</a>');
            res.redirect('/login_failed');
        }
    });
});

// Rota para processar o formulário de caastro depostagem
app.post('/cadastrar_posts', (req, res) => {
    const { titulo, conteudo } = req.body;
    const autor = "admin";
    const datapostagem = new Date();

    // const query = 'SELECT * FROM users WHERE username = ? AND password = SHA1(?)';
    const query = 'INSERT INTO posts (titulo, conteudo, autor, datapostagem) VALUES (?,?,?,?)';

    db.query(query, [titulo, conteudo, autor, datapostagem], (err, results) => {
        if (err) throw err;
        console.log(`Rotina cadastrar posts: ${JSON.stringify(results)}`);
        if (results.affectedRows > 0) {
            console.log('Cadastro de postagem OK')
            res.redirect('/dashboard');
        } else {
            // res.send('Credenciais incorretas. <a href="/">Tente novamente</a>');
            res.send('Cadastro de post não efetuado');
        }
    });
});

// const query = 'INSERT INTO users (username, password) VALUES (?, SHA1(?))';
// console.log(`POST /CADASTRAR -> query -> ${query}`);
// db.query(query, [username, password], (err, results) => {
//     console.log(results);
//     //console.log(`POST /CADASTRAR -> results -> ${results}`);

//     if (err) {
//         console.log(`ERRO NO CADASTRO: ${err}`);
//         throw err;
//     }
//     if (results.affectedRows > 0) {
//         req.session.loggedin = true;
//         req.session.username = username;
//         res.redirect('/register_ok');
//     }
// });


// Rota para a página cadastro do post
app.get('/cadastrar_posts', (req, res) => {
    // Quando for renderizar páginas pelo EJS, passe parametros para ele em forma de JSON
    if (req.session.loggedin) {
        res.render('pages/cadastrar_posts', { req: req });
    } else {
        // req.redirect("Usuário precisa estar logado!")
        res.redirect('/login_failed');
    }
});

// Rotas para cadastrar
app.get('/cadastrar', (req, res) => {
    if (!req.session.loggedin) {
        res.render('pages/cadastrar', { req: req });
    } else {
        res.redirect('pages/dashboard', { req: req });
    }
});

// Rota para efetuar o cadastro de usuário no banco de dados
app.post('/cadastrar', (req, res) => {
    const { username, password } = req.body;

    // Verifica se o usuário já existe
    const query = 'SELECT * FROM users WHERE username = ? AND password = SHA1(?)';
    db.query(query, [username, password], (err, results) => {
        if (err) throw err;
        // Caso usuário já exista no banco de dados, redireciona para a página de cadastro inválido
        if (results.length > 0) {
            console.log(`Usuário ${username} já existe no banco de dados. redirecionando`);
            res.redirect('/register_failed');
        } else {
            // Cadastra o usuário caso não exista
            const query = 'INSERT INTO users (username, password) VALUES (?, SHA1(?))';
            console.log(`POST /CADASTRAR -> query -> ${query}`);
            db.query(query, [username, password], (err, results) => {
                console.log(results);
                //console.log(`POST /CADASTRAR -> results -> ${results}`);

                if (err) {
                    console.log(`ERRO NO CADASTRO: ${err}`);
                    throw err;
                }
                if (results.affectedRows > 0) {
                    req.session.loggedin = true;
                    req.session.username = username;
                    res.redirect('/register_ok');
                }
            });
        }
    });
});

app.get('/register_failed', (req, res) => {
    res.render('pages/register_failed', { req: req });
});

app.get('/register_ok', (req, res) => {
    res.render('pages/register_ok', { req: req });
});

app.get('/login_failed', (req, res) => {
    res.render('pages/login_failed', { req: req });
});

// Rota para a página do painel
app.get('/dashboard', (req, res) => {
    //
    //modificação aqui
    if (req.session.loggedin) {
        //res.send(`Bem-vindo, ${req.session.username}!<br><a href="/logout">Sair</a>`);
        // res.sendFile(__dirname + '/index.html');
        res.render('pages/dashboard', { req: req });
    } else {
        res.send('Faça login para acessar esta página. <a href="/">Login</a>');
    }
});



// Rota para excluir um post por ID
app.get('/posts/delete/:id', (req, res) => {
    const postId = req.params.id;
  
    // Consulta SQL para excluir o post com o ID fornecido
    const sql = 'DELETE FROM posts WHERE id = ?';
  
    // Executar a consulta SQL
    db.query(sql, [postId], (error, results) => {
      if (error) {
        console.error('Erro ao excluir o post:', error);
        return res.status(500).json({ error: 'Erro ao excluir o post.' });
      }
  
      console.log('Post com o ID ' + postId + ' excluído com sucesso.');
      res.redirect('/');
    });
  });

// Rota para processar a saida (logout) do usuário
// Utilize-o para encerrar a sessão do usuário
// Dica 1: Coloque um link de 'SAIR' na sua aplicação web
// Dica 2: Você pode implementar um controle de tempo de sessão e encerrar a sessão do usuário caso este tempo passe.
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// Rota de teste
app.get('/teste', (req, res) => {
    res.render('pages/teste', { req: req });
});


app.listen(3000, () => {
    console.log('----Login (MySQL version)-----')
    console.log('Servidor rodando na porta 3000');
});
  
  // Rota para excluir todos os posts
app.get('/posts/deleteAll', (req, res) => {
    // Consulta SQL para excluir todos os posts
    const sql = 'DELETE FROM posts';

    // Executar a consulta SQL
    db.query(sql, (error, results) => {
        if (error) {
            console.error('Erro ao excluir todos os posts:', error);
            return res.status(500).json({ error: 'Erro ao excluir todos os posts.' });
        }

        console.log('Todos os posts foram excluídos com sucesso.');
        res.redirect('/'); // Redireciona de volta à página inicial ou outra página desejada
    });
});



  