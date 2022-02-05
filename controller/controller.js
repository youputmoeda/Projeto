require("dotenv").config();

//const dbNE = require("../models/nedb"); // Define o MODEL nedb
const dbmySQL = require("../models/mysql"); // Define o MODEL mySQL
//const dbMongoDB = require("../models/mongodb"); // Define o MODEL MongoDB
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

function authenticateToken(req, res) {
  console.log("A autorizar...");
  const cookies = req.cookies;
  console.log("Cookies:");
  console.log(cookies);
  // const authHeader = req.headers["authorization"];
  const token = cookies.jwt; //authHeader && authHeader.split(" ")[1];
  if (token == null) {
    console.log("Token nula");
    return res.sendStatus(401);
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.email = user;
  });
}

const nodemailer = require("nodemailer");
const { response } = require("express");

// async..await não é permitido no contexto global
async function enviaEmail(recipients, confirmationToken) {
  // Gera uma conta do serviço SMTP de email do domínio ethereal.email
  // Somente necessário na fase de testes e se não tiver uma conta real para utilizar
  let testAccount = await nodemailer.createTestAccount();

  // Cria um objeto transporter reutilizável que é um transporter SMTP
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true para 465, false para outras portas
    auth: {
      user: testAccount.user, // utilizador ethereal gerado
      pass: testAccount.pass, // senha do utilizador ethereal
    },
  });

  // envia o email usando o objeto de transporte definido
  let info = await transporter.sendMail({
    from: '"Fred Foo 👻" <foo@example.com>', // endereço do originador
    to: recipients, // lista de destinatários
    subject: "Hello ✔", // assunto
    text: "Clique aqui para ativar sua conta: " + confirmationToken, // corpo do email
    html: "<b>Clique aqui para ativar sua conta: " + confirmationToken + "</b>", // corpo do email em html
  });

  console.log("Mensagem enviada: %s", info.messageId);
  // Mensagem enviada: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // A pré-visualização só estará disponível se usar uma conta Ethereal para envio
  console.log(
    "URL para visualização prévia: %s",
    nodemailer.getTestMessageUrl(info)
  );
  // URL para visualização prévia: https://ethereal.email/message/WaQKMgKddxQDoou...
}

exports.verificaUtilizador = async (req, res) => {
  const confirmationCode = req.params.confirmationCode;
  dbmySQL
    .crUd_ativar(confirmationCode)
    .then(() => {
      const resposta = { message: "O utilizador está ativo!" };
      console.log(resposta);
      return res.send(resposta);
    })
    .catch((error) => {
      console.log(error);
      return res.status(400).send({
        message: JSON.stringify(response),
      });
    });
};

// REGISTAR - cria um novo utilizador
exports.registar = async (req, res) => {
  console.log("Registar novo utilizador");
  if (!req.body) {
    return res.status(400).send({
      message: "O conteúdo não pode ser vazio!",
    });
  }
  const salt = await bcrypt.genSalt();
  const hashPassword = await bcrypt.hash(req.body.password, salt);
  const email = req.body.email;
  const password = hashPassword;
  const confirmationToken = jwt.sign(
    req.body.email,
    process.env.ACCESS_TOKEN_SECRET
  );
  const confirmURL = `https://localhost:${process.env.PORT}/api/auth/confirm/${confirmationToken}`;
  dbmySQL
    .Crud_registar(email, password, confirmationToken) // C: Create
    .then((dados) => {
      enviaEmail(email, confirmURL).catch(console.error);
      res.status(201).send({
        message:
          "Utilizador criado com sucesso, confira sua caixa de correio para ativar!",
      });
      console.log("Controller - utilizador registado: ");
      console.log(JSON.stringify(dados)); // para debug
    })
    .catch((response) => {
      console.log("Controller - problema ao registar:");
      console.log(response);
      return res.status(400).send({
        message: JSON.stringify(response),
      });
    });
};

// LOGIN - autentica um utilizador
exports.login = async (req, res) => {
  console.log("Autenticação de um utilizador");
  if (!req.body) {
    return res.status(400).send({
      message: "O conteúdo não pode ser vazio!",
    });
  }
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, salt);
  const email = req.body.email;
  const password = hashPassword;
  dbmySQL
    .cRud_login(email) //
    .then(async (dados) => {
      if (await bcrypt.compare(req.body.password, dados.password)) {
        const user = { name: email };
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: 20 * 60,
        });
        // res.setHeader('Set-Cookie','novoUser=true')
        res.cookie("jwt", accessToken, {
          maxAge: 1000 * 60 * 2,
          httpOnly: true,
        });
        res.status(200).send({ user: email }); // aqui temos de enviar a token de autorização
        console.log("Resposta da consulta à base de dados: ");
        console.log(JSON.stringify(dados)); // para debug
      } else {
        console.log("Password incorreta");
        return res.status(401).send({ erro: "A senha não está correta!" });
      }
    })
    .catch((response) => {
      console.log("Controller:");
      console.log(response);
      return res.status(401).send({
        message: JSON.stringify(response),
      });
    });
};

// CREATE - cria um novo registo
exports.create = (req, res) => {
  console.log("Create");
  if (!req.body) {
    return res.status(400).send({
      message: "O conteúdo não pode ser vazio!",
    });
  }
  const data = req.body;
  dbmySQL.Crud(data); // C: Create
  const resposta = { message: "Criou um novo registo!" };
  console.log(resposta);
  return res.send(resposta);
};

// Envia todas as disciplinas
exports.findAll = (req, res) => {
  authenticateToken(req, res);
  if (req.email != null) {
    // utilizador autenticado
    console.log(`FindAll - user: ${req.email.name}`);
    console.log("Mensagem de debug - listar disciplinas");
    dbmySQL
      .cRud_all() // R: Read
      .then((dados) => {
        res.send(dados);
        // console.log("Dados: " + JSON.stringify(dados)); // para debug
      })
      .catch((err) => {
        return res
          .status(400)
          .send({ message: "Não há disciplinas para mostrar!" });
      });
  }
};

// READ one - busca um item pelo id
exports.findOne = async (req, res) => {
  authenticateToken(req, res);
  if (req.email != null) {
    // utilizador autenticado
    console.log("Find One by id");
    console.log("Parâmetro: " + req.params.id);
    //Deve implementar esta funcionalidade...
    const id = req.params.id.substr(1); // faz substring a partir do segundo carater
    dbmySQL
      .cRud_id(id) // R: Read
      .then((dados) => {
        res.send(dados);
        // console.log("Dados: " + JSON.stringify(dados)); // para debug
      })
      .catch((err) => {
        return res
          .status(400)
          .send({ message: "Não há disciplinas para mostrar!" });
      });
  }
};

// READ key - busca os itens que contêm uma chave
exports.findKey = (req, res) => {
  authenticateToken(req, res);
  if (req.email != null) {
    // utilizador autenticado
    console.log("Find key");
    // Temos de eliminar o primeiro carater para obter a chave de pesquisa
    // O primeiro carater é o ":"
    const criteria = req.params.id.substr(1); // faz substring a partir do segundo carater
    console.log("Critério: " + criteria);
    dbmySQL
      .cRud_key(criteria) // R: Read
      .then((dados) => {
        res.send(dados);
        // console.log("Dados: " + JSON.stringify(dados)); // para debug
      })
      .catch((err) => {
        console.log("Controller - criteria error:")
        console.log(err)
        return res.status(400).send(err);
      });
  }
};

// UPDATE - atualiza o item com o id recebido
exports.update = (req, res) => {};

// DELETE one - elimina o item com o id recebido
exports.delete = (req, res) => {};

// DELETE all - elimina todos os itens
exports.deleteAll = (req, res) => {};
