let addButton = document.querySelector('#add');
let tagArr = [];
let listArr = [];
let pageState = 0;
let removeButton = document.querySelector('#remove');
let editButton = document.querySelector('#edit');
let tagButton = document.querySelector('#tag');
let listButton = document.querySelector('#list');
let selectedTasks = [];
let editorTextArea = document.querySelector('#editor-textarea');
let editorTitle = document.querySelector('#editorTitle');
let addContainer = document.querySelector('#addContainer');
let editorState = 'none';
let addWindowState = 'none';
let modalEditor = document.querySelector('#modalEditor');
let modalAdd = document.querySelector('#modalAdd');
let modalMenu = document.querySelector('#modalMenu');
let closeEditorButton = document.querySelector('#closeEditor');
let saveEditorButton = document.querySelector('#saveTask');
let closeAddButton = document.querySelector('#closeAdd');
let saveAddButton = document.querySelector('#saveAdd');
let addInputBox = document.querySelector('#addInputBox');
let headerLinksBlock = document.querySelector('.headerLinksBlock');
let markContainer = document.querySelector('.markContainer');
let searchButton = document.querySelector('#searchButton');
let searchInput = document.querySelector('#searchInput');
let importLink = document.querySelector('#importLink');
let whoami;
let selectedMarkObject = {
  'list': [],
  'tag': [],
  'sort': {
    'type': 'Title',
    'reversed': false,
  },
}
const selected_color = '#9cbae9';
const none_color = 'white';
// const apiURL = 'http://127.0.0.1:8000/api/';
const apiURL = getCurrentUrl() + '/api/';
const csrftoken = getCookie('csrftoken');
const pageTitle = document.querySelector('title').text;
const tagMark = '+';
const listMark = '@';
const sortOptions = [
  'Title',
  'Creation date',
  'Due date',
];
const queryTemplate = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRFToken': csrftoken,
  },
  mode: 'same-origin',
  body: {
    'text': null,
    'tags': null,
    'lists': null,
    'status': null,
  },
};

function getCurrentUrl() {
  let url = document.URL;
  url = url.slice(0, url.indexOf('/', url.indexOf('//') + 2));
  console.log(url);
  return url;
}

function openFilterColumn() {
  let leftColumn = document.querySelector('#leftColumn');
  let modalMenu = document.querySelector('#modalMenu');
  if (modalMenu.style.display == 'none') {
    modalMenu.style.display = 'block';
    leftColumn.style.display = 'block';
  }
  else {
    modalMenu.style.display = 'none';
    leftColumn.style.display = 'none';
  }
}

function addSpan(text, span='<span>') {
  let indexes = getAllIndexes(text, 'due:');
  for (i = 0; i < indexes.length; i++) {
    let nextSpace = text.indexOf(' ', indexes[i]);
    if (nextSpace == -1) {
      nextSpace = text.length;
    }
    text = `${text.slice(0, indexes[i] - 1)} ${span}${text.slice(indexes[i], nextSpace)}</span>${text.slice(nextSpace)}`;
    indexes = getAllIndexes(text, 'due:');
  }
  return text;
}

function setReverseButtonText(reverseSortOrderButton) {
  if (selectedMarkObject.sort.reversed) {
      reverseSortOrderButton.innerHTML = 'Set ascending order';
    }
    else {
      reverseSortOrderButton.innerHTML = 'Set descending order';
  }
}

async function displaySort() {
  let addWindowTitle = modalAdd.querySelector('.taskTitle');
  addInputBox.value = '';
  modalAdd.style.display = "block";
  addWindowTitle.innerHTML = `Sort tasks`;
  addWindowState = mark;
  addContainer.innerHTML = '';
  saveAddButton.onclick = () => {
    displayPage();
    modalAdd.style.display = "none";
  }
  for (opt of sortOptions) {
    let newNode = document.createElement('p');
    let radioButton = document.createElement('input');
    let label = document.createElement('label');
    if (selectedMarkObject.sort.type === opt) {
      radioButton.checked = true;
    }
    radioButton.type = 'radio'
    radioButton.name = 'sort';
    radioButton.dataset.sort = opt;
    radioButton.onclick = (e) => {
      selectedMarkObject.sort.type = e.target.dataset.sort; 
    }
    label.innerHTML = opt;
    newNode.className = 'markTitle';
    newNode.appendChild(radioButton);
    newNode.appendChild(label);
    addContainer.appendChild(newNode);
  }
  let reverseSortOrderButton = document.createElement('p');
  reverseSortOrderButton.className = 'settingLink';
  setReverseButtonText(reverseSortOrderButton); 
  reverseSortOrderButton.onclick = () => {
    if (selectedMarkObject.sort.reversed) {
      selectedMarkObject.sort.reversed = false;
      setReverseButtonText(reverseSortOrderButton); 
    }
    else {
      selectedMarkObject.sort.reversed = true;
      setReverseButtonText(reverseSortOrderButton); 
    }
  }
  addContainer.appendChild(reverseSortOrderButton);
}

function taskCheckBoxOnclick(event) {
  let checkBox = event.target;
  let taskTitle = checkBox.nextElementSibling.firstElementChild;
  if (checkBox.checked) {
    taskTitle.style.textDecoration = 'line-through';
    selectedTasks.unshift(checkBox.parentElement);
    saveTasks([taskTitle.textContent], 'save');
  }
  else {
    taskTitle.style.textDecoration = 'none';
    selectedTasks.unshift(checkBox.parentElement);
    saveTasks([taskTitle.textContent], 'save');
  }
}

function generateMarkArrs(tasks) {
  tagArr = [];
  listArr = [];
  for (task of tasks) {
    for (let tag of task.tags) {
      if (!tagArr.includes(tag)) {
        tagArr.push(tag);
      }
    }
    for (let list of task.lists) {
      if (!listArr.includes(list)) {
        listArr.push(list);
      }
    }
  }
  return [tagArr, listArr];
}

async function filterQuery(obj={}, url=apiURL) {
  let queryObj = queryTemplate;
  queryObj.body = JSON.stringify(obj);
  let userName = whoami;
  let response = await fetch(url + 'user/' + userName + '/filter/', queryObj);
  response = await response.json();
  return response.tasks;
}

function getMarkWords(task, mark) {
  let result = [];
  let indexes = getAllIndexes(task, mark);
  for (i of indexes) {
    let end = task.indexOf(' ', i);
    if (end === -1) {
      end = task.length;
    }
    let word = task.slice(i + 1, end);
    result.push(word);
  }
  return result;
}

function deleteMarkWords(task, mark, saveArr) {
  let indexes = getAllIndexes(task, mark);
  let newTask = task;
  let j;
  let deleteConuter = 0;
  for (i = 0; i < indexes.length; i++) {
    j = getAllIndexes(newTask, mark)[i - deleteConuter];
    let end = newTask.indexOf(' ', j);
    if (end === -1) {
      end = newTask.length;
    }
    let word = newTask.slice(j + 1, end);
    if (!saveArr.includes(word)) {
      deleteConuter++;
      newTask = newTask.replace(mark + word, '').replace(/ +(?= )/g,'').trim();
    }
  }
  return newTask;
}

function getAllIndexes(text, mark, start=0, result=[]) {
  let newIndex = text.indexOf(mark, start);
  if (newIndex === -1) {
    return result;
  }
  result.push(newIndex);
  return getAllIndexes(text, mark, newIndex + 1, result);
}

async function getUserName(url=apiURL+'whoami/') {
try {
  let response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-CSRFToken': csrftoken,
    },
    mode: 'same-origin',
  });
  let jsonResult =  await response.json();
  whoami = jsonResult.username;
  return jsonResult.username;
}
catch (error) {
  console.log(error);
}
}


function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          // Does this cookie string begin with the name we want?
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
              cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
              break;
          }
      }
  }
  return cookieValue;
}

function removeItem(array, index) {
return array.slice(0, index).concat(array.slice(index + 1));
}

function activateSideButtons() {
if (selectedTasks.length > 0) {
  editButton.style.display = 'unset';  
  tagButton.style.display = 'unset';  
  listButton.style.display = 'unset';  
  removeButton.style.display = 'unset';  
}
else {
  editButton.style.display = 'none';  
  tagButton.style.display = 'none';  
  listButton.style.display = 'none';  
  removeButton.style.display = 'none';  
}
}

async function editTask(data, pk, url=apiURL) {
try {
  let userName = whoami;
  if (url === apiURL) {
    url += 'user/' + userName + '/' + pk + '/';
  }
  let response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken,
    },
    mode: 'same-origin',
    body: JSON.stringify(data),
  });
  return response.json();
}
catch (error) {
  console.log(error);
}
}

async function createTask(data, url=apiURL + 'user/' + whoami + '/') {
  try {
    let query = queryTemplate;
    query.body = JSON.stringify(data);
    let response = await fetch(url, query);
  }
  catch (error) {
    console.log(error);
  }
}

async function deleteTask(pk, url=apiURL + 'user/' + whoami + '/') {
  try {
    let query = queryTemplate;
    query.method = 'DELETE';
    delete query.headers['Content-Type'];
    let response = await fetch(url+pk+'/', query);
  }
  catch (error) {
    console.log(error);
  }
}

async function getTasks(url=apiURL) {
try {
  let userName;
  if (!whoami) {
    userName = await getUserName();
  }
  else {
    userName = whoami;
  }
  if (url === apiURL) {
    url += 'user/' + userName + '/';
  }
  let response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-CSRFToken': csrftoken,
    },
    mode: 'same-origin',
  });
  return await response.json();
}
catch (error) {
  console.log(error);
}
}

async function displayFilterColumn(selectedMarks=selectedMarkObject) {
  let allTasks = await filterQuery();
  let [tagArr, listArr] = generateMarkArrs(allTasks);
  markContainer.innerHTML = '';
  let marksObjectsList = [
    {
      label: 'Lists',
      list: listArr,
      state: 'list',
    },
    {
      label: 'Tags',
      list: tagArr,
      state: 'tag',
    }
  ]
  for (markObject of marksObjectsList) {
    let markLabel = document.createElement('label');
    markLabel.innerHTML = markObject.label;
    markLabel.className = 'markLabel';
    markContainer.appendChild(markLabel);
    let newMarkNode = document.createElement('p');
    let checkBox = document.createElement('input');
    let label = document.createElement('label');
    checkBox.type = 'checkbox'
    checkBox.name = markObject.state + 'None';
    checkBox.className = 'columnMarkCheckBox';
    checkBox.dataset.state = markObject.state;
    checkBox.onclick = async function() {
      let checkBox = this;
      if (!checkBox.checked) {
        selectedMarkObject[checkBox.dataset.state] = selectedMarkObject[checkBox.dataset.state].filter(mark => mark !== checkBox.nextSibling.textContent);
      }
      else {
        if (!selectedMarkObject[checkBox.dataset.state].includes(checkBox.nextSibling.textContent)) {
          selectedMarkObject[checkBox.dataset.state].push(checkBox.nextSibling.textContent);
        }
      }
      displayPage(selectedMarkObject);
    };

    if (selectedMarks[markObject.state] && selectedMarks[markObject.state].includes('None')) {
      checkBox.checked = true;
    }
    label.innerHTML = 'None';
    newMarkNode.className = 'markTitle';
    newMarkNode.appendChild(checkBox);
    newMarkNode.appendChild(label);
    markContainer.appendChild(newMarkNode);
    for (mark of markObject.list) {
      let newMarkNode = document.createElement('p');
      let checkBox = document.createElement('input');
      let label = document.createElement('label');
      checkBox.type = 'checkbox'
      checkBox.name = mark;
      checkBox.className = 'columnMarkCheckBox';
      checkBox.dataset.state = markObject.state;
      checkBox.onclick = async function() {
        let checkBox = this;
        if (!checkBox.checked) {
          selectedMarkObject[checkBox.dataset.state] = selectedMarkObject[checkBox.dataset.state].filter(mark => mark !== checkBox.nextSibling.textContent);
        }
        else {
          if (!selectedMarkObject[checkBox.dataset.state].includes(checkBox.nextSibling.textContent)) {
            selectedMarkObject[checkBox.dataset.state].push(checkBox.nextSibling.textContent);
          }
        }
        displayPage(selectedMarkObject);
      };
      if (selectedMarks[markObject.state] && selectedMarks[markObject.state].includes(mark)) {
        checkBox.checked = true;
      }
      label.innerHTML = mark;
      newMarkNode.className = 'markTitle';
      newMarkNode.appendChild(checkBox);
      newMarkNode.appendChild(label);
      markContainer.appendChild(newMarkNode);
    }
  }
}

async function displayTasks(tasks) {
  let taskContainer = document.querySelector('.taskContainer');
  taskContainer.innerHTML = '';
  for (let task of tasks) {
    let newTaskNode = document.createElement('div');
    newTaskNode.className = 'task';
    newTaskNode.dataset.pk = task.id;
    newTaskNode.onclick = function(event) {
      let task = this;
      if (event.target !== task.querySelector('input')) {
        if (task.dataset.state == 'none' || !task.dataset.state){
          selectedTasks.push(task);
          task.style.background = selected_color;
          task.dataset.state = 'selected'; 
        }
        else {
          selectedTasks = removeItem(selectedTasks, selectedTasks.indexOf(task));
          task.style.background = none_color;
          task.dataset.state = 'none'; 
        }
        activateSideButtons();
      }
    };
    task.text = addSpan(task.text, '<span class="dueSpan">');
    newTaskNode.innerHTML = `
      <input class="taskCheckbox" type="checkbox" onclick="taskCheckBoxOnclick(event)" ${task.status == 'done' ? 'checked' : ''}>
      <div class="titleContainer">
        <label class="taskTitle" ${task.status == 'done' ? 'style="text-decoration: line-through;"' : ''}>${task.text}</label>
        <p>${task.date}</p>
      </div>
    `;
    taskContainer.appendChild(newTaskNode);
  }
  selectedTasks = [];
}

async function displayPage(markObj=selectedMarkObject) {
  try{
    if (!whoami) {
      whoami = await getUserName();
    }
    modalMenu.style.display = 'none';
    let tasks = await filterQuery(markObj);
    await displayTasks(tasks);
    await displayFilterColumn(markObj);
  }
  catch(error) {
    console.log(error);
  }
}

if (pageTitle === 'Task editor') {
  headerLinksBlock.style.justifyContent = 'space-between';
  displayPage();
}

removeButton.onclick = () => {
  if (confirm('Are you sure?')) {
    const deleteTasksPromise = new Promise(async function(resolve, reject) {
      try {
        for (let task of selectedTasks) {
          await deleteTask(task.dataset.pk);
        }
      }
      catch(error) {
        reject(error);
      }
      resolve('result');
    });
    deleteTasksPromise.then((result) => {
      displayPage();
      selectedTasks = [];
      activateSideButtons();
    });
  }
}

addButton.onclick = () => {
  editorState = 'add';
  modalEditor.style.display = "block";
  editorTitle.textContent = "Add task";
}

async function saveAdd(taskArr) {
  for (let task of taskArr.filter((task) => !!task)) {
    let tags = getMarkWords(task, tagMark);
    let lists = getMarkWords(task, listMark);
    await createTask({
      'text': task,
      'tags': tags,
      'lists': lists,
      'status': 'active',
    });
  }
}

async function saveEdit(taskArr) {
  for (let i = 0; i < taskArr.filter((task) => !!task).length; i++) {
    if (i < selectedTasks.length) {
        let tags = getMarkWords(taskArr[i], tagMark);
        let lists = getMarkWords(taskArr[i], listMark);
        await editTask({
          'text': taskArr[i],
          'tags': tags,
          'lists': lists,
          'status': selectedTasks[i].firstElementChild.checked ? 'done' : 'active',
        }, selectedTasks[i].dataset.pk);
    }
    else {
      saveAdd([taskArr[i]]);
    }
  }

}

function saveTasks(taskArr, mode) {
  const saveTasksPromise = new Promise(async function(resolve, reject) {
    try {
      if (mode === 'add') {
        await saveAdd(taskArr);
      }
      else {
        await saveEdit(taskArr);
      }
      resolve('result');
    }
    catch(error) {
      console.log(error);
      reject(error);
    }
  });
  saveTasksPromise.then((result) => {
    displayPage(); 
    selectedTasks = [];
    activateSideButtons();
  });
}

saveEditorButton.onclick = () => {
  modalEditor.style.display = "none";
  let newTaskText = editorTextArea.value.trim();
  let newTaskArr = newTaskText.split('\n');
  editorTextArea.value = '';
  saveTasks(newTaskArr, editorState);
}

editButton.onclick = async function() {
  editorState = 'edit';
  modalEditor.style.display = "block";
  editorTitle.textContent = "Edit task";
  editorTextArea.value = selectedTasks.map((task) => {
    return task.querySelector('.taskTitle').textContent;
  }).join('\n');
}

function markButtonOnclick(arr, mark) {
  let addWindowTitle = modalAdd.querySelector('.taskTitle');
  let selectedMarks = [];
  let markChar;
  saveAddButton.onclick = () => {
    saveAddButtonOnclick();
  }
  addInputBox.style.display = 'block';
  addInputBox.value = '';
  modalAdd.style.display = "block";
  addWindowTitle.innerHTML = `Add ${mark}`;
  document.querySelector('#addInputBox').placeholder = `New ${mark}`;
  addWindowState = mark;
  addContainer.innerHTML = '';
  if (mark === 'tag') {
    markChar = tagMark;
  }
  else if (mark === 'list'){
    markChar = listMark;
  }
  for (task of selectedTasks) {
    for (mark of getMarkWords(task.querySelector('.taskTitle').textContent, markChar)) {
      selectedMarks.push(mark);
    }
  }
  for (mark of arr) {
    let newMarkNode = document.createElement('p');
    let checkBox = document.createElement('input');
    let label = document.createElement('label');
    if (selectedMarks.includes(mark)) {
      checkBox.checked = true;
    }
    checkBox.type = 'checkbox'
    checkBox.name = mark;
    label.innerHTML = mark;
    newMarkNode.className = 'markTitle';
    newMarkNode.appendChild(checkBox);
    newMarkNode.appendChild(label);
    addContainer.appendChild(newMarkNode);
  }
}

tagButton.onclick = () => {
  markButtonOnclick(tagArr, 'tag');
}

listButton.onclick = () => {
  markButtonOnclick(listArr, 'list');
}

function saveAddButtonOnclick() {
  let markChar;
  let taskArr = []; 
  if (addWindowState === 'tag') {
    markChar = tagMark;
  }
  else if (addWindowState === 'list') {
    markChar = listMark;
  }
  let selectedMarks = Array.from(addContainer.querySelectorAll('.markTitle'));
  selectedMarks = selectedMarks.filter(taskTitle => taskTitle.querySelector('input').checked).map(taskTitle => taskTitle.textContent);
  let newMarkText = addInputBox.value.trim();
  selectedMarks.push(newMarkText);
  for (task of selectedTasks) {
    let taskText = task.querySelector('.taskTitle').textContent.trim();
    for (mark of selectedMarks) {
      if (!taskText.includes(markChar + mark)) {
        taskText += ` ${markChar + mark}`;
      }
    }
    taskText = deleteMarkWords(taskText, markChar, selectedMarks); 
    taskArr.push(taskText);
  }
  modalAdd.style.display = "none";
  saveTasks(taskArr, 'edit');
}

window.onclick = (event) => {
  if (event.target == modalEditor) {
    modalEditor.style.display = "none";
    editorTextArea.value = '';
  }
  else if (event.target == modalAdd) {
    modalAdd.style.display = "none";
  }
  else if (event.target == modalMenu) {
    modalMenu.style.display = "none";
    let leftColumn = document.querySelector('#leftColumn');
    leftColumn.style.display = 'none';
  }
}

closeAddButton.onclick = () => {
  modalAdd.style.display = "none";
}

closeEditorButton.onclick = () => {
  editorState = 'none';
  modalEditor.style.display = "none";
  editorTextArea.value = '';
}

searchButton.onclick = () => {
  let startPageLink = document.querySelector('#startPageLink');
  if (searchInput.style.display === 'block') {
    searchInput.style.display = 'none';
    startPageLink.style.display = 'flex';
  }
  else {
    searchInput.style.display = 'block';
    if (window.innerWidth <= 700) {
      startPageLink.style.display = 'none';
    }
    searchInput.focus();
  }
}

importLink.onclick = () => {
  let uploadForm = document.querySelector('.uploadForm');
  if (uploadForm.style.display === 'flex') {
    uploadForm.style.display = 'none';
  }
  else {
    uploadForm.style.display = 'flex';
  }
}

searchInput.addEventListener('input', function (inputEvent) {
  let obj = selectedMarkObject;
  obj.search = inputEvent.target.value;
  displayPage(obj);
});
