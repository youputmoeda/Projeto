const mysql = require("mysql2/promise");
const config = require("../config");

function connect() {
  return new Promise((resolve, reject) => {
    if (!global.connection || global.connection.state == "disconnected") {
      mysql
        .createConnection(config.db)
        .then((connection) => {
          global.connection = connection;
          console.log("Nova conexão ao mySQL");
          resolve(connection);
        })
        .catch((error) => {
          console.log("Erro na ligação ao mySQL:");
          console.log(error);
          reject(error.code);
        });
    } else {
      connection = global.connection;
      resolve(connection);
    }
  });
}

function query(sql, params) {
  return new Promise((resolve, reject) => {
    connect() // Acionado quando fazemos uma query
      .then((conn) => {
        conn
          .execute(sql, params)
          .then(([result]) => {
            console.log("Model: Query");
            console.log(result);
            resolve(result);
          })
          .catch((error) => {
            reject(error.sqlMessage);
          });
      })
      .catch((error) => {
        console.log("Query:");
        console.log(error);
        reject(error);
      });
  });
}

exports.Crud_registar = (email, password, confirmationToken) => {
  // insere um novo utilizador
  return new Promise((resolve, reject) => {
    data = {
      id: email,
      confirm: 0,
      password: password,
      confirmationToken: confirmationToken,
    };
    query(
      "INSERT INTO users (id,confirm,password,confirmationToken) values (?,?,?,?)",
      [data.id, data.confirm, data.password, data.confirmationToken]
    )
      .then((result) => {
        console.log("Model: Registo de utilizador: ");
        console.log(data);
        console.log(result);
        if (result.affectedRows != 1)
          reject("Model: Problema na inserção de novo registo");
        else resolve(result);
      })
      .catch((error) => {
        console.log("Model: Problema no registo:");
        console.log(error);
        reject(error);
      });
  });
};

// Ativa um utilizador (faz um Update)
exports.crUd_ativar = (confirmationToken) => {
  return new Promise((resolve, reject) => {
    query("UPDATE users SET confirm=? WHERE confirmationToken=?", [
      1,
      confirmationToken,
    ])
      .then((result) => {
        console.log("Model: Ativação de utilizador: ");
        console.log(result);
        if (result.changedRows != 1)
          reject("Model: Problema na ativação de utilizador");
        else resolve(result);
      })
      .catch((error) => {
        console.log("Model: Problema na ativação:");
        console.log(error);
        reject(error);
      });
  });
};

// Retorna o utilizador e sua password encriptada
exports.cRud_login = (email) => {
  return new Promise((resolve, reject) => {
    // busca os registos que contêm a chave
    query("SELECT id, confirm, password from users WHERE id=?", [email])
      .then((result) => {
        user = {};
        Object.keys(result).forEach(function (key) {
          user = result[key];
          console.log(user.id);
        });
        console.log("Model: Login: ");
        console.log(user);
        if (user.id != email) reject("Utilizador inexistente");
        else resolve(user);
      })
      .catch((error) => {
        console.log("Model: Problema no login:");
        console.log(error);
        reject(error);
      });
  });
};

exports.cRud_all = () => {
  return new Promise((resolve, reject) => {
    // lê todos os registos
    query("SELECT * from disciplinas")
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

exports.cRud_id = (id) => {
  return new Promise((resolve, reject) => {
    // busca os registos que contêm a chave
    query("SELECT * FROM disciplinas WHERE id=?", [id])
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

exports.cRud_key = (criteria) => {
  return new Promise((resolve, reject) => {
    // busca os registos que contêm a chave
    console.log("Model - criteria:")
    console.log(criteria)
    // OR docente LIKE '%' + ? + '%' OR curso LIKE '%' + ? + '%'
    query(
      "SELECT * FROM disciplinas WHERE ano=? OR disciplina LIKE CONCAT('%',?,'%') OR docente LIKE CONCAT('%',?,'%') OR curso LIKE CONCAT('%',?,'%')", [criteria,criteria,criteria,criteria])
      .then((result) => {
        console.log("Model - result:")
        console.log(result)
        if (Object.keys(result).length == 0) {
          console.log("Model - sem resultados")
          reject("Não posso mostrar disciplinas!");
        } else {
          resolve(result);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
};
