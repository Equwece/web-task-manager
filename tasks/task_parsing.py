import re
from datetime import datetime
date_re = "(0[1-9]|1[0-9]|2[0-9]|3[0-1])(.|-)(0[1-9]|1[0-2])(.|-|)([0-9]{4}|)"
date_format = "%d.%m.%Y"


def get_due_datetime(task):
    try:
        task = task[task.index('due:'):]
        return get_datetime(task)
    except:
        return None


def get_datetime(task, date_re=date_re):
    try:
        date = re.search(date_re, task)
        date = date.group()
        return datetime.strptime(date, date_format)
    except:
        return None


def get_mark_words(task, mark):
    result = []
    indexes = get_indexes(task, mark)
    for i in indexes:
        if ' ' in task[i:]:
            end = task.index(' ', i)
        else:
            end = len(task)
        word = task[i + 1:end]
        result.append(word)
    del indexes
    return result


def get_indexes(text, mark, start=0, result=None):
    if not result:
        result = []
    if mark in text[start:]:
        newIndex = text.index(mark, start)
    else:
        return result
    result.append(newIndex)
    return get_indexes(text, mark, newIndex + 1, result)
