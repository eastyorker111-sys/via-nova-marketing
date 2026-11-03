import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
test('secondary analytics entry performs no work before or after a visitor choice',()=>{
 const code=readFileSync(new URL('../src/analytics.mjs',import.meta.url),'utf8');
 const network=()=>{throw new Error('Optional collector attempted a request')};
 runInNewContext(code,{fetch:network,XMLHttpRequest:network,document:new Proxy({},{get:network})});
 assert.ok(!code.includes('inject('));
});
