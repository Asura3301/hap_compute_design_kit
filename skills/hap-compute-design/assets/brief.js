'use strict';

const choices = {
  source: ['standalone', 'hap'],
  access: ['public', 'organization', 'invited', 'mixed'],
  style: ['business', 'editorial', 'dark'],
  font: ['sans', 'serif', 'mono'],
  density: ['roomy', 'compact'],
  device: ['both', 'phone', 'desktop'],
};

const legacy = {
  source: ['Самостоятельный сайт', 'Из приложения HAP'],
  access: ['Всем без входа', 'Сотрудникам через учётную запись организации', 'Приглашённым пользователям по учётной записи', 'Публичная часть и личный кабинет'],
  style: ['Спокойное деловое', 'Тёплое редакционное', 'Контрастное тёмное'],
  font: ['Системный без засечек', 'С засечками', 'Моноширинный'],
  density: ['Свободно', 'Компактно'],
  device: ['На телефоне и компьютере', 'На телефоне', 'На компьютере'],
};

function normalizeBrief(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Expected a JSON brief object.');
  if (input.version !== undefined && input.version !== 1) throw Error('Unsupported brief version.');
  const brief = {version: 1};
  for (const [field, allowed] of Object.entries(choices)) {
    const value = input.version === undefined ? allowed[legacy[field].indexOf(input[field])] : input[field];
    if (!allowed.includes(value)) throw Error('Choose a valid value for ' + field + '.');
    brief[field] = value;
  }
  const required = ['project', 'audience', 'task', 'acceptance'];
  if (brief.source === 'hap') required.push('app', 'appName');
  for (const field of [...required, 'pages', 'permissions', 'brand', 'languages', 'needs']) {
    const value = input[field] === undefined && !required.includes(field) ? '' : input[field];
    if (typeof value !== 'string' || value.length > 4000 || (required.includes(field) && !value.trim())) {
      throw Error('Check the value for ' + field + '.');
    }
    brief[field] = value.trim();
  }
  return brief;
}

if (typeof module !== 'undefined') module.exports = {normalizeBrief};
