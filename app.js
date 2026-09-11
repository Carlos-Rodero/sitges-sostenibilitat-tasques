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

const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");

const dialog = document.getElementById("taskDialog");
const form = document.getElementById("taskForm");
const dialogTitle = document.getElementById("dialogTitle");
const saveTaskBtn = document.getElementById("saveTaskBtn");

const textInput = document.getElementById("taskText");
const respInput = document.getElementById("taskResp");

const hideDone = document.getElementById("hideDone");
const newTaskBtn = document.getElementById("newTaskBtn");
const cancelBtn = document.getElementById("cancelBtn");

const responsibleFilters =
  document.getElementById("responsibleFilters");

const responsibleLegend =
  document.getElementById("responsibleLegend");


// Gestionar responsables

const manageResponsiblesBtn =
  document.getElementById("manageResponsiblesBtn");

const responsiblesDialog =
  document.getElementById("responsiblesDialog");

const closeResponsiblesBtn =
  document.getElementById("closeResponsiblesBtn");

const responsiblesList =
  document.getElementById("responsiblesList");

const newResponsibleCode =
  document.getElementById("newResponsibleCode");

const newResponsibleName =
  document.getElementById("newResponsibleName");

const addResponsibleBtn =
  document.getElementById("addResponsibleBtn");


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
    code: "PR",
    name: "Producció"
  }
];

const demoTasks = [];


function localLoad() {

  const savedTasks =
    localStorage.getItem("sitges_tasks");

  const savedResponsibles =
    localStorage.getItem("sitges_responsibles");

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


  responsibles = data || [];

  renderResponsibles();
}


// ==========================
// RENDER RESPONSIBLES
// ==========================

function renderResponsibles() {

  renderResponsibleFilters();

  renderResponsibleSelect();

  renderResponsibleLegend();

  renderResponsiblesManager();
}


// ==========================
// FILTERS
// ==========================

function renderResponsibleFilters() {

  responsibleFilters.innerHTML = "";


  const allBtn =
    document.createElement("button");

  allBtn.className =
    "filter" +
    (
      filterResp === "ALL"
        ? " active"
        : ""
    );

  allBtn.dataset.resp = "ALL";
  allBtn.textContent = "Tots";


  allBtn.addEventListener(
    "click",
    () => setResponsibleFilter("ALL")
  );


  responsibleFilters.appendChild(allBtn);


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


function setResponsibleFilter(code) {

  filterResp = code;

  renderResponsibleFilters();

  render();
}


// ==========================
// RESPONSIBLE SELECT
// ==========================

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


    respInput.appendChild(option);
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


// ==========================
// RESPONSIBLE LEGEND
// ==========================

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
// RESPONSIBLES MANAGER
// ==========================

function renderResponsiblesManager() {

  if (!responsiblesList) {
    return;
  }


  responsiblesList.innerHTML = "";


  for (const responsible of responsibles) {

    const row =
      document.createElement("div");

    row.className =
      "responsible-row";


    const code =
      document.createElement("span");

    code.className =
      "responsible-code";

    code.textContent =
      responsible.code;


    const name =
      document.createElement("span");

    name.className =
      "responsible-name";

    name.textContent =
      responsible.name;


    const edit =
      document.createElement("button");

    edit.type =
      "button";

    edit.className =
      "responsible-edit";

    edit.title =
      "Edita el nom";

    edit.setAttribute(
      "aria-label",
      `Edita ${responsible.name}`
    );

    edit.textContent =
      "✎";


    edit.addEventListener(
      "click",
      () =>
        editResponsible(
          responsible.code,
          responsible.name
        )
    );


    row.append(
      code,
      name,
      edit
    );


    responsiblesList.appendChild(
      row
    );
  }
}


// ==========================
// ADD RESPONSIBLE
// ==========================

async function addResponsible() {

  const code =
    newResponsibleCode
      .value
      .trim()
      .toUpperCase();


  const name =
    newResponsibleName
      .value
      .trim();


  if (!/^[A-ZÀ-Ü]{2}$/i.test(code)) {

    alert(
      "El codi ha de tenir exactament dues lletres."
    );

    return;
  }


  if (!name) {

    alert(
      "Escriu el nom del responsable."
    );

    return;
  }


  const exists =
    responsibles.some(
      responsible =>
        responsible.code === code
    );


  if (exists) {

    alert(
      `Ja existeix el responsable ${code}.`
    );

    return;
  }


  if (client) {

    const { error } =
      await client
        .from("responsibles")
        .insert({
          code,
          name
        });


    if (error) {

      alert(
        "No s'ha pogut afegir el responsable: " +
        error.message
      );

      return;
    }


    newResponsibleCode.value = "";
    newResponsibleName.value = "";

    await loadResponsibles();

    return;
  }


  responsibles.push({
    code,
    name,
    created_at:
      new Date().toISOString()
  });


  localSaveResponsibles();

  newResponsibleCode.value = "";
  newResponsibleName.value = "";

  renderResponsibles();
}


// ==========================
// EDIT RESPONSIBLE
// ==========================

async function editResponsible(
  code,
  currentName
) {

  const newName =
    prompt(
      `Nom del responsable ${code}:`,
      currentName
    );


  if (newName === null) {
    return;
  }


  const cleanName =
    newName.trim();


  if (!cleanName) {

    alert(
      "El nom no pot estar buit."
    );

    return;
  }


  if (client) {

    const { error } =
      await client
        .from("responsibles")
        .update({
          name: cleanName
        })
        .eq(
          "code",
          code
        );


    if (error) {

      alert(
        "No s'ha pogut editar el responsable: " +
        error.message
      );

      return;
    }


    await loadResponsibles();

    return;
  }


  const responsible =
    responsibles.find(
      item =>
        item.code === code
    );


  if (responsible) {

    responsible.name =
      cleanName;
  }


  localSaveResponsibles();

  renderResponsibles();
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


  tasks = data || [];

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


  taskList.innerHTML = "";


  emptyState.hidden =
    visible.length > 0;


  for (const task of visible) {

    const row =
      document.createElement("article");


    row.className =
      "task" +
      (
        task.done
          ? " done"
          : ""
      );


    row.dataset.id =
      task.id;


    // Drag

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


    // Badge

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


    // Edit task

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

async function addTask(
  text,
  responsible
) {

  if (client) {

    isReordering = true;


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

      isReordering = false;

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


    isReordering = false;


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
        (task.position || 0) + 1;
    }
  );


  tasks.unshift({
    id: crypto.randomUUID(),
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
                  taskList
                    .querySelectorAll(
                      ".task"
                    )
                )
                .map(
                  row =>
                    row.dataset.id
                );


            await saveTaskOrder(ids);
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
      .channel("sitges-realtime")

      // Tasques
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

      // Responsables
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "responsibles"
        },
        async () => {

          await loadResponsibles();
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

    editingTaskId = null;

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
// CANCEL TASK
// ==========================

cancelBtn.addEventListener(
  "click",
  () => {

    editingTaskId = null;

    dialog.close();
  }
);


// ==========================
// TASK FORM SUBMIT
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


    editingTaskId = null;

    dialog.close();
  }
);


// ==========================
// OPEN RESPONSIBLES
// ==========================

manageResponsiblesBtn.addEventListener(
  "click",
  () => {

    renderResponsiblesManager();

    responsiblesDialog.showModal();
  }
);


// ==========================
// CLOSE RESPONSIBLES
// ==========================

closeResponsiblesBtn.addEventListener(
  "click",
  () => {

    responsiblesDialog.close();
  }
);


// ==========================
// ADD RESPONSIBLE BUTTON
// ==========================

addResponsibleBtn.addEventListener(
  "click",
  addResponsible
);


// Convertir codi automàticament a majúscules

newResponsibleCode.addEventListener(
  "input",
  () => {

    newResponsibleCode.value =
      newResponsibleCode
        .value
        .toUpperCase()
        .replace(/[^A-ZÀ-Ü]/g, "")
        .slice(0, 2);
  }
);


// Enter en els camps del responsable

newResponsibleName.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {

      event.preventDefault();

      addResponsible();
    }
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