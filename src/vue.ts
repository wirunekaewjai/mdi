import * as fsx from 'fs-extra';
import * as path from 'path';
import * as rimraf from 'rimraf';

import { nanoid } from 'nanoid';

interface Args {
  config: string;
}

interface Config {
  out: string;
  icons: string[];
}

export default function exec (args: Args)
{
  const config = getConfig(args.config);

  rimraf.sync(config.out);
  fsx.mkdirpSync(config.out);

  const refs: string[] = [
    `import BaseIcon from './index.vue';`
  ];

  const links: string[] = [
    `Vue.component('mdi-base-icon', BaseIcon);`,
  ];
  
  for (const icon of config.icons) {
    const key = toPascalCase(icon);
    const file = `mdi-${icon}.vue`;

    refs.push(`import ${key} from './${file}';`);
    links.push(`Vue.component('mdi-${icon}', ${key});`);

    const templatePath = path.join(config.out, file);
    const template = getIconTemplate(key);

    fsx.writeFileSync(templatePath, template);
    console.log(templatePath);
  }

  createBaseIcon(config.out);

  const indexPath = path.join(config.out, 'index.ts');
  const indexData = [
    `import Vue from 'vue';`,
    ...refs,
    '',
    ...links,
  ];

  fsx.writeFileSync(indexPath, indexData.join('\n'));
  console.log(indexPath);
}

function createBaseIcon (out: string)
{
  const file = path.join(out, 'index.vue');
  const data = getBaseIconTemplate();

  fsx.writeFileSync(file, data);
  console.log(file);
}

function toPascalCase (text = '')
{
  let result = '';
  let upper = true;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (upper) {
      result += ch.toUpperCase();
      upper = false;
    }
    else if (ch === '-') {
      upper = true;
    }
    else {
      result += ch;
    }
  }

  return result;
}

function getConfig (src: string): Config
{
  const file = fsx.readFileSync(src);
  const data = file.toString('utf8');

  if (src.endsWith('.json')) {
    return JSON.parse(data);
  }

  return getConfigFromJS(data);
}

function getConfigFromJS (code: string)
{
  const dir = path.join(__dirname, 'temps');
  const id = path.join(dir, nanoid());

  const name = id + '.js';

  fsx.mkdirpSync(dir);
  fsx.writeFileSync(name, code);

  try {
    const data = require(id);

    if (fsx.existsSync(name)) {
      fsx.unlinkSync(name);
    }

    return data;
  }
  catch (err) {
    console.log(err);

    if (fsx.existsSync(name)) {
      fsx.unlinkSync(name);
    }
  }

  return {};
}

const getIconTemplate = (name: string) =>
`<template>
  <mdi-base-icon :path="path" ></mdi-base-icon>
</template>

<script lang="ts">
import Vue from 'vue';
import { mdi${name} } from '@mdi/js';

export default Vue.extend({
  data: () => ({
    path: mdi${name}
  })
});
</script>`;

const getBaseIconTemplate = () =>
`<template>
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
  >
    <path :d="path" ></path>
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    path: {
      type: String,
      required: true,
    },
  },
});
</script>

<style lang="css" scoped>
path { fill: currentColor; }
</style>`;