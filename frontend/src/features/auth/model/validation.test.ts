import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AUTH_INPUT_LIMITS,
  validateName,
  validateEmail,
  validateRegisterPassword,
  validateLoginPassword,
} from './validation';

test('validateName valida preenchimento obrigatório', () => {
  assert.equal(validateName(''), 'Preenchimento obrigatório');
  assert.equal(validateName('    '), 'Preenchimento obrigatório');
  assert.equal(validateName('<script>alert(1)</script>'), 'Preenchimento obrigatório');
});

test('validateName aceita nomes válidos com até 100 caracteres', () => {
  assert.equal(validateName('Maria Clara Silva'), null);
  assert.equal(validateName('José d\'Ávila Gonçalves-Sousa Jr.'), null);
  assert.equal(validateName('A'.repeat(100)), null);
});

test('validateName rejeita nomes com mais de 100 caracteres', () => {
  const longName = 'A'.repeat(101);
  assert.equal(validateName(longName), 'O nome deve conter no máximo 100 caracteres');
});

test('validateEmail valida obrigatoriedade e mensagens customizadas', () => {
  assert.equal(validateEmail(''), 'Preenchimento obrigatório');
  assert.equal(validateEmail('', 'Informe o seu e-mail'), 'Informe o seu e-mail');
});

test('validateEmail valida formato regex', () => {
  assert.equal(validateEmail('emailinvalido'), 'Informe um e-mail válido');
  assert.equal(validateEmail('email@invalido'), 'Informe um e-mail válido');
  assert.equal(validateEmail('estudante@connectadev.com.br'), null);
});

test('validateEmail rejeita e-mails com mais de 254 caracteres', () => {
  const longPrefix = 'a'.repeat(250);
  const longEmail = `${longPrefix}@connecta.dev`;
  assert.equal(validateEmail(longEmail), 'O e-mail deve conter no máximo 254 caracteres');
});

test('validateRegisterPassword valida obrigatoriedade e complexidade mínima', () => {
  assert.equal(validateRegisterPassword(''), 'Preenchimento obrigatório');
  assert.equal(validateRegisterPassword('fraca'), 'A senha não cumpre todos os requisitos de segurança');
  assert.equal(validateRegisterPassword('SemNumero!'), 'A senha não cumpre todos os requisitos de segurança');
  assert.equal(validateRegisterPassword('Sup3rSecret!'), null);
});

test('validateRegisterPassword rejeita senhas com mais de 128 caracteres', () => {
  const longPassword = 'Aa1!' + 'a'.repeat(125);
  assert.equal(validateRegisterPassword(longPassword), 'A senha deve conter no máximo 128 caracteres');
});

test('validateLoginPassword valida regras de login (min 6 e max 128)', () => {
  assert.equal(validateLoginPassword(''), 'Informe sua senha');
  assert.equal(validateLoginPassword('12345'), 'A senha deve conter no mínimo 6 caracteres');
  assert.equal(validateLoginPassword('123456'), null);
  assert.equal(validateLoginPassword('A'.repeat(128)), null);
  assert.equal(validateLoginPassword('A'.repeat(129)), 'A senha deve conter no máximo 128 caracteres');
});
