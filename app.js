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

const responsibleFilters =
  document.getElementById("responsibleFilters");

const responsibleLegend =
  document.getElementById("responsibleLegend");


// ==========================
// STATE
// ==========================

let filterResp = "ALL";
let tasks = [];
let responsibles = [];
let realtimeChannel = null;
let editingTaskId = null;
let sortable = null;
let isReordering = false;


// ==========================
// LOCAL FALLBACK
// ==========================

const demoResponsibles = [
  {
    code: "CR",
    name: "Carlos Rodero"
  },
  {
    code: "GL",
    name: "Giada / Laura"
  },
  {
    code: "CM",
    name: "Carles Molina"
  },
  {
    code: "PROD",
    name: "Producció"
  }
];


const demoTasks = [];


function localLoad() {

  const savedTasks =
    localStorage.getItem(
      "sitges_tasks"
    );

  const savedResponsibles =
    localStorage.getItem(
      "sitges_responsibles"
    );


  tasks =
    savedTasks
      ? JSON.parse(savedTasks)
      : demoTasks;


  responsibles =
    savedResponsibles
      ? JSON.parse(savedResponsibles)
      : demoResponsibles;
}


function localSaveTasks() {

  localStorage.setItem(
    "sitges_tasks",
    JSON.stringify(tasks)
  );
}


function localSaveResponsibles() {

  localStorage.setItem(
    "sitges_responsibles",
    JSON.stringify(responsibles)
  );
}


// ==========================
// LOAD RESPONSIBLES
// ==========================

async function loadResponsibles() {

  if (!client) {

    localLoad();

    renderResponsibles();

    return;
  }


  const { data, error } =
    await client
      .from("responsibles")
      .select("*")
      .order(
        "created_at",
        { ascending: true }
      );


  if (error) {

    alert(
      "No s'han pogut carregar els responsables: " +
      error.message
    );

    return;
  }


  responsibles =
    data || [];


  renderResponsibles();
}


// ==========================
// RENDER RESPONSIBLES
// ==========================

function renderResponsibles() {

  renderResponsibleFilters();

  renderResponsibleSelect();

  renderResponsibleLegend();
}


function renderResponsibleFilters() {

  responsibleFilters.innerHTML = "";


  const allBtn =
    document.createElement("button");

  allBtn.className =
    "filter" +
    (filterResp === "ALL"
      ? " active"
      : "");

  allBtn.dataset.resp =
    "ALL";

  allBtn.textContent =
    "Tots";

  allBtn.addEventListener(
    "click",
    () =>
      setResponsibleFilter("ALL")
  );


  responsibleFilters.appendChild(
    allBtn
  );


  for (const responsible of responsibles) {

    const button =
      document.createElement("button");

    button.className =
      "filter" +
      (
        filterResp === responsible.code
          ? " active"
          : ""
      );

    button.dataset.resp =
      responsible.code;

    button.textContent =
      responsible.code;


    button.addEventListener(
      "click",
      () =>
        setResponsibleFilter(
          responsible.code
        )
    );


    responsibleFilters.appendChild(
      button
    );
  }
}


function renderResponsibleSelect() {

  const currentValue =
    respInput.value;


  respInput.innerHTML = "";


  for (const responsible of responsibles) {

    const option =
      document.createElement("option");

    option.value =
      responsible.code;

    option.textContent =
      `${responsible.code} · ${responsible.name}`;


    respInput.appendChild(
      option
    );
  }


  const currentStillExists =
    responsibles.some(
      responsible =>
        responsible.code === currentValue
    );


  if (currentStillExists) {

    respInput.value =
      currentValue;
  }
}


function renderResponsibleLegend() {

  responsibleLegend.innerHTML = "";


  const strong =
    document.createElement("strong");

  strong.textContent =
    "Responsables:";


  responsibleLegend.appendChild(
    strong
  );


  if (!responsibles.length) {

    responsibleLegend.append(
      " Cap responsable"
    );

    return;
  }


  responsibles.forEach(
    (responsible, index) => {

      responsibleLegend.append(
        index === 0
          ? " "
          : " · "
      );


      responsibleLegend.append(
        `${responsible.code} · ${responsible.name}`
      );
    }
  );
}


// ==========================
// FILTER RESPONSIBLE
// ==========================

function setResponsibleFilter(code) {

  filterResp =
    code;


  renderResponsibleFilters();

  render();
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


  tasks =
    data || [];


  render();
}


// ==========================
// RENDER TASKS
// ==========================

function render() {

  const visible =
    tasks.filter(
      task => {

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
      }
    );


  taskList.innerHTML =
    "";


  emptyState.hidden =
    visible.length > 0;


  for (const task of visible) {

    const row =
      document.createElement(
        "article"
      );


    row.className =
      "task" +
      (
        task.done
          ? " done"
          : ""
      );


    row.dataset.id =
      task.id;


    // Drag handle

    const handle =
      document.createElement(
        "div"
      );


    handle.className =
      "drag-handle";


    handle.title =
      "Arrossega per reordenar";


    handle.textContent =
      "⠿";


    // Checkbox

    const check =
      document.createElement(
        "input"
      );


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
      document.createElement(
        "span"
      );


    badge.className =
      "badge";


    badge.textContent =
      task.responsible;


    // Task text

    const text =
      document.createElement(
        "div"
      );


    text.className =
      "text";


    text.textContent =
      task.text;


    // Edit

    const edit =
      document.createElement(
        "button"
      );


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
      document.createElement(
        "button"
      );


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


    taskList.appendChild(
      row
    );
  }


  setupSortable();
}


// ==========================
// ADD TASK
// ==========================

async function addTask(
  text,
  responsible
) {

  if (client) {

    isReordering =
      true;


    const orderedTasks =
      [...tasks].sort(
        (a, b) =>
          (a.position || 0) -
          (b.position || 0)
      );


    const updates =
      await Promise.all(
        orderedTasks.map(
          (task, index) =>
            client
              .from("tasks")
              .update({
                position:
                  index + 2
              })
              .eq(
                "id",
                task.id
              )
        )
      );


    const failed =
      updates.find(
        result =>
          result.error
      );


    if (failed) {

      isReordering =
        false;


      alert(
        "No s'ha pogut actualitzar l'ordre: " +
        failed.error.message
      );


      return false;
    }


    const { error } =
      await client
        .from("tasks")
        .insert({
          text,
          responsible,
          position: 1
        });


    isReordering =
      false;


    if (error) {

      alert(
        error.message
      );


      return false;
    }


    await loadTasks();


    return true;
  }


  tasks.forEach(
    task => {

      task.position =
        (task.position || 0) +
        1;
    }
  );


  tasks.unshift({
    id:
      crypto.randomUUID(),
    text,
    responsible,
    done: false,
    position: 1
  });


  localSaveTasks();

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


  renderResponsibleSelect();


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

      alert(
        error.message
      );


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


  localSaveTasks();

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

      alert(
        error.message
      );


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


  localSaveTasks();

  render();
}


// ==========================
// DELETE TASK
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

      alert(
        error.message
      );


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

  localSaveTasks();

  render();
}


// ==========================
// DRAG & DROP
// ==========================

function setupSortable() {

  if (sortable) {

    sortable.destroy();

    sortable =
      null;
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
    typeof Sortable ===
    "undefined"
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
                  taskList
                    .querySelectorAll(
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


    localSaveTasks();

    render();


    return;
  }


  isReordering =
    true;


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


  isReordering =
    false;


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
// HIDE DONE
// ==========================

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


    renderResponsibleSelect();


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


    const responsible =
      respInput.value;


    if (!text) {
      return;
    }


    if (!responsible) {

      alert(
        "Selecciona un responsable."
      );


      return;
    }


    let success;


    if (editingTaskId) {

      success =
        await editTask(
          editingTaskId,
          text,
          responsible
        );

    } else {

      success =
        await addTask(
          text,
          responsible
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

  await loadResponsibles();

  await loadTasks();

  startRealtime();
}


init();