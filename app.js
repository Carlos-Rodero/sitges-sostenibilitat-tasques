const cfg = window.APP_CONFIG || {};

const configured =
  cfg.SUPABASE_URL &&
  cfg.SUPABASE_ANON_KEY &&
  !cfg.SUPABASE_URL.includes("PASTE_") &&
  !cfg.SUPABASE_ANON_KEY.includes("PASTE_");

const client = configured
  ? supabase.createClient(
      cfg.SUPABASE_URL,
      cfg.SUPABASE_ANON_KEY
    )
  : null;


// ==========================
// ELEMENTS
// ==========================

const taskList =
  document.getElementById("taskList");

const emptyState =
  document.getElementById("emptyState");

const dialog =
  document.getElementById("taskDialog");

const form =
  document.getElementById("taskForm");

const dialogTitle =
  document.getElementById("dialogTitle");

const saveTaskBtn =
  document.getElementById("saveTaskBtn");

const textInput =
  document.getElementById("taskText");

const respInput =
  document.getElementById("taskResp");

const hideDone =
  document.getElementById("hideDone");

const newTaskBtn =
  document.getElementById("newTaskBtn");

const cancelBtn =
  document.getElementById("cancelBtn");


// ==========================
// STATE
// ==========================

let filterResp = "ALL";

let tasks = [];

let realtimeChannel = null;

let editingTaskId = null;


// ==========================
// DEMO / LOCAL STORAGE
// ==========================

const demoTasks = [

  {
    id: "d1",
    text: "Confirmar ampliació del termini per trobar la persona de pràctiques (18–21 setembre)",
    responsible: "GL",
    done: false
  },

  {
    id: "d2",
    text: "Confirmar amb Aram els camps dels formularis d’acreditats",
    responsible: "GL",
    done: false
  },

  {
    id: "d3",
    text: "Consultar amb Àngel si podem incorporar l’enquesta de mobilitat a la venda d’entrades",
    responsible: "CR",
    done: false
  },

  {
    id: "d4",
    text: "Revisar i actualitzar els formularis amb la imatge 2026",
    responsible: "CR",
    done: false
  },

  {
    id: "d5",
    text: "Consultar amb Mònica si hi ha pressupost per a una altra activitat",
    responsible: "CR",
    done: false
  },

  {
    id: "d6",
    text: "Contactar amb Alba per l’activitat de Malvasia",
    responsible: "CR",
    done: false
  },

  {
    id: "d7",
    text: "Preparar comunicació i inscripcions de l’activitat del CEM (10/10)",
    responsible: "CR",
    done: false
  },

  {
    id: "d8",
    text: "Revisar la formació i incorporar-hi Sostenibilitat / We Are Legend",
    responsible: "GL",
    done: false
  },

  {
    id: "d9",
    text: "Enviar a Agustina la proposta de modificació de l’Stand We Are Legend",
    responsible: "CM",
    done: false
  },

  {
    id: "d10",
    text: "Consultar l’estat de la web de Sostenibilitat",
    responsible: "CM",
    done: false
  },

  {
    id: "d11",
    text: "Consultar amb l’Agència de Viatges com calculen la petjada de carboni",
    responsible: "CR",
    done: false
  }

];


function localLoad() {

  const saved =
    localStorage.getItem("sitges_tasks");

  tasks =
    saved
      ? JSON.parse(saved)
      : demoTasks;
}


function localSave() {

  localStorage.setItem(
    "sitges_tasks",
    JSON.stringify(tasks)
  );
}


// ==========================
// LOAD TASKS
// ==========================

async function loadTasks() {

  if (!client) {

    localLoad();

    render();

    return;
  }


  const { data, error } =
  await client
    .from("tasks")
    .select("*")
    .order("position", { ascending: true });


  if (error) {

    alert(
      "No s'han pogut carregar les tasques: "
      + error.message
    );

    return;
  }


  tasks = data;

  render();
}


// ==========================
// RENDER
// ==========================

function render() {

  const visible =
    tasks.filter(task => {

      if (
        filterResp !== "ALL" &&
        task.responsible !== filterResp
      ) {
        return false;
      }


      if (
        hideDone.checked &&
        task.done
      ) {
        return false;
      }


      return true;

    });


  taskList.innerHTML = "";


  emptyState.hidden =
    visible.length > 0;


  for (const task of visible) {

    const row =
      document.createElement("article");

    row.className =
      "task" +
      (task.done ? " done" : "");


    // Checkbox

    const check =
      document.createElement("input");

    check.type = "checkbox";

    check.checked =
      task.done;

    check.title =
      task.done
        ? "Marca com a pendent"
        : "Marca com a feta";

    check.addEventListener(
      "change",
      () =>
        toggleTask(
          task.id,
          check.checked
        )
    );


    // Responsible badge

    const badge =
      document.createElement("span");

    badge.className =
      "badge";

    badge.textContent =
      task.responsible;


    // Text

    const text =
      document.createElement("div");

    text.className =
      "text";

    text.textContent =
      task.text;


    // Edit button

    const edit =
      document.createElement("button");

    edit.className =
      "edit";

    edit.type =
      "button";

    edit.title =
      "Editar tasca";

    edit.setAttribute(
      "aria-label",
      "Editar tasca"
    );

    edit.textContent =
      "✎";

    edit.addEventListener(
      "click",
      () =>
        openEditTask(task)
    );


    // Delete button

    const del =
      document.createElement("button");

    del.className =
      "delete";

    del.type =
      "button";

    del.title =
      "Eliminar";

    del.setAttribute(
      "aria-label",
      "Eliminar tasca"
    );

    del.textContent =
      "×";

    del.addEventListener(
      "click",
      () =>
        deleteTask(task.id)
    );


    row.append(
      check,
      badge,
      text,
      edit,
      del
    );


    taskList.appendChild(row);
  }
}


// ==========================
// ADD TASK
// ==========================

async function addTask(
  text,
  responsible
) {

  if (client) {

    const { error } =
      await client
        .from("tasks")
        .insert({
          text,
          responsible
        });


    if (error) {

      alert(error.message);

      return false;
    }


    return true;
  }


  tasks.unshift({

    id:
      crypto.randomUUID(),

    text,

    responsible,

    done: false

  });


  localSave();

  render();

  return true;
}


// ==========================
// EDIT TASK
// ==========================

function openEditTask(task) {

  editingTaskId =
    task.id;


  dialogTitle.textContent =
    "Edita tasca";


  saveTaskBtn.textContent =
    "Desa";


  textInput.value =
    task.text;


  respInput.value =
    task.responsible;


  dialog.showModal();


  textInput.focus();
}


async function editTask(
  id,
  text,
  responsible
) {

  if (client) {

    const { error } =
      await client
        .from("tasks")
        .update({
          text,
          responsible
        })
        .eq("id", id);


    if (error) {

      alert(error.message);

      return false;
    }


    return true;
  }


  const task =
    tasks.find(
      task =>
        task.id === id
    );


  if (task) {

    task.text =
      text;

    task.responsible =
      responsible;
  }


  localSave();

  render();

  return true;
}


// ==========================
// TOGGLE DONE
// ==========================

async function toggleTask(
  id,
  done
) {

  if (client) {

    const { error } =
      await client
        .from("tasks")
        .update({ done })
        .eq("id", id);


    if (error) {

      alert(error.message);

      return;
    }


    return;
  }


  const task =
    tasks.find(
      task =>
        task.id === id
    );


  if (task) {

    task.done =
      done;
  }


  localSave();

  render();
}


// ==========================
// DELETE
// ==========================

async function deleteTask(id) {

  if (
    !confirm(
      "Eliminar aquesta tasca?"
    )
  ) {
    return;
  }


  if (client) {

    const { error } =
      await client
        .from("tasks")
        .delete()
        .eq("id", id);


    if (error) {

      alert(error.message);

      return;
    }


    return;
  }


  tasks =
    tasks.filter(
      task =>
        task.id !== id
    );


  localSave();

  render();
}


// ==========================
// REALTIME
// ==========================

function startRealtime() {

  if (!client) {
    return;
  }


  realtimeChannel =
    client
      .channel(
        "tasks-realtime"
      )
      .on(

        "postgres_changes",

        {
          event: "*",
          schema: "public",
          table: "tasks"
        },

        async () => {

          await loadTasks();

        }

      )
      .subscribe(status => {

        console.log(
          "Realtime status:",
          status
        );

      });
}


// ==========================
// FILTERS
// ==========================

document
  .querySelectorAll(".filter")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(".filter")
          .forEach(
            item =>
              item.classList.remove(
                "active"
              )
          );


        button.classList.add(
          "active"
        );


        filterResp =
          button.dataset.resp;


        render();
      }
    );

  });


hideDone.addEventListener(
  "change",
  render
);


// ==========================
// NEW TASK
// ==========================

newTaskBtn.addEventListener(
  "click",
  () => {

    editingTaskId =
      null;


    form.reset();


    dialogTitle.textContent =
      "Nova tasca";


    saveTaskBtn.textContent =
      "Afegeix";


    dialog.showModal();


    textInput.focus();
  }
);


// ==========================
// CANCEL
// ==========================

cancelBtn.addEventListener(
  "click",
  () => {

    editingTaskId =
      null;

    dialog.close();

  }
);


// ==========================
// SUBMIT FORM
// ==========================

form.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    const text =
      textInput.value.trim();


    if (!text) {
      return;
    }


    let success;


    if (editingTaskId) {

      success =
        await editTask(
          editingTaskId,
          text,
          respInput.value
        );

    } else {

      success =
        await addTask(
          text,
          respInput.value
        );

    }


    if (!success) {
      return;
    }


    editingTaskId =
      null;


    dialog.close();
  }
);


// ==========================
// INIT
// ==========================

async function init() {

  await loadTasks();

  startRealtime();
}


init();