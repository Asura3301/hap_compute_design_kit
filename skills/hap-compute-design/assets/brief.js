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

const discoveryChoices = {
  mode: ['operate', 'persuade', 'read'],
  login: ['none', 'hap', 'existing'],
  scope: ['preserve', 'selected'],
};

function normalizeBrief(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Expected a JSON brief object.');
  if (input.version !== undefined && ![1, 2].includes(input.version)) throw Error('Unsupported brief version.');
  const brief = {version: input.version === 2 ? 2 : 1};
  for (const [field, allowed] of Object.entries(choices)) {
    const value = input.version === undefined ? allowed[legacy[field].indexOf(input[field])] : input[field];
    if (!allowed.includes(value)) throw Error('Choose a valid value for ' + field + '.');
    brief[field] = value;
  }
  const required = ['project', 'audience', 'task', 'acceptance'];
  if (brief.source === 'hap') required.push('app', 'appName');
  if (brief.version === 2) {
    if (!discoveryChoices.mode.includes(input.mode)) throw Error('Choose a valid page purpose.');
    brief.mode = input.mode;
    brief.login = brief.access === 'public' ? 'none' : input.login;
    if (!discoveryChoices.login.includes(brief.login) || (brief.login === 'none' && brief.access !== 'public')) {
      throw Error('Choose how private users sign in.');
    }
    if (brief.access !== 'public') required.push('permissions');
    if (brief.login === 'existing') required.push('loginNotes');
    if (brief.source === 'hap') {
      if (!discoveryChoices.scope.includes(input.scope)) throw Error('Choose what the website should cover.');
      brief.scope = input.scope;
      required.push('features');
    }
    if (brief.access === 'mixed') required.push('publicPages');
  }
  const optional = ['pages', 'permissions', 'brand', 'languages', 'needs'];
  for (const field of new Set([...required, ...optional])) {
    const value = input[field] === undefined && !required.includes(field) ? '' : input[field];
    if (typeof value !== 'string' || value.length > 4000 || (required.includes(field) && !value.trim())) {
      throw Error('Check the value for ' + field + '.');
    }
    brief[field] = value.trim();
  }
  return brief;
}

function designTokens(brief) {
  const palette = {
    business: ['#f4f6f3', '#20312d', '#ffffff', '#16694c', '#ffffff'],
    editorial: ['#fff1da', '#3d2e22', '#fffcf5', '#864419', '#ffffff'],
    dark: ['#192631', '#f0f5fa', '#243545', '#95dbef', '#192631'],
  }[brief.style];
  const [canvas, ink, panel, accent, onAccent] = palette;
  return {
    canvas, ink, panel, accent,
    'on-accent': onAccent,
    typeface: {sans: 'system-ui, sans-serif', serif: 'Georgia, serif', mono: 'monospace'}[brief.font],
    space: brief.density === 'compact' ? '.65rem' : '1rem',
  };
}

if (typeof module !== 'undefined') module.exports = {normalizeBrief, designTokens};
