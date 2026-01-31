import { v5 as uuidv5 } from 'uuid';

const STANDARD_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const paths = [
    'environments/domain/catacombs.json',
    'domain/catacombs.json',
    'catacombs.json',
    'environments/catacombs.json',
];

console.log('Checking UUIDs for Catacombs...');
paths.forEach(p => {
    console.log(`Path: ${p} -> ID: ${uuidv5(p, STANDARD_NAMESPACE)}`);
});
