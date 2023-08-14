
import fs   from 'fs';
import yaml from 'yaml'
import { Settings } from '../src/types';

const settings = JSON.parse(JSON.stringify(yaml.parse(fs.readFileSync('testcases/settings.yml', 'utf8'))));

export default settings as Settings