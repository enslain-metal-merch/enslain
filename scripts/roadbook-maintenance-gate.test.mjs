import test from 'node:test';
import assert from 'node:assert/strict';
import {validateMaintenance} from './roadbook-maintenance-gate.mjs';
const make=(date,notes='FULL OK')=>[['Watcher','Last successful scan UTC','Scope','Behavior','Notes'],...['book_maintenance_run','roadbook_daily_base','event_change_gate','cross_system_qa'].map(k=>[k,date,'','',k==='book_maintenance_run'?notes:'OK'])];
test('Tuesday accepts verified Tuesday health',()=>assert.equal(validateMaintenance(make('2026-10-20T04:00:00Z'),new Date('2026-10-20T08:33:00Z')),'today'));
test('Tuesday accepts verified Monday fallback',()=>assert.equal(validateMaintenance(make('2026-10-19T04:00:00Z'),new Date('2026-10-20T08:33:00Z')),'monday-fallback'));
test('Monday fallback rejected on Wednesday',()=>assert.throws(()=>validateMaintenance(make('2026-10-19T04:00:00Z'),new Date('2026-10-21T08:33:00Z'))));
test('partial checkpoint rejected',()=>assert.throws(()=>validateMaintenance(make('2026-10-19T04:00:00Z','PARTIAL'),new Date('2026-10-20T08:33:00Z'))));
test('older checkpoint rejected',()=>assert.throws(()=>validateMaintenance(make('2026-10-18T04:00:00Z'),new Date('2026-10-20T08:33:00Z'))));
