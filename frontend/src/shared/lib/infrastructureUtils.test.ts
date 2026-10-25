import assert from 'node:assert/strict';
import test from 'node:test';
import { formatDistance, buildRouteUrl } from './infrastructureUtils';

test('formatDistance retorna null para valores nulos ou indefinidos', () => {
  assert.equal(formatDistance(null), null);
  assert.equal(formatDistance(undefined), null);
  assert.equal(formatDistance(NaN), null);
});

test('formatDistance formata distancias menores que 1 km em metros', () => {
  assert.equal(formatDistance(0.8), 'A 800m de você');
  assert.equal(formatDistance(0.35), 'A 350m de você');
  assert.equal(formatDistance(0.05), 'A 50m de você');
});

test('formatDistance formata distancias maiores ou iguais a 1 km com virgula', () => {
  assert.equal(formatDistance(1.4), 'A 1,4 km de você');
  assert.equal(formatDistance(7.1), 'A 7,1 km de você');
  assert.equal(formatDistance(12.0), 'A 12,0 km de você');
});

test('buildRouteUrl gera link de rota com coordenadas corretas no Google Maps por padrao', () => {
  const url = buildRouteUrl(-8.0573, -34.8824);
  assert.equal(url, 'https://www.google.com/maps/dir/?api=1&destination=-8.0573,-34.8824');
});

test('buildRouteUrl gera link do Apple Maps quando a plataforma for ios', () => {
  const url = buildRouteUrl(-8.0573, -34.8824, 'ios');
  assert.equal(url, 'https://maps.apple.com/?daddr=-8.0573,-34.8824');
});
