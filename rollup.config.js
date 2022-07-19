import summary from "rollup-plugin-summary";
import { terser } from "rollup-plugin-terser";

import json from '@rollup/plugin-json';
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";

import { createFilter } from "rollup-pluginutils";

function string(opts = {}) {
  if (!opts.include) throw Error("include option should be specified");
  const filter = createFilter(opts.include, opts.exclude);
  
	return {
    name: "string",
    transform(code, id) {
      if (filter(id)) {
        return {
          code: `export default ${JSON.stringify(code)};`,
          map: { mappings: "" },
        };
      }
    },
  };
}

export default [
  {
    input: "src/index.ts",
    output: {
      file: "dist/html-docx.js",
      sourcemap: "inline",
    },
    onwarn(warning) {
      if (warning.code !== "THIS_IS_UNDEFINED") {
        console.error(`(!) ${warning.message}`);
      }
    },
    plugins: [
			string({ include: ['**/*.xml', '**/*.rels', '**/*.tpl']}),
      typescript({ tsconfig: './tsconfig.json' }),
			json(),
      resolve({ browser: true }),
      commonjs(),
      replace({
        preventAssignment: true,
        values: {
          "process.env.NODE_ENV": JSON.stringify(
            process.env.NODE_ENV ?? "development"
          ),
        },
      }),

      terser({
        ecma: 2017,
        module: true,
        warnings: true,
        mangle: {
          properties: {
            regex: /^__/,
          },
        },
      }),

      summary(),
    ],
  },
];
