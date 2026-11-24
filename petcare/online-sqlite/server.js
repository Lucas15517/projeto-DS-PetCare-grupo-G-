'use strict';

// Atalho para iniciar a versão SQLite usando o servidor compartilhado.
process.env.PETCARE_STORAGE = 'sqlite';
require('../server').start();
