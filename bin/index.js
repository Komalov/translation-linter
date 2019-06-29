#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const jscodeshift = require("jscodeshift");

const foundKeys = new Set();

const findAllCallsInFile = file => {
  jscodeshift(file)
    .find(jscodeshift.CallExpression, {
      callee: {
        name: "t"
      }
    })
    .nodes()
    .forEach(({ arguments }) => {
      arguments.forEach(({ value }) => foundKeys.add(value));
    });
};

const dirPath = path.join(__dirname, "src");

const isDirectory = path => fs.lstatSync(path).isDirectory();

const isJS = path => path.match(/.js$/);

const getFiles = dir => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    if (isDirectory(file)) {
      results = results.concat(getFiles(file));
    } else if (isJS(file)) {
      const fileData = fs.readFileSync(file, "utf8");
      results.push(fileData);
    }
  });
  return results;
};

const collectedFilesContent = getFiles(dirPath);

collectedFilesContent.forEach(findAllCallsInFile);

const f = JSON.parse(
  fs.readFileSync(path.join("src", "locales/en/translation.json"), "utf8")
);

const existingTranslations = new Set(Object.keys(f.translation));

const errors = new Set();

foundKeys.forEach(key => {
  if (!existingTranslations.has(key)) {
    errors.add(key);
  }
});

if (errors.size) {
  console.log(chalk.bgRed("Missing translation: \n"), [...errors].join("\n"));
  process.exit(1);
} else {
  console.log(chalk.bgGreen("Successefully"));
  process.exit(0);
}
