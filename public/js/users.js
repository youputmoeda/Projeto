const buttons = document.querySelectorAll("[data-carousel-button]");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const offset = button.dataset.carouselButton === "next" ? 1 : -1;
    const slides = button
      .closest("[data-carousel]")
      .querySelector("[data-slides]");

    const activeSlide = slides.querySelector("[data-active]");
    let newIndex = [...slides.children].indexOf(activeSlide) + offset;
    if (newIndex < 0) newIndex = slides.children.length - 1;
    if (newIndex >= slides.children.length) newIndex = 0;

    slides.children[newIndex].dataset.active = true;
    delete activeSlide.dataset.active;
  });
});

const urlBase = "https://localhost:8899/api";
const modalLogin = document.getElementById("modalLogin");
const bsModalLogin = new bootstrap.Modal(modalLogin, (backdrop = "static")); // Pode passar opções
const modalRegistar = document.getElementById("modalRegistar");
const bsModalRegistar = new bootstrap.Modal(
  modalRegistar,
  (backdrop = "static")
); // Pode passar opções

const btnModalLogin = document.getElementById("btnModalLogin");
const btnModalRegistar = document.getElementById("btnModalRegistar");
const btnLogoff = document.getElementById("btnLogoff");
const pRegistar = document.getElementById("pRegistar");
const listaDisciplinas = document.getElementById("listaDisciplinas");

pRegistar.addEventListener("click", () => {
  bsModalLogin.hide();
  chamaModalRegistar();
});

modalLogin.addEventListener("shown.bs.modal", () => {
  document.getElementById("usernameLogin").focus();
});
btnModalLogin.addEventListener("click", () => {
  bsModalLogin.show();
});
btnModalRegistar.addEventListener("click", () => {
  chamaModalRegistar();
});

function chamaModalRegistar() {
  document.getElementById("btnSubmitRegistar").style.display = "block";
  document.getElementById("btnCancelaRegistar").innerHTML = "Cancelar";
  bsModalRegistar.show();
}

btnLogoff.addEventListener("click", () => {
  localStorage.removeItem("token");
  document.getElementById("btnLogoff").style.display = "none";
  window.location.replace("index.html");
});

function validaRegisto() {
  let email = document.getElementById("usernameRegistar").value; // email é validado pelo próprio browser
  let senha = document.getElementById("senhaRegistar").value; // tem de ter uma senha
  const statReg = document.getElementById("statusRegistar");
  if (senha.length < 4) {
    document.getElementById("passErroLogin").innerHTML =
      "A senha tem de ter ao menos 4 carateres";
    return;
  }
  fetch(`${urlBase}/registar`, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
    body: `email=${email}&password=${senha}`,
  })
    .then((response) => {
      return response.json().then((body) => {
        if (response.status == 201) {
          console.log(body.message);
          statReg.innerHTML = body.message;
          document.getElementById("btnSubmitRegistar").style.display = "none";
          document.getElementById("btnCancelaRegistar").innerHTML =
            "Fechar este diálogo";
        } else {
          throw body;
        }
      });
    })
    .catch((body) => {
      result = body.message;
      document.getElementById(
        "statusRegistar"
      ).innerHTML = `Pedido falhado: ${result}`;
      console.log("Catch:");
      console.log(result);
    });
}

function validaLogin() {
  let email = document.getElementById("usernameLogin").value; // email é validado pelo próprio browser
  let senha = document.getElementById("senhaLogin").value; // tem de ter uma senha
  if (senha.length < 4) {
    document.getElementById("passErroLogin").innerHTML =
      "A senha tem de ter ao menos 4 carateres";
    return;
  }
  const statLogin = document.getElementById("statusLogin");

  fetch(`${urlBase}/login`, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST", // o login não vai criar nada, só ver se o user existe e a pass está correta
    body: `email=${email}&password=${senha}`,
  })
    .then((response) => {
      return response.json().then((body) => {
        if (response.status == 200) {
          console.log(body.user);
          document.getElementById("statusLogin").innerHTML = "Sucesso!";
          listaDisciplinas.innerHTML = "";
          document.getElementById("searchbtn").disabled = false;
          document.getElementById("searchkey").disabled = false;
          document.getElementById("btnLoginClose").click();
        } else {
          throw body;
        }
      });
    })
    .catch((body) => {
      result = body.message;
      document.getElementById(
        "statusLogin"
      ).innerHTML = `Pedido falhado: ${result}`;
      console.log("Catch:");
      console.log(result);
    });
}

async function getDisciplinas(id) {
  const criteria = document.getElementById("searchkey").value;
  console.log("Critério: " + criteria);

  let url = urlBase + "/disciplinas";
  const token = localStorage.token;
  console.log(token);

  if (id != "") {
    url = url + "/:" + id;
  } else if (criteria != "") {
    url = url + "/key/:" + criteria;
  }

  console.log("URL: " + url);
  const myInit = {
    method: "GET",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      // Authorization: `Bearer ${token}`,
    },
  };
  const myRequest = new Request(url, myInit);

  await fetch(myRequest).then(async function (response) {
    if (!response.ok) {
      listaDisciplinas.innerHTML = "Não posso mostrar disciplinas de momento!";
    } else {
      disciplinas = await response.json();
      console.log(disciplinas);
      let texto = "";
      if (Object.keys(disciplinas).length == 1) {
        // Só retornou uma disciplina, detalhamos
        disciplina = disciplinas[0];
        texto += ` 
          <div>
            <h4>${disciplina.disciplina}</h4>
            &nbsp&nbsp&nbsp${disciplina.curso} -- Ano: ${disciplina.ano}<br /> 
            &nbsp&nbsp&nbspDocente: ${disciplina.docente}
          </div>`;
      } else {
        // Retornou mais de uma disciplina
        for (const disciplina of disciplinas) {
          texto += ` 
            <div>
              <h4>${disciplina.disciplina}
              <button type="button" onclick="getDisciplinas('${disciplina.id}')">
                Clique aqui para detalhar esta disciplina
              </button></h4>
            </div>`;
        }
      }
      listaDisciplinas.innerHTML = texto;
    }
  });
}
