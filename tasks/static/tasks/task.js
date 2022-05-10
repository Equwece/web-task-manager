let task = 'Test task 1 +tag1 @list1 +tag3 @abc abc';

function getMarkWords(task, mark) {
  let result = [];
  let indexes = getAllIndexes(task, mark);
  for (i of indexes) {
    let word = task.slice(i + 1, task.indexOf(' ', i));
    result.push(word);
  }
  return result;
}

function getAllIndexes(text, mark, start=0, result=[], i=0) {
  let newIndex = text.indexOf(mark, start);
  if (newIndex === -1) {
    return result;
  }
  result.push(newIndex);
  return getAllIndexes(text, mark, newIndex + 1, result, i);
}

console.log(getMarkWords(task, '-'))
