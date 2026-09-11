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
let sortable = null;
let isReordering = false;


// ==========================
// DEMO / LOCAL STORAGE
// ==========================

const demoTasks = [
  {
    id: "d1",
    text: "Confirmar l’ampliació del termini per trobar la persona de pràctiques (18–21 de setembre)",
    responsible: "GL",
    done: false,
    position: 1
  },
  {
    id: "d2",
    text: "Revisar la documentació de formació d’ECOM i incorporar-hi Sostenibilitat / We Are Legend",
    responsible: "GL",
    done: false,
    position: 2
  },
  {
    id: "d3",
    text: "Confirmar amb Aram que els formularis d’acreditacions inclouen els camps necessaris de sostenibilitat",
    responsible: "GL",
    done: false,
    position: 3
  },
  {
    id: "d4",
    text: "Publicar l’Estratègia de Sostenibilitat 2026 i actualitzar l’Excel de recollida de dades",
    responsible: "GL",
    done: false,
    position: 4
  },
  {
    id: "d5",
    text: "Coordinar amb el CEM la comunicació i les inscripcions de la neteja de platja del 10 d’octubre",
    responsible: "CR",
    done: false,
    position: 5
  },
  {
    id: "d6",
    text: "Consultar amb Mònica si hi ha pressupost per a una segona activitat de sostenibilitat",
    responsible: "CR",
    done: false,
    position: 6
  },
  {
    id: "d7",
    text: "Contactar amb l’Alba per revisar l’estat de l’activitat de Malvasia i si necessita suport",
    responsible: "CR",
    done: false,
    position: 7
  },
  {
    id: "d8",
    text: "Revisar i actualitzar els formularis amb la imatge gràfica de 2026",
    responsible: "CR",
    done: false,
    position: 8
  },
  {
    id: "d9",
    text: "Consultar amb Ticketing (Àngel Mateos) la incorporació de l’enquesta de mobilitat a la venda online d’entrades",
    responsible: "CR",
    done: false,
    position: 9
  },
  {
    id: "d10",
    text: "Preparar el pla i calendari de comunicació de sostenibilitat 2026 a partir dels materials de 2025",
    responsible: "CR",
    done: false,
    position: 10
  },
  {
    id: "d11",
    text: "Revisar la web de sostenibilitat We Are Legend i els enllaços i continguts pendents",
    responsible: "CR",
    done: false,
    position: 11
  },
  {
    id: "d12",
    text: "Consultar amb l’Agència de Viatges la metodologia de càlcul de la petjada de carboni dels trajectes",
    responsible: "CR",
    done: false,
    position: 12
  },
  {
    id: "d13",
    text: "Traslladar a Agustina la proposta perquè l’Stand WE ARE LEGEND aparegui com un únic espai a “Sales i Espais”",
    responsible: "CM",
    done: false,
    position: 13
  },
  {
    id: "d14",
    text: "Consultar amb Agustina l’estat de la web de sostenibilitat i la incorporació del clip We Are Legend i del vídeo de l’stand",
    responsible: "CM",
    done: false,
    position: 14
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

    tasks.sort(
      (a, b) =>
        (a.position || 0) -
        (b.position || 0)
    );

    render();

    return;
  }


  const { data, error } =
    await client
      .from("tasks")
      .select("*")
      .order(
        "position",
        { ascending: true }
      );


  if (error) {
    alert(
      "No s'han pogut carregar les tasques: " +
      error.message
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

    row.dataset.id =
      task.id;


    // Drag handle

    const handle =
      document.createElement("div");

    handle.className =
      "drag-handle";

    handle.title =
      "Arrossega per reordenar";

    handle.textContent =
      "⠿";


    // Checkbox

    const check =
      document.createElement("input");

    check.type =
      "checkbox";

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


    // Task text

    const text =
      document.createElement("div");

    text.className =
      "text";

    text.textContent =
      task.text;


    // Edit

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


    // Delete

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
      handle,
      check,
      badge,
      text,
      edit,
      del
    );


    taskList.appendChild(row);
  }


  setupSortable();
}


// ==========================
// ADD TASK
// ==========================

async function addTask(text, responsible) {

  if (client) {

    // Desplazar todas las tareas actuales una posición hacia abajo
    isReordering = true;

    const orderedTasks = [...tasks].sort(
      (a, b) => (a.position || 0) - (b.position || 0)
    );

    const updates = await Promise.all(
      orderedTasks.map((task, index) =>
        client
          .from("tasks")
          .update({
            position: index + 2
          })
          .eq("id", task.id)
      )
    );

    const failed = updates.find(result => result.error);

    if (failed) {
      isReordering = false;

      alert(
        "No s'ha pogut actualitzar l'ordre: " +
        failed.error.message
      );

      return false;
    }

    // La nova tasca sempre serà la primera
    const { error } =
      await client
        .from("tasks")
        .insert({
          text,
          responsible,
          position: 1
        });

    isReordering = false;

    if (error) {
      alert(error.message);
      return false;
    }

    await loadTasks();

    return true;
  }


  // Mode local
  tasks.forEach(task => {
    task.position = (task.position || 0) + 1;
  });

  tasks.unshift({
    id: crypto.randomUUID(),
    text,
    responsible,
    done: false,
    position: 1
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
        .eq(
          "id",
          id
        );


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
        .update({
          done
        })
        .eq(
          "id",
          id
        );


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
        .eq(
          "id",
          id
        );


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


  normaliseLocalPositions();

  localSave();

  render();
}


// ==========================
// DRAG & DROP
// ==========================

function setupSortable() {

  if (sortable) {
    sortable.destroy();

    sortable = null;
  }


  const canReorder =
    filterResp === "ALL" &&
    !hideDone.checked;


  if (!canReorder) {
    taskList.classList.add(
      "sorting-disabled"
    );

    return;
  }


  taskList.classList.remove(
    "sorting-disabled"
  );


  if (
    typeof Sortable === "undefined"
  ) {
    console.warn(
      "SortableJS no està carregat."
    );

    return;
  }


  sortable =
    new Sortable(
      taskList,
      {
        animation: 150,

        handle:
          ".drag-handle",

        ghostClass:
          "drag-ghost",

        chosenClass:
          "drag-chosen",

        onEnd:
          async () => {

            const ids =
              Array
                .from(
                  taskList.querySelectorAll(
                    ".task"
                  )
                )
                .map(
                  row =>
                    row.dataset.id
                );


            await saveTaskOrder(
              ids
            );
          }
      }
    );
}


async function saveTaskOrder(ids) {

  if (!ids.length) {
    return;
  }


  if (!client) {

    const taskMap =
      new Map(
        tasks.map(
          task =>
            [
              String(task.id),
              task
            ]
        )
      );


    tasks =
      ids
        .map(
          (id, index) => {

            const task =
              taskMap.get(
                String(id)
              );


            if (!task) {
              return null;
            }


            task.position =
              index + 1;


            return task;
          }
        )
        .filter(Boolean);


    localSave();

    render();

    return;
  }


  isReordering = true;


  const results =
    await Promise.all(
      ids.map(
        (id, index) =>
          client
            .from("tasks")
            .update({
              position:
                index + 1
            })
            .eq(
              "id",
              id
            )
      )
    );


  const failed =
    results.find(
      result =>
        result.error
    );


  isReordering = false;


  if (failed) {

    alert(
      "No s'ha pogut guardar l'ordre: " +
      failed.error.message
    );

    await loadTasks();

    return;
  }


  await loadTasks();
}


function normaliseLocalPositions() {

  tasks
    .sort(
      (a, b) =>
        (a.position || 0) -
        (b.position || 0)
    )
    .forEach(
      (task, index) => {
        task.position =
          index + 1;
      }
    );
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

          if (!isReordering) {
            await loadTasks();
          }
        }
      )
      .subscribe(
        status => {
          console.log(
            "Realtime status:",
            status
          );
        }
      );
}


// ==========================
// FILTERS
// ==========================

document
  .querySelectorAll(
    ".filter"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".filter"
            )
            .forEach(
              item =>
                item
                  .classList
                  .remove(
                    "active"
                  )
            );


          button
            .classList
            .add(
              "active"
            );


          filterResp =
            button.dataset.resp;


          render();
        }
      );
    }
  );


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
      textInput
        .value
        .trim();


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