# imv (Interactive Move)

[![Actions Status](https://github.com/robcrocombe/imv/workflows/build/badge.svg)](https://github.com/robcrocombe/imv/actions)

_An interactive file renamer/mover inspired by git_

## Install

```
npm install -g imv
```

## Usage

1) You give imv a list of files you want to move or rename.
```
imv --cleanup './home/*.png'
```
2) It opens the list in your favorite code editor (either by the `--editor` arg or automatically via your git config).
```
./home/customer.png
./home/puppy.png
./home/cat.png
```
3) You make the edits you want, with the tools you already use like multiple cursors and regex.
```
./home-page/user.png
./home-page/puppy.png
./home-page/cat.png
```
4) Save the file and close it …sounds familiar to git commit/rebase?
5) imv will make the changes, the file on each line becomes the new file location.
6) imv deletes the old `/home` directory because we specified `--cleanup` and all the files have moved.
7) You're done!

```
Usage: imv [options] <glob>

imv -- interactive move files

Options:
  -v, --version          output the version number
  -e, --editor <editor>  use this editor to modify your file paths
  -o, --overwrite        overwrite existing files
  -t, --trash            send existing files to the trash bin
  -c, --cleanup          remove empty affected folders after moving files
  -h, --help             output usage information
```

## Limitations

To keep things simple, there are a few limitations:

- It only moves files from the directory and any subdirectories where the `imv` command was made.
- It cannot overwrite files that are also matched by the input glob pattern.
- It cannot swap two file paths.

## Development

You can install imv locally to develop on:

```
npm install
npm run dist
npm link
```

You can now use the `imv` command from your terminal. `npm start` will build in watch mode so you can make edits as you use the tool.

imv uses TypeScript for type safety, ESLint for linting, and Jest for testing.
